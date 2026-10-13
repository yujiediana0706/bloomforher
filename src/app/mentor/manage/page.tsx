'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock,
  Check,
  Clock,
  Coins,
  MessageSquareHeart,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  SectionTitle,
} from '@/components/ui';
import type { Booking, BookingStatus, Mentor, MentorSlot } from '@/lib/types';

const STATUS_LABELS: Record<BookingStatus, string> = {
  held: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  released: '已确认完成',
  rejected: '已拒绝',
  cancelled: '已取消',
};

const STATUS_TONES: Record<
  BookingStatus,
  'silver' | 'coral' | 'pink' | 'green' | 'red'
> = {
  held: 'coral',
  confirmed: 'green',
  completed: 'green',
  released: 'pink',
  rejected: 'red',
  cancelled: 'silver',
};

type Tab = 'bookings' | 'slots' | 'income' | 'endorse';

const TABS: { key: Tab; label: string }[] = [
  { key: 'bookings', label: '预约' },
  { key: 'slots', label: '档期' },
  { key: 'income', label: '收入' },
  { key: 'endorse', label: '写赠言' },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MentorManagePage() {
  const { user, loading } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [tab, setTab] = useState<Tab>('bookings');
  const [newSlot, setNewSlot] = useState('');
  const [endorseDraft, setEndorseDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [profile, bookingsRes, slotsRes] = await Promise.all([
        apiGet<{ mentor: Mentor | null }>('/api/mentor/profile'),
        apiGet<{ bookings: Booking[] }>('/api/bookings'),
        apiGet<{ slots: MentorSlot[] }>('/api/mentor/slots'),
      ]);
      setMentor(profile.mentor);
      setBookings(bookingsRes.bookings);
      setSlots(slotsRes.slots);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const myBookings = mentor
    ? bookings.filter((b) => b.mentorId === mentor.id)
    : [];

  const runAction = async (
    action: 'confirm' | 'reject' | 'complete' | 'endorse',
    bookingId: string,
    text?: string
  ) => {
    setNotice('');
    setError('');
    try {
      await apiSend('/api/bookings', 'POST', { action, bookingId, text });
      setNotice(action === 'endorse' ? '赠言已送出' : '操作成功');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  };

  const addSlot = async () => {
    if (!newSlot) {
      setError('请选择开始时间');
      return;
    }
    setError('');
    try {
      await apiSend('/api/mentor/slots', 'POST', { startAt: newSlot });
      setNewSlot('');
      setNotice('档期已添加');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加失败');
    }
  };

  const removeSlot = async (slotId: string) => {
    setError('');
    try {
      await apiSend('/api/mentor/slots', 'DELETE', { slotId });
      setNotice('档期已删除');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  if (loading) {
    return <p className="text-sm text-slateblue-700">加载中…</p>;
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-slateblue-700">
          请先登录（右上角可切换演示账号）
        </p>
      </Card>
    );
  }

  if (!profileLoaded) {
    return <p className="text-sm text-slateblue-700">加载中…</p>;
  }

  if (!mentor) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <SectionTitle
            eyebrow="导师工作台"
            title="你还不是导师"
            desc="先开通导师资料，通过审核后即可管理预约、档期与赠言。"
          />
          <Link href="/become-mentor">
            <Button>
              <MessageSquareHeart className="h-4 w-4" />
              去开通导师资料
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const settled = myBookings.filter(
    (b) => b.status === 'released' || b.status === 'completed'
  );
  const pending = myBookings.filter(
    (b) => b.status === 'held' || b.status === 'confirmed'
  );
  const settledAmount = settled.reduce((s, b) => s + b.amount, 0);
  const pendingAmount = pending.reduce((s, b) => s + b.amount, 0);
  const releasedBookings = myBookings.filter((b) => b.status === 'released');

  return (
    <div className="mx-auto w-full max-w-4xl">
      <SectionTitle
        eyebrow="导师工作台"
        title={`${mentor.displayName} · 导师工作台`}
        desc={mentor.headline}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={mentor.verificationStatus === 'seed_approved' ? 'green' : 'coral'}>
          {mentor.verificationStatus === 'pending' ? '审核中' : '已认证'}
        </Badge>
        <Badge tone="silver">评分 {mentor.rating || '—'}</Badge>
        <Badge tone="silver">已服务 {mentor.impactWomenCount} 位女性</Badge>
      </div>

      <div className="no-scrollbar mb-4 inline-flex gap-1 rounded-xl border border-silver-300 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
              tab === t.key
                ? 'bg-coral-500 text-white'
                : 'text-slateblue-700 hover:bg-silver-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice ? (
        <p className="mb-3 rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-xs font-bold text-[#3f7a4a]">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-xs font-bold text-warmred">
          {error}
        </p>
      ) : null}

      {tab === 'bookings' ? (
        myBookings.length === 0 ? (
          <EmptyState text="还没有预约——完善档期后，学员就能预约你啦。" />
        ) : (
          <div className="space-y-3">
            {myBookings.map((b) => (
              <Card key={b.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slateblue-900">
                    {b.coacheeName}
                  </span>
                  <Badge tone={STATUS_TONES[b.status]}>
                    {STATUS_LABELS[b.status]}
                  </Badge>
                  <Badge tone="silver">
                    {b.kind === 'package' ? '5 次套餐' : '单次咨询'}
                  </Badge>
                  <span className="ml-auto text-xs font-bold text-slateblue-700">
                    {formatDateTime(b.scheduledTime)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slateblue-700">
                  话题：{b.topic}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === 'held' ? (
                    <>
                      <Button
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void runAction('confirm', b.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        确认
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void runAction('reject', b.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        拒绝
                      </Button>
                    </>
                  ) : null}
                  {b.status === 'confirmed' ? (
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => void runAction('complete', b.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      标记完成
                    </Button>
                  ) : null}
                  {b.status === 'released' ? (
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setTab('endorse')}
                    >
                      <MessageSquareHeart className="h-3.5 w-3.5" />
                      去写赠言
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {tab === 'slots' ? (
        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-sm font-extrabold text-slateblue-900">
              新增档期
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
                className="rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500"
              />
              <Button onClick={() => void addSlot()}>
                <Clock className="h-4 w-4" />
                添加档期
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slateblue-700">
              未填写结束时间时，默认时长 1 小时。
            </p>
          </Card>

          {slots.length === 0 ? (
            <EmptyState text="还没有档期——添加可用时间，学员才能预约。" />
          ) : (
            <div className="space-y-2">
              {slots.map((s) => (
                <Card key={s.id} className="flex flex-wrap items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-coral-500" />
                  <span className="text-sm font-bold text-slateblue-900">
                    {formatDateTime(s.startAt)} — {formatDateTime(s.endAt)}
                  </span>
                  <Badge tone={s.status === 'available' ? 'green' : 'coral'}>
                    {s.status === 'available' ? '可预约' : '已被预约'}
                  </Badge>
                  <div className="ml-auto">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={s.status === 'booked'}
                      onClick={() => void removeSlot(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'income' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone="silver">演示数据</Badge>
            <span className="text-xs text-slateblue-700">
              基于当前预约状态简单聚合，非真实结算。
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
                <Coins className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slateblue-900">
                  ¥{settledAmount}
                </p>
                <p className="text-xs font-bold text-slateblue-700">
                  已结算（{settled.length} 单）
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-silver-100 text-slateblue-700">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slateblue-900">
                  ¥{pendingAmount}
                </p>
                <p className="text-xs font-bold text-slateblue-700">
                  待结算（{pending.length} 单）
                </p>
              </div>
            </Card>
          </div>
          <Card>
            <p className="text-xs font-bold text-slateblue-700">
              累计预约 {myBookings.length} 单 · 已完成 {settled.length} 单 ·
              待处理 {pending.length} 单
            </p>
          </Card>
        </div>
      ) : null}

      {tab === 'endorse' ? (
        releasedBookings.length === 0 ? (
          <EmptyState text="暂无待写赠言的预约——学员确认完成后即可写下你的背书。" />
        ) : (
          <div className="space-y-3">
            {releasedBookings.map((b) => (
              <Card key={b.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-slateblue-900">
                    {b.coacheeName}
                  </span>
                  <Badge tone="silver">
                    {formatDateTime(b.scheduledTime)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slateblue-700">
                  话题：{b.topic}
                </p>
                {b.endorsement ? (
                  <div className="mt-3 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2">
                    <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                      已送出赠言
                    </p>
                    <p className="mt-1 text-sm text-slateblue-900">
                      {b.endorsement}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <textarea
                      rows={3}
                      value={endorseDraft[b.id] ?? ''}
                      onChange={(e) =>
                        setEndorseDraft({
                          ...endorseDraft,
                          [b.id]: e.target.value,
                        })
                      }
                      placeholder="写下你观察到她的成长与优势，这会成为她的导师背书证据…"
                      className="w-full resize-none rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() =>
                          void runAction(
                            'endorse',
                            b.id,
                            (endorseDraft[b.id] ?? '').trim()
                          )
                        }
                        disabled={!(endorseDraft[b.id] ?? '').trim()}
                      >
                        <MessageSquareHeart className="h-4 w-4" />
                        送出赠言
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
