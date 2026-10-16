'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Star } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { Mentor, MentorSlot } from '@/lib/types';

function fmtTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= Math.round(rating) ? 'text-coral-500' : 'text-silver-400'
          }`}
        />
      ))}
    </span>
  );
}

export default function MentorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  const { user, loading: authLoading } = useAuth();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [slots, setSlots] = useState<MentorSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  const [selectedSlot, setSelectedSlot] = useState('');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet<{ mentor: Mentor; slots: MentorSlot[] }>(
        `/api/mentors/${id}`
      );
      setMentor(d.mentor);
      setSlots(d.slots);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const book = async (kind: 'single' | 'package') => {
    if (!user) {
      setNotice('Please sign in (switch demo accounts in the top-right corner)');
      return;
    }
    if (!selectedSlot) {
      setNotice('Please select an available slot first');
      return;
    }
    if (!topic.trim()) {
      setNotice('Please enter the topic you want to discuss with the mentor');
      return;
    }
    setSubmitting(true);
    try {
      await apiSend('/api/bookings', 'POST', {
        action: 'create',
        mentorId: id,
        slotId: selectedSlot,
        kind,
        topic: topic.trim(),
      });
      setNotice(
        kind === 'package'
          ? 'Package purchased — payment is held in escrow (demo environment, simulated charge).'
          : 'Booking confirmed — payment is held in escrow (demo environment, simulated charge).'
      );
      setSelectedSlot('');
      setTopic('');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('slot') || msg.includes('conflict')) {
        setNotice('Schedule conflict — that slot is already booked, please pick another slot.');
      } else {
        setNotice(msg || 'Booking failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-slateblue-700">Loading…</p>
    );
  }

  if (!mentor) {
    return (
      <div className="space-y-4">
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm font-bold text-coral-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to mentor community
        </Link>
        <EmptyState text={notice || 'Mentor not found'} />
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.status === 'available');

  return (
    <div className="space-y-5">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm font-bold text-coral-600 hover:text-coral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to mentor community
      </Link>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {/* Mentor profile */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {mentor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.avatarUrl}
              alt={mentor.displayName}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-2xl font-black text-coral-600">
              {mentor.displayName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-black text-slateblue-900">
                {mentor.displayName}
              </h1>
              {mentor.verified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-700">
                  <CheckCircle className="h-4 w-4" />
                  Platform verified
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm font-bold text-coral-600">
              {mentor.headline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slateblue-700">
              {mentor.bio}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.companies.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-silver-300 bg-white px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
                >
                  {c}
                </span>
              ))}
              {mentor.schools.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-silver-300 bg-silver-50 px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.topicTags.map((t) => (
                <Badge key={t} tone="coral">
                  {t}
                </Badge>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slateblue-700">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-coral-500" />
                {mentor.rating.toFixed(1)}
              </span>
              <span>{mentor.sessionsCount} sessions</span>
              <span>Impacted {mentor.impactWomenCount} women</span>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-coral-100 bg-coral-50 p-3 text-center sm:min-w-[130px]">
            <p className="text-xl font-black text-slateblue-900">
              ¥{mentor.priceSingle}
              <span className="text-xs font-bold text-slateblue-700"> / session</span>
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slateblue-700">
              5-session package ¥{mentor.pricePackage5}
            </p>
          </div>
        </div>
      </Card>

      {/* Booking */}
      <Card>
        <h2 className="text-base font-extrabold text-slateblue-900">
          Pick a slot to book
        </h2>
        <p className="mt-1 text-sm text-slateblue-700">
          Demo environment, simulated charge. Funds are released to the mentor
          only after you confirm the session is complete.
        </p>

        {availableSlots.length === 0 ? (
          <div className="mt-3">
            <EmptyState text="No bookable slots right now — please check back later." />
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {availableSlots.map((s) => {
              const active = selectedSlot === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSlot(s.id)}
                  className={`rounded-2xl border px-3 py-2.5 text-left text-sm font-bold transition-colors ${
                    active
                      ? 'border-coral-500 bg-coral-50 text-coral-700'
                      : 'border-silver-300 bg-white text-slateblue-900 hover:bg-silver-100'
                  }`}
                >
                  {fmtTime(s.startAt)}
                </button>
              );
            })}
          </div>
        )}

        {slots.some((s) => s.status === 'booked') ? (
          <p className="mt-2 text-[11px] font-bold text-slateblue-700">
            Greyed-out slots are already booked and not available.
          </p>
        ) : null}

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
            Topic to discuss
          </span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. rebuilding my résumé after leave and positioning for AI operations"
            className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
          />
        </label>

        {!authLoading && !user ? (
          <p className="mt-3 text-sm font-bold text-coral-700">
            Please sign in (switch demo accounts in the top-right corner)
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => void book('single')}
            disabled={submitting || availableSlots.length === 0}
          >
            {submitting ? 'Processing…' : 'Book and hold payment in escrow'}
          </Button>
          <Button
            variant="outline"
            onClick={() => void book('package')}
            disabled={submitting || availableSlots.length === 0}
          >
            Buy the 5-session package (¥{mentor.pricePackage5})
          </Button>
        </div>
      </Card>

      {/* Past reviews */}
      <Card>
        <h2 className="mb-3 text-base font-extrabold text-slateblue-900">
          Past reviews ({mentor.reviews.length})
        </h2>
        {mentor.reviews.length === 0 ? (
          <EmptyState text="No reviews yet — be the first to share your experience." />
        ) : (
          <div className="space-y-3">
            {mentor.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-silver-300 bg-silver-50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slateblue-900">
                    {r.authorName}
                  </span>
                  <Stars rating={r.rating} />
                  <span className="text-[11px] text-slateblue-700">
                    {fmtTime(r.date)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slateblue-900">
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
