'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Card, Chip, EmptyState } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type {
  Booking,
  BookingStatus,
  Mentor,
  PackageOrder,
  PeerChat,
} from '@/lib/types';

const PEER_STATUS_LABELS: Record<PeerChat['status'], string> = {
  requested: 'Awaiting helper confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  held: 'Payment held in escrow',
  confirmed: 'Confirmed',
  completed: 'Awaiting student confirmation',
  released: 'Completed · funds released',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const BOOKING_STATUS_TONES: Record<
  BookingStatus,
  'silver' | 'coral' | 'green' | 'red'
> = {
  held: 'coral',
  confirmed: 'green',
  completed: 'coral',
  released: 'green',
  rejected: 'red',
  cancelled: 'silver',
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

export default function MySessionsPage() {
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<'peer' | 'mentor'>('peer');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [peerChats, setPeerChats] = useState<PeerChat[]>([]);
  const [packageOrders, setPackageOrders] = useState<PackageOrder[]>([]);
  const [mentorOwnedIds, setMentorOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const [confirmLink, setConfirmLink] = useState<Record<string, string>>({});
  const [appreciateText, setAppreciateText] = useState<Record<string, string>>(
    {}
  );
  const [reviewForm, setReviewForm] = useState<
    Record<string, { rating: number; comment: string }>
  >({});
  const [endorseText, setEndorseText] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setPeerChats([]);
      setPackageOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiGet<{
        bookings: Booking[];
        peerChats: PeerChat[];
        packageOrders: PackageOrder[];
      }>('/api/my-sessions');
      setBookings(data.bookings);
      setPeerChats(data.peerChats);
      setPackageOrders(data.packageOrders);

      try {
        const m = await apiGet<{ mentors: Mentor[] }>('/api/mentors');
        setMentorOwnedIds(
          new Set(m.mentors.filter((x) => x.userId === user.uid).map((x) => x.id))
        );
      } catch {
        setMentorOwnedIds(new Set());
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const peerAction = async (body: Record<string, unknown>) => {
    try {
      await apiSend('/api/peer-chats', 'POST', body);
      setNotice('Done.');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const bookingAction = async (body: Record<string, unknown>) => {
    try {
      await apiSend('/api/bookings', 'POST', body);
      setNotice('Done.');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const submitReview = async (bookingId: string) => {
    const form = reviewForm[bookingId];
    if (!form) return;
    if (!form.rating) {
      setNotice('Please select a rating');
      return;
    }
    if (form.comment.trim().length < 5) {
      setNotice('Your review must be at least 5 characters.');
      return;
    }
    try {
      await apiSend('/api/reviews', 'POST', {
        bookingId,
        rating: form.rating,
        comment: form.comment.trim(),
      });
      setNotice('Review submitted—thank you for helping other women.');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to submit review');
    }
  };

  if (authLoading) {
    return (
      <p className="py-10 text-center text-sm text-slateblue-700">Loading…</p>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-black text-slateblue-900">My sessions</h1>
        <EmptyState text="Please sign in first." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-black text-slateblue-900 sm:text-xl">
          My sessions
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          Peer support is 100% free · professional mentors are paid
        </p>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === 'peer'} onClick={() => setTab('peer')}>
          Peer support (free)
        </Chip>
        <Chip active={tab === 'mentor'} onClick={() => setTab('mentor')}>
          Mentor sessions (paid)
        </Chip>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-slateblue-700">Loading…</p>
      ) : tab === 'peer' ? (
        /* —— Peer support (free) —— */
        peerChats.length === 0 ? (
          <EmptyState text="No peer support records yet. Head to the conversation plaza and reply to someone." />
        ) : (
          <div className="space-y-4">
            {peerChats.map((c) => {
              const isHelper = c.helperId === user.uid;
              const isRequester = c.requesterId === user.uid;
              const counterpart = isHelper ? c.requesterName : c.helperName;
              const linkVisible =
                (c.status === 'confirmed' || c.status === 'completed') &&
                !!c.chatLink;
              return (
                <Card key={c.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="green">Free · Peer support</Badge>
                    <Badge tone={c.status === 'completed' ? 'green' : 'coral'}>
                      {PEER_STATUS_LABELS[c.status]}
                    </Badge>
                    <span className="text-xs font-bold text-slateblue-700">
                      {isHelper ? "You're the helper" : "You're the requester"} ·
                      With: {counterpart}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slateblue-700">
                    <p>
                      Proposed time:{' '}
                      <span className="font-bold">
                        {fmtTime(c.proposedTime)}
                      </span>
                      {c.confirmedTime
                        ? ` · Confirmed: ${fmtTime(c.confirmedTime)}`
                        : ''}
                    </p>
                    {linkVisible ? (
                      <p>
                        Chat link:{' '}
                        <a
                          href={c.chatLink}
                          className="font-bold text-coral-600 underline"
                        >
                          {c.chatLink}
                        </a>
                      </p>
                    ) : null}
                    {c.appreciation ? (
                      <p className="rounded-xl bg-softpink-100 px-3 py-2 text-slateblue-900">
                        Thanks: {c.appreciation}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    {isHelper && c.status === 'requested' ? (
                      <>
                        <input
                          value={confirmLink[c.id] ?? ''}
                          onChange={(e) =>
                            setConfirmLink((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder="Chat link (optional)"
                          className="min-w-[180px] flex-1 rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                        />
                        <Button
                          onClick={() =>
                            void peerAction({
                              action: 'confirm',
                              chatId: c.id,
                              chatLink: (confirmLink[c.id] ?? '').trim() || undefined,
                            })
                          }
                        >
                          Confirm
                        </Button>
                      </>
                    ) : null}

                    {(c.status === 'requested' || c.status === 'confirmed') &&
                    (isHelper || isRequester) ? (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          void peerAction({ action: 'complete', chatId: c.id })
                        }
                      >
                        Mark as complete
                      </Button>
                    ) : null}

                    {isRequester &&
                    c.status === 'completed' &&
                    !c.appreciation ? (
                      <div className="w-full">
                        <textarea
                          value={appreciateText[c.id] ?? ''}
                          onChange={(e) =>
                            setAppreciateText((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Write a short thank-you—it creates a peer-appreciation evidence entry for them."
                          className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() =>
                              void peerAction({
                                action: 'appreciate',
                                chatId: c.id,
                                text: (appreciateText[c.id] ?? '').trim(),
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
              );
            })}
          </div>
        )
      ) : /* —— Mentor sessions (paid) —— */
      bookings.length === 0 ? (
        <EmptyState text="No mentor sessions yet. Visit the mentor community to find a mentor who understands you." />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const isStudent = b.coacheeId === user.uid;
            const isMentorRole = mentorOwnedIds.has(b.mentorId);
            const linkVisible =
              (b.status === 'confirmed' ||
                b.status === 'completed' ||
                b.status === 'released') &&
              !!b.meetingLink;
            const canReview =
              isStudent && b.status === 'released' && !b.review;
            const form = reviewForm[b.id];
            return (
              <Card key={b.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={BOOKING_STATUS_TONES[b.status]}>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </Badge>
                  <span className="text-xs font-bold text-slateblue-700">
                    {b.kind === 'package' ? '5-session package' : 'Single session'}{' '}
                    ·{' '}
                    {isStudent ? "You're the student" : isMentorRole ? "You're the mentor" : ''}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-slateblue-900">
                  {isStudent ? b.mentorName : b.coacheeName} · {b.topic}
                </h3>

                <div className="mt-2 space-y-1 text-sm text-slateblue-700">
                  <p>
                    Time:{' '}
                    <span className="font-bold">
                      {fmtTime(b.scheduledTime)}
                    </span>
                  </p>
                  <p>
                    Amount:{' '}
                    <span className="font-bold">${b.amount}</span>
                    <span className="ml-2 text-[11px] font-bold text-slateblue-700">
                      Demo environment · simulated charge/release
                    </span>
                  </p>
                  {linkVisible ? (
                    <p>
                      Meeting link:{' '}
                      <a
                        href={b.meetingLink}
                        className="font-bold text-coral-600 underline"
                      >
                        {b.meetingLink}
                      </a>
                    </p>
                  ) : null}
                  {b.review ? (
                    <p className="rounded-xl bg-softpink-100 px-3 py-2 text-slateblue-900">
                      Your review: {b.review.rating} stars · {b.review.comment}
                    </p>
                  ) : null}
                  {b.endorsement ? (
                    <p className="rounded-xl bg-warmgreen/15 px-3 py-2 text-slateblue-900">
                      Mentor endorsement: {b.endorsement}
                    </p>
                  ) : null}
                </div>

                {/* Mentor actions */}
                {isMentorRole ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.status === 'held' ? (
                      <>
                        <Button
                          onClick={() =>
                            void bookingAction({
                              action: 'confirm',
                              bookingId: b.id,
                            })
                          }
                        >
                          Confirm booking
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            void bookingAction({
                              action: 'reject',
                              bookingId: b.id,
                            })
                          }
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {b.status === 'confirmed' ? (
                      <Button
                        onClick={() =>
                          void bookingAction({
                            action: 'complete',
                            bookingId: b.id,
                          })
                        }
                      >
                        Mark as complete
                      </Button>
                    ) : null}
                    {b.status === 'released' && !b.endorsement ? (
                      <div className="w-full">
                        <textarea
                          value={endorseText[b.id] ?? ''}
                          onChange={(e) =>
                            setEndorseText((prev) => ({
                              ...prev,
                              [b.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Write a short endorsement for the student—it creates a mentor-endorsement evidence entry."
                          className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            onClick={() =>
                              void bookingAction({
                                action: 'endorse',
                                bookingId: b.id,
                                text: (endorseText[b.id] ?? '').trim(),
                              })
                            }
                          >
                            Submit endorsement
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Student actions */}
                {isStudent ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.status === 'completed' ? (
                      <Button
                        onClick={() =>
                          void bookingAction({
                            action: 'release',
                            bookingId: b.id,
                          })
                        }
                      >
                        Confirm completion (release funds to mentor)
                      </Button>
                    ) : null}
                    {canReview ? (
                      <div className="w-full rounded-2xl border border-silver-300 bg-silver-50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slateblue-700">
                            Rating
                          </span>
                          <select
                            value={form?.rating ?? 0}
                            onChange={(e) =>
                              setReviewForm((prev) => ({
                                ...prev,
                                [b.id]: {
                                  rating: Number(e.target.value),
                                  comment: prev[b.id]?.comment ?? '',
                                },
                              }))
                            }
                            className="rounded-xl border border-silver-300 bg-white px-2 py-1.5 text-sm font-bold text-slateblue-900 outline-none focus:border-coral-500"
                          >
                            <option value={0}>Select</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} stars
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={form?.comment ?? ''}
                          onChange={(e) =>
                            setReviewForm((prev) => ({
                              ...prev,
                              [b.id]: {
                                rating: prev[b.id]?.rating ?? 0,
                                comment: e.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Share your honest experience (at least 5 characters)"
                          className="mt-2 w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button onClick={() => void submitReview(b.id)}>
                            Submit review
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}

          {packageOrders.length > 0 ? (
            <Card>
              <h3 className="text-base font-extrabold text-slateblue-900">
                Package orders
              </h3>
              <div className="mt-2 space-y-2">
                {packageOrders.map((o) => (
                  <p key={o.id} className="text-sm text-slateblue-700">
                    {o.totalSessions}-session package · {o.remainingRedemptions}{' '}
                    remaining · ${o.amount} ·{' '}
                    <span className="font-bold">
                      {o.status === 'active' ? 'Active' : 'Used up'}
                    </span>
                    <span className="ml-2 text-[11px] font-bold">
                      Demo environment · simulated charge
                    </span>
                  </p>
                ))}
              </div>
            </Card>
          ) : null}

          <p className="text-center text-xs font-bold text-slateblue-700">
            Want to see more mentors?
            <Link href="/community" className="ml-1 text-coral-600 underline">
              Go to the mentor community
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
