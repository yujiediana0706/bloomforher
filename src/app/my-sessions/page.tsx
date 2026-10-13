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
  requested: '待帮助者确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  held: '费用托管中',
  confirmed: '已确认',
  completed: '待学员确认完成',
  released: '已完成 · 已放款',
  rejected: '已拒绝',
  cancelled: '已取消',
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
      setNotice(e instanceof Error ? e.message : '加载失败');
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
      setNotice('操作成功。');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败');
    }
  };

  const bookingAction = async (body: Record<string, unknown>) => {
    try {
      await apiSend('/api/bookings', 'POST', body);
      setNotice('操作成功。');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败');
    }
  };

  const submitReview = async (bookingId: string) => {
    const form = reviewForm[bookingId];
    if (!form) return;
    if (!form.rating) {
      setNotice('请选择评分');
      return;
    }
    if (form.comment.trim().length < 5) {
      setNotice('评价内容至少 5 个字');
      return;
    }
    try {
      await apiSend('/api/reviews', 'POST', {
        bookingId,
        rating: form.rating,
        comment: form.comment.trim(),
      });
      setNotice('评价已提交，谢谢你帮助其他姐妹。');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '评价失败');
    }
  };

  if (authLoading) {
    return (
      <p className="py-10 text-center text-sm text-slateblue-700">加载中…</p>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-black text-slateblue-900">我的预约</h1>
        <EmptyState text="请先登录（右上角可切换演示账号）" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-black text-slateblue-900 sm:text-xl">
          我的预约
        </h1>
        <p className="mt-1 text-sm text-slateblue-700">
          同辈互助 100% 免费 · 专业导师付费支持
        </p>
      </div>

      <div className="flex gap-2">
        <Chip active={tab === 'peer'} onClick={() => setTab('peer')}>
          同辈互助（免费）
        </Chip>
        <Chip active={tab === 'mentor'} onClick={() => setTab('mentor')}>
          导师会话（付费）
        </Chip>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-slateblue-700">加载中…</p>
      ) : tab === 'peer' ? (
        /* —— 同辈互助（免费）—— */
        peerChats.length === 0 ? (
          <EmptyState text="还没有同辈互助记录。去对话广场回应一位姐妹吧。" />
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
                    <Badge tone="green">免费 · 同辈互助</Badge>
                    <Badge tone={c.status === 'completed' ? 'green' : 'coral'}>
                      {PEER_STATUS_LABELS[c.status]}
                    </Badge>
                    <span className="text-xs font-bold text-slateblue-700">
                      {isHelper ? '你是帮助者' : '你是发起人'} · 对象：{counterpart}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-slateblue-700">
                    <p>
                      提议时间：
                      <span className="font-bold">
                        {fmtTime(c.proposedTime)}
                      </span>
                      {c.confirmedTime
                        ? ` · 确认：${fmtTime(c.confirmedTime)}`
                        : ''}
                    </p>
                    {linkVisible ? (
                      <p>
                        聊天链接：
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
                        感谢：{c.appreciation}
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
                          placeholder="聊天链接（可选）"
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
                          确认
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
                        标记完成
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
                          placeholder="写一句感谢，会为对方生成一份同辈感谢证据"
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
                            发送感谢
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
      ) : /* —— 导师会话（付费）—— */
      bookings.length === 0 ? (
        <EmptyState text="还没有导师会话记录。去导师社区找一位懂你的导师吧。" />
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
                    {b.kind === 'package' ? '5 次套餐' : '单次'} ·{' '}
                    {isStudent ? '你是学员' : isMentorRole ? '你是导师' : ''}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-extrabold text-slateblue-900">
                  {isStudent ? b.mentorName : b.coacheeName} · {b.topic}
                </h3>

                <div className="mt-2 space-y-1 text-sm text-slateblue-700">
                  <p>
                    时间：
                    <span className="font-bold">
                      {fmtTime(b.scheduledTime)}
                    </span>
                  </p>
                  <p>
                    金额：
                    <span className="font-bold">¥{b.amount}</span>
                    <span className="ml-2 text-[11px] font-bold text-slateblue-700">
                      演示环境 · 模拟扣款/放款
                    </span>
                  </p>
                  {linkVisible ? (
                    <p>
                      会议链接：
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
                      你的评价：{b.review.rating} 星 · {b.review.comment}
                    </p>
                  ) : null}
                  {b.endorsement ? (
                    <p className="rounded-xl bg-warmgreen/15 px-3 py-2 text-slateblue-900">
                      导师背书：{b.endorsement}
                    </p>
                  ) : null}
                </div>

                {/* 导师视角操作 */}
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
                          确认预约
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
                          拒绝
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
                        标记完成
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
                          placeholder="给学员写一句导师背书，会生成一份导师背书证据"
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
                            提交背书
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* 学员视角操作 */}
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
                        确认完成（放款给导师）
                      </Button>
                    ) : null}
                    {canReview ? (
                      <div className="w-full rounded-2xl border border-silver-300 bg-silver-50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slateblue-700">
                            评分
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
                            <option value={0}>请选择</option>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} 星
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
                          placeholder="写下你的真实体验（至少 5 个字）"
                          className="mt-2 w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button onClick={() => void submitReview(b.id)}>
                            提交评价
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
                套餐订单
              </h3>
              <div className="mt-2 space-y-2">
                {packageOrders.map((o) => (
                  <p key={o.id} className="text-sm text-slateblue-700">
                    {o.totalSessions} 次套餐 · 剩余 {o.remainingRedemptions} 次
                    · ¥{o.amount} ·{' '}
                    <span className="font-bold">
                      {o.status === 'active' ? '使用中' : '已用完'}
                    </span>
                    <span className="ml-2 text-[11px] font-bold">
                      演示环境 · 模拟扣款
                    </span>
                  </p>
                ))}
              </div>
            </Card>
          ) : null}

          <p className="text-center text-xs font-bold text-slateblue-700">
            想看更多导师？
            <Link href="/community" className="ml-1 text-coral-600 underline">
              去导师社区
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
