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
  requested: '待帮助者确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

function fmtTime(iso?: string) {
  if (!iso) return '待定';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
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
      setNotice(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const sendAction = async (body: Record<string, unknown>) => {
    if (!user) {
      setNotice('请先登录（右上角可切换演示账号）');
      return false;
    }
    try {
      await apiSend(`/api/plaza/${id}`, 'POST', body);
      await load();
      return true;
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败');
      return false;
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) {
      setNotice('评论内容不能为空');
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
      setNotice('评论已发布。');
    }
  };

  const handleKudos = async () => {
    const ok = await sendAction({ action: 'kudos' });
    if (ok) setNotice('你的加油已被收到。');
  };

  const handleReport = async () => {
    const ok = await sendAction({ action: 'report', reason: reportReason.trim() });
    if (ok) {
      setReportOpen(false);
      setReportReason('');
      setNotice('已收到举报，我们会尽快核查。');
    }
  };

  const handleResolve = async () => {
    const ok = await sendAction({ action: 'resolve' });
    if (ok) setNotice('已标记为「已解决」。');
  };

  const handleCreateChat = async () => {
    if (!user) {
      setNotice('请先登录（右上角可切换演示账号）');
      return;
    }
    if (!selectedHelper) return;
    if (!proposedTime) {
      setNotice('请先选择你方便的提议时间');
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
      setNotice('已发出预约，等待帮助者确认。');
      setSelectedHelper(null);
      setProposedTime('');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('已被预约') || msg.includes('被预约')) {
        setNotice('该帮助者已被预约，请选择另一位姐妹。');
      } else {
        setNotice(msg || '预约失败');
      }
    } finally {
      setBooking(false);
    }
  };

  const handleChatAction = async (body: Record<string, unknown>) => {
    if (!user) {
      setNotice('请先登录（右上角可切换演示账号）');
      return;
    }
    try {
      await apiSend('/api/peer-chats', 'POST', body);
      setNotice('操作成功。');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败');
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-slateblue-700">加载中…</p>
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
          返回广场
        </Link>
        <EmptyState text={notice || '帖子不存在或已被隐藏'} />
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
        返回广场
      </Link>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {!authLoading && !user ? (
        <div className="rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-sm font-bold text-coral-700">
          请先登录（右上角可切换演示账号）
        </div>
      ) : null}

      {/* 帖子主体 */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {post.status === 'resolved' ? (
            <Badge tone="green">已解决</Badge>
          ) : (
            <Badge>进行中</Badge>
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
                alt={`帖子图片 ${i + 1}`}
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
            {post.willingToHelpCount} 人同行
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {post.kudosCount} 加油
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount} 评论
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleKudos()}>
            <Heart className="h-4 w-4" />
            加油
          </Button>
          {myWilling ? (
            <span className="inline-flex items-center rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white">
              ✓ 已同行
            </span>
          ) : (
            <Button
              variant="outline"
              onClick={async () => {
                if (!user) {
                  setNotice('请先登录（右上角可切换演示账号）');
                  return;
                }
                try {
                  await apiSend(`/api/plaza/${id}/willing`, 'POST');
                  setNotice('已同行：谢谢你愿意陪她走一段。');
                  await load();
                } catch (e) {
                  const msg = e instanceof Error ? e.message : '';
                  setNotice(
                    msg.includes('已经')
                      ? '你已经报名同行。'
                      : msg || '操作失败'
                  );
                }
              }}
            >
              我愿同行
            </Button>
          )}
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            举报
          </Button>
          {isAuthor ? (
            <Button variant="secondary" onClick={() => void handleResolve()}>
              标记为已解决
            </Button>
          ) : null}
        </div>
      </Card>

      {/* 同辈互助预约（仅作者可见帮助者列表） */}
      {canBookWilling ? (
        <Card className="!bg-softpink-100">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slateblue-900">
              {helpers.length} 位姐妹愿同行
            </h2>
            <Badge tone="green">公益 · 同辈互助</Badge>
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
                          <Badge tone="coral">已被预约</Badge>
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
                      {selected ? '已选择' : '免费预约同辈聊天'}
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
                  与 {selectedHelper.helperName} 的免费同辈聊天
                </span>
                <Badge tone="green">公益 · 同辈互助</Badge>
                <span className="text-xs font-bold text-warmgreen">
                  免费，不涉及任何费用
                </span>
              </div>
              <label className="mt-3 block">
                <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
                  提议时间
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
                  {booking ? '预约中…' : '发送免费预约'}
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* 本次同辈互助进度（当前用户参与时） */}
      {chat ? (
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-extrabold text-slateblue-900">
              本次同辈互助
            </h2>
            <Badge tone="green">免费 · 同辈互助</Badge>
            <Badge tone={chat.status === 'completed' ? 'green' : 'coral'}>
              {PEER_STATUS_LABELS[chat.status]}
            </Badge>
          </div>

          <div className="space-y-1 text-sm text-slateblue-700">
            <p>
              发起人：<span className="font-bold">{chat.requesterName}</span>
              {' · '}帮助者：
              <span className="font-bold">{chat.helperName}</span>
            </p>
            <p>
              提议时间：<span className="font-bold">{fmtTime(chat.proposedTime)}</span>
              {chat.confirmedTime
                ? ` · 确认时间：${fmtTime(chat.confirmedTime)}`
                : ''}
            </p>
            {chat.chatLink &&
            (chat.status === 'confirmed' || chat.status === 'completed') ? (
              <p>
                聊天链接：
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
                感谢：{chat.appreciation}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            {chatIsHelper && chat.status === 'requested' ? (
              <>
                <input
                  value={confirmLink}
                  onChange={(e) => setConfirmLink(e.target.value)}
                  placeholder="聊天链接（可选）"
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
                  确认
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
                标记完成
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
                  placeholder="写一句感谢，会为对方生成一份同辈感谢证据"
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
                    发送感谢
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* 评论 */}
      <Card>
        <h2 className="mb-3 text-base font-extrabold text-slateblue-900">
          评论（{comments.length}）
        </h2>

        {comments.length === 0 ? (
          <EmptyState text="还没有评论，来做第一个回应的人吧。" />
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
            placeholder="写下你的回应：先共情，再分享"
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
              匿名评论
            </label>
            <Button onClick={() => void handleComment()}>发表评论</Button>
          </div>
        </div>
      </Card>

      {/* 举报 Modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="举报本帖">
        <div className="space-y-3">
          <p className="text-sm text-slateblue-700">
            请描述你认为不合适的地方，我们会尽快核查。
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            placeholder="举报理由"
            className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReportOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handleReport()}>提交举报</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
