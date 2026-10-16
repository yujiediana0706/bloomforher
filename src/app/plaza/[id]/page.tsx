'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Users } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type {
  PeerChat,
  PlazaComment,
  PlazaPost,
  WillingToHelp,
} from '@/lib/types';

interface PlazaPostView extends Omit<PlazaPost, 'authorId'> {
  authorDisplay: string;
  viewerIsAuthor: boolean;
}

interface PlazaCommentView extends Omit<PlazaComment, 'authorId'> {
  authorDisplay: string;
}

interface DetailData {
  post: PlazaPostView;
  comments: PlazaCommentView[];
  willing: WillingToHelp[] | null;
  myWilling: boolean;
  isAuthor: boolean;
}

const PEER_STATUS_LABELS: Record<PeerChat['status'], string> = {
  requested: 'Awaiting helper confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function fmtTime(iso?: string) {
  if (!iso) return 'TBD';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toIsoFromLocal(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

export default function PlazaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<DetailData | null>(null);
  const [chat, setChat] = useState<PeerChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const [commentText, setCommentText] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const [selectedHelper, setSelectedHelper] = useState<WillingToHelp | null>(
    null
  );
  const [proposedTime, setProposedTime] = useState('');
  const [booking, setBooking] = useState(false);

  const [confirmLink, setConfirmLink] = useState('');
  const [appreciateText, setAppreciateText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<DetailData>(`/api/plaza/${id}`);
      setData(d);
      if (user) {
        try {
          const pc = await apiGet<{ peerChats: PeerChat[] }>(
            '/api/peer-chats'
          );
          setChat(pc.peerChats.find((c) => c.postId === id) ?? null);
        } catch {
          setChat(null);
        }
      } else {
        setChat(null);
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendAction = async (body: Record<string, unknown>) => {
    if (!user) {
      setNotice('Please sign in (switch demo accounts in the top-right corner)');
      return false;
    }
    try {
      await apiSend(`/api/plaza/${id}`, 'POST', body);
      await load();
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed');
      return false;
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) {
      setNotice('Comment cannot be empty');
      return;
    }
    const ok = await sendAction({
      action: 'comment',
      text: commentText.trim(),
      anonymous: commentAnonymous,
    });
    if (ok) {
      setCommentText('');
      setCommentAnonymous(false);
      setNotice('Comment posted.');
    }
  };

  const handleKudos = async () => {
    const ok = await sendAction({ action: 'kudos' });
    if (ok) setNotice('Your kudos has been received.');
  };

  const handleReport = async () => {
    const ok = await sendAction({ action: 'report', reason: reportReason.trim() });
    if (ok) {
      setReportOpen(false);
      setReportReason('');
      setNotice('Report received — we will review it soon.');
    }
  };

  const handleResolve = async () => {
    const ok = await sendAction({ action: 'resolve' });
    if (ok) setNotice('Marked as resolved.');
  };

  const handleCreateChat = async () => {
    if (!user) {
      setNotice('Please sign in (switch demo accounts in the top-right corner)');
      return;
    }
    if (!selectedHelper) return;
    if (!proposedTime) {
      setNotice('Please pick a proposed time that works for you');
      return;
    }
    setBooking(true);
    try {
      await apiSend('/api/peer-chats', 'POST', {
        action: 'create',
        postId: id,
        helperUid: selectedHelper.helperUid,
        proposedTime: toIsoFromLocal(proposedTime),
      });
      setNotice('Booking sent — waiting for the helper to confirm.');
      setSelectedHelper(null);
      setProposedTime('');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('booked')) {
        setNotice('That helper is already booked — please pick another peer.');
      } else {
        setNotice(msg || 'Booking failed');
      }
    } finally {
      setBooking(false);
    }
  };

  const handleChatAction = async (body: Record<string, unknown>) => {
    if (!user) {
      setNotice('Please sign in (switch demo accounts in the top-right corner)');
      return;
    }
    try {
      await apiSend('/api/peer-chats', 'POST', body);
      setNotice('Done.');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-slateblue-700">Loading…</p>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link
          href="/plaza"
          className="inline-flex items-center gap-1 text-sm font-bold text-coral-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plaza
        </Link>
        <EmptyState text={notice || 'This post does not exist or has been hidden'} />
      </div>
    );
  }

  const { post, comments, willing, myWilling, isAuthor } = data;
  const helpers = willing ?? [];
  const canBookWilling = isAuthor && helpers.length > 0;
  const chatIsHelper = chat && user ? chat.helperId === user.uid : false;
  const chatIsRequester = chat && user ? chat.requesterId === user.uid : false;

  return (
    <div className="space-y-5">
      <Link
        href="/plaza"
        className="inline-flex items-center gap-1 text-sm font-bold text-coral-600 hover:text-coral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to plaza
      </Link>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {!authLoading && !user ? (
        <div className="rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-sm font-bold text-coral-700">
          Please sign in (switch demo accounts in the top-right corner)
        </div>
      ) : null}

      {/* Post body */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {post.status === 'resolved' ? (
            <Badge tone="green">Resolved</Badge>
          ) : (
            <Badge>Open</Badge>
          )}
          <span className="text-xs font-bold text-slateblue-900">
            {post.authorDisplay}
          </span>
          <span className="text-xs text-slateblue-700">
            {fmtTime(post.createdAt)}
          </span>
        </div>

        {post.title ? (
          <h1 className="mt-2 text-lg font-black text-slateblue-900">
            {post.title}
          </h1>
        ) : null}
        {post.body ? (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slateblue-700">
            {post.body}
          </p>
        ) : null}

        {post.images.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {post.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${i}-${src.slice(-12)}`}
                src={src}
                alt={`Post image ${i + 1}`}
                className="w-full rounded-xl border border-silver-200 object-cover"
              />
            ))}
          </div>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-silver-300 bg-white/70 px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slateblue-700">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {post.willingToHelpCount} willing to help
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {post.kudosCount} kudos
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount} comments
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleKudos()}>
            <Heart className="h-4 w-4" />
            Kudos
          </Button>
          {myWilling ? (
            <span className="inline-flex items-center rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white">
              ✓ Willing to help
            </span>
          ) : (
            <Button
              variant="outline"
              onClick={async () => {
                if (!user) {
                  setNotice('Please sign in (switch demo accounts in the top-right corner)');
                  return;
                }
                try {
                  await apiSend(`/api/plaza/${id}/willing`, 'POST');
                  setNotice('Marked as willing to help — thank you for walking alongside her.');
                  await load();
                } catch (e) {
                  const msg = e instanceof Error ? e.message : '';
                  setNotice(
                    msg.includes('already')
                      ? 'You are already willing to help.'
                      : msg || 'Action failed'
                  );
                }
              }}
            >
              I'm willing to help
            </Button>
          )}
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            Report
          </Button>
          {isAuthor ? (
            <Button variant="secondary" onClick={() => void handleResolve()}>
              Mark as resolved
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Peer coffee chat booking (helper list visible to the author only) */}
      {canBookWilling ? (
        <Card className="!bg-softpink-100">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slateblue-900">
              {helpers.length} peers willing to help
            </h2>
            <Badge tone="green">Free · peer support</Badge>
          </div>
          <div className="space-y-3">
            {helpers.map((w) => {
              const selectable = w.status === 'offered';
              const selected = selectedHelper?.helperUid === w.helperUid;
              return (
                <div
                  key={w.helperUid}
                  className="rounded-2xl border border-silver-300 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    {w.helperAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={w.helperAvatarUrl}
                        alt={w.helperName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-50 text-sm font-black text-coral-600">
                        {w.helperName.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slateblue-900">
                          {w.helperName}
                        </span>
                        <Badge>{w.helperLifeStage}</Badge>
                        {w.status !== 'offered' ? (
                          <Badge tone="coral">Already booked</Badge>
                        ) : null}
                      </div>
                      {w.helperBio ? (
                        <p className="mt-1 text-xs leading-relaxed text-slateblue-700">
                          {w.helperBio}
                        </p>
                      ) : null}
                      {w.helperSkills.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {w.helperSkills.map((s) => (
                            <span
                              key={s}
                              className="rounded-full border border-silver-300 bg-silver-50 px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      variant={selected ? 'primary' : 'outline'}
                      disabled={!selectable}
                      onClick={() => {
                        setSelectedHelper(selected ? null : w);
                        setProposedTime('');
                      }}
                    >
                      {selected ? 'Selected' : 'Book a free peer coffee chat'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedHelper ? (
            <div className="mt-4 rounded-2xl border border-coral-100 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-slateblue-900">
                  Free peer coffee chat with {selectedHelper.helperName}
                </span>
                <Badge tone="green">Free · peer support</Badge>
                <span className="text-xs font-bold text-warmgreen">
                  Free — no cost involved
                </span>
              </div>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
                  Proposed time
                </span>
                <input
                  type="datetime-local"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                />
              </label>
              <div className="mt-3 flex justify-end">
                <Button
                  onClick={() => void handleCreateChat()}
                  disabled={booking}
                >
                  {booking ? 'Booking…' : 'Send free booking request'}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* Peer support progress for this post (when the current user is involved) */}
      {chat ? (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold text-slateblue-900">
              This peer coffee chat
            </h2>
            <Badge tone="green">Free · peer support</Badge>
            <Badge tone={chat.status === 'completed' ? 'green' : 'coral'}>
              {PEER_STATUS_LABELS[chat.status]}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-slateblue-700">
            <p>
              Requester: <span className="font-bold">{chat.requesterName}</span>
              {' · '}Helper:
              <span className="font-bold">{chat.helperName}</span>
            </p>
            <p>
              Proposed time:{' '}
              <span className="font-bold">{fmtTime(chat.proposedTime)}</span>
              {chat.confirmedTime
                ? ` · Confirmed time: ${fmtTime(chat.confirmedTime)}`
                : ''}
            </p>
            {chat.chatLink &&
            (chat.status === 'confirmed' || chat.status === 'completed') ? (
              <p>
                Chat link:{' '}
                <a
                  href={chat.chatLink}
                  className="font-bold text-coral-600 underline"
                >
                  {chat.chatLink}
                </a>
              </p>
            ) : null}
            {chat.appreciation ? (
              <p className="rounded-xl bg-softpink-100 px-3 py-2 text-slateblue-900">
                Appreciation: {chat.appreciation}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            {chatIsHelper && chat.status === 'requested' ? (
              <>
                <input
                  value={confirmLink}
                  onChange={(e) => setConfirmLink(e.target.value)}
                  placeholder="Chat link (optional)"
                  className="min-w-[180px] flex-1 rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                />
                <Button
                  onClick={() =>
                    void handleChatAction({
                      action: 'confirm',
                      chatId: chat.id,
                      chatLink: confirmLink.trim() || undefined,
                    })
                  }
                >
                  Confirm
                </Button>
              </>
            ) : null}

            {chat.status === 'requested' || chat.status === 'confirmed' ? (
              <Button
                variant="secondary"
                onClick={() =>
                  void handleChatAction({
                    action: 'complete',
                    chatId: chat.id,
                  })
                }
              >
                Mark complete
              </Button>
            ) : null}

            {chatIsRequester &&
            chat.status === 'completed' &&
            !chat.appreciation ? (
              <div className="w-full">
                <textarea
                  value={appreciateText}
                  onChange={(e) => setAppreciateText(e.target.value)}
                  rows={2}
                  placeholder="Write a thank-you note — it creates a peer appreciation record for them"
                  className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() =>
                      void handleChatAction({
                        action: 'appreciate',
                        chatId: chat.id,
                        text: appreciateText.trim(),
                      })
                    }
                  >
                    Send thanks
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Comments */}
      <Card>
        <h2 className="mb-3 text-base font-extrabold text-slateblue-900">
          Comments ({comments.length})
        </h2>

        {comments.length === 0 ? (
          <EmptyState text="No comments yet — be the first to respond." />
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-silver-300 bg-silver-50 p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slateblue-900">
                    {c.authorDisplay}
                  </span>
                  <span className="text-[11px] text-slateblue-700">
                    {fmtTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slateblue-900">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Write your reply: empathize first, then share"
            className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slateblue-900">
              <input
                type="checkbox"
                checked={commentAnonymous}
                onChange={(e) => setCommentAnonymous(e.target.checked)}
                className="h-4 w-4 accent-coral-500"
              />
              Comment anonymously
            </label>
            <Button onClick={() => void handleComment()}>Post comment</Button>
          </div>
        </div>
      </Card>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this post">
        <div className="space-y-3">
          <p className="text-sm text-slateblue-700">
            Describe what you think is inappropriate — we will review it soon.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            placeholder="Reason for reporting"
            className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleReport()}>Submit report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
