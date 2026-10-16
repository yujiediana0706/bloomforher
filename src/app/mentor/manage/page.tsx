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
  held: 'Pending confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  released: 'Confirmed complete',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
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
  { key: 'bookings', label: 'Bookings' },
  { key: 'slots', label: 'Slots' },
  { key: 'income', label: 'Income' },
  { key: 'endorse', label: 'Endorsement' },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
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
      setError(e instanceof Error ? e.message : 'Failed to load');
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
      setNotice(action === 'endorse' ? 'Endorsement sent' : 'Done');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const addSlot = async () => {
    if (!newSlot) {
      setError('Please choose a start time');
      return;
    }
    setError('');
    try {
      await apiSend('/api/mentor/slots', 'POST', { startAt: newSlot });
      setNewSlot('');
      setNotice('Slot added');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    }
  };

  const removeSlot = async (slotId: string) => {
    setError('');
    try {
      await apiSend('/api/mentor/slots', 'DELETE', { slotId });
      setNotice('Slot deleted');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (loading) {
    return <p className="text-sm text-slateblue-700">Loading…</p>;
  }

  if (!user) {
    return (
      <Card>
        <p className="text-sm text-slateblue-700">
          Please sign in (switch demo accounts in the top-right corner)
        </p>
      </Card>
    );
  }

  if (!profileLoaded) {
    return <p className="text-sm text-slateblue-700">Loading…</p>;
  }

  if (!mentor) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <SectionTitle
            eyebrow="Mentor dashboard"
            title="You are not a mentor yet"
            desc="Set up your mentor profile first — once approved, you can manage bookings, slots, and endorsements."
          />
          <Link href="/become-mentor">
            <Button>
              <MessageSquareHeart className="h-4 w-4" />
              Set up mentor profile
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
        eyebrow="Mentor dashboard"
        title={`${mentor.displayName} · Mentor dashboard`}
        desc={mentor.headline}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone={mentor.verificationStatus === 'seed_approved' ? 'green' : 'coral'}>
          {mentor.verificationStatus === 'pending' ? 'Under review' : 'Verified'}
        </Badge>
        <Badge tone="silver">Rating {mentor.rating || '—'}</Badge>
        <Badge tone="silver">Served {mentor.impactWomenCount} women</Badge>
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
          <EmptyState text="No bookings yet — add your slots and coachees will be able to book you." />
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
                    {b.kind === 'package' ? '5-session package' : 'Single session'}
                  </Badge>
                  <span className="ml-auto text-xs font-bold text-slateblue-700">
                    {formatDateTime(b.scheduledTime)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slateblue-700">
                  Topic: {b.topic}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === 'held' ? (
                    <>
                      <Button
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void runAction('confirm', b.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Confirm
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void runAction('reject', b.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
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
                      Mark complete
                    </Button>
                  ) : null}
                  {b.status === 'released' ? (
                    <Button
                      variant="outline"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => setTab('endorse')}
                    >
                      <MessageSquareHeart className="h-3.5 w-3.5" />
                      Write endorsement
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
              Add a slot
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
                Add slot
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-slateblue-700">
              If no end time is set, the default duration is 1 hour.
            </p>
          </Card>

          {slots.length === 0 ? (
            <EmptyState text="No slots yet — add available times so coachees can book you." />
          ) : (
            <div className="space-y-2">
              {slots.map((s) => (
                <Card key={s.id} className="flex flex-wrap items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-coral-500" />
                  <span className="text-sm font-bold text-slateblue-900">
                    {formatDateTime(s.startAt)} — {formatDateTime(s.endAt)}
                  </span>
                  <Badge tone={s.status === 'available' ? 'green' : 'coral'}>
                    {s.status === 'available' ? 'Available' : 'Booked'}
                  </Badge>
                  <div className="ml-auto">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      disabled={s.status === 'booked'}
                      onClick={() => void removeSlot(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
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
            <Badge tone="silver">Demo data</Badge>
            <span className="text-xs text-slateblue-700">
              A simple aggregation of current booking statuses, not a real
              settlement.
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
                  Settled ({settled.length} bookings)
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
                  Pending settlement ({pending.length} bookings)
                </p>
              </div>
            </Card>
          </div>
          <Card>
            <p className="text-xs font-bold text-slateblue-700">
              {myBookings.length} bookings total · {settled.length} completed ·
              {pending.length} pending
            </p>
          </Card>
        </div>
      ) : null}

      {tab === 'endorse' ? (
        releasedBookings.length === 0 ? (
          <EmptyState text="No bookings awaiting endorsement — once the coachee confirms completion, you can write your endorsement." />
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
                  Topic: {b.topic}
                </p>
                {b.endorsement ? (
                  <div className="mt-3 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2">
                    <p className="text-[11px] font-black uppercase tracking-wide text-coral-600">
                      Endorsement sent
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
                      placeholder="Describe the growth and strengths you observed — this becomes her mentor endorsement record…"
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
                        Send endorsement
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
