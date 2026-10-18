'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart, ImagePlus, MessageCircle, Plus, Users, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import type { PlazaPost } from '@/lib/types';

interface PlazaPostView extends Omit<PlazaPost, 'authorId'> {
  authorDisplay: string;
  viewerIsAuthor: boolean;
}

const EMPTY_TEXT =
  'No one has spoken up yet — be the first to share your question. Your peers are waiting for you';

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // single image ≤ 2MB

// Button wording: not "help", but "walk alongside" — a peer community, not a request desk
const WILLING_CTA = "I'll walk with you";
const WILLING_DONE = '✓ Walking with her';

const AGREEMENTS = [
  'No judgment: every question deserves to be taken seriously — no mockery, no lecturing.',
  "Protect others' privacy: never screenshot or forward someone's experiences or information without permission.",
  'No selling: no course sales, no product promotion, no off-platform solicitation here.',
  'Route crisis signals to professional resources: for self-harm, violence, or similar, please guide the person to professional help.',
  'Gratitude is stronger than advice: empathize first, then share — companionship itself is support.',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function PostCard({
  post,
  willinged,
  onWilling,
}: {
  post: PlazaPostView;
  willinged: boolean;
  onWilling: () => void;
}) {
  const cover = post.images[0];
  return (
    <Card className="!p-0 break-inside-avoid overflow-hidden">
      {cover ? (
        <Link href={`/plaza/${post.id}`} className="relative block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="w-full object-cover" />
          {post.images.length > 1 ? (
            <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold text-white">
              {post.images.length} photos
            </span>
          ) : null}
        </Link>
      ) : null}

      <div className="p-3.5">
        {post.status === 'resolved' ? (
          <Badge tone="green" className="mb-1.5">
            Resolved
          </Badge>
        ) : null}

        {post.title ? (
          <Link href={`/plaza/${post.id}`}>
            <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-slateblue-900 hover:text-coral-600">
              {post.title}
            </h3>
          </Link>
        ) : null}
        {post.body ? (
          <Link href={`/plaza/${post.id}`}>
            <p
              className={`mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-slateblue-700 ${
                post.title ? '' : '!text-[13px] line-clamp-6'
              }`}
            >
              {post.body}
            </p>
          </Link>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full border border-silver-300 bg-silver-50 px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slateblue-700">
          <span className="min-w-0 truncate">
            {post.authorDisplay} · {formatDate(post.createdAt)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-2.5">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {post.willingToHelpCount} walking with her
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.kudosCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.commentCount}
            </span>
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-silver-200 pt-3">
          {willinged ? (
            <span className="inline-flex items-center rounded-xl bg-coral-500 px-3 py-1.5 text-xs font-bold text-white">
              {WILLING_DONE}
            </span>
          ) : (
            <button
              onClick={onWilling}
              className="inline-flex items-center rounded-xl border border-coral-500 bg-white px-3 py-1.5 text-xs font-bold text-coral-600 transition-colors hover:bg-coral-50"
            >
              {WILLING_CTA}
            </button>
          )}
          <Link
            href={`/plaza/${post.id}`}
            className="ml-auto text-xs font-bold text-slateblue-700 hover:text-coral-600"
          >
            View details →
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function PlazaPage() {
  const { user, loading: authLoading, refresh } = useAuth();

  const [posts, setPosts] = useState<PlazaPostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [willingIds, setWillingIds] = useState<Set<string>>(new Set());

  const [publishOpen, setPublishOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    tags: '',
    anonymous: false,
    images: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [agreedChecked, setAgreedChecked] = useState(false);
  const [agreementDone, setAgreementDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ posts: PlazaPostView[] }>('/api/plaza');
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleWilling = async (postId: string) => {
    if (!user) {
      setNotice('Please sign in first.');
      return;
    }
    try {
      await apiSend(`/api/plaza/${postId}/willing`, 'POST');
      setWillingIds((prev) => new Set(prev).add(postId));
      setNotice('Marked as willing to help — thank you for walking alongside her.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('already')) {
        setWillingIds((prev) => new Set(prev).add(postId));
        setNotice('You are already willing to help — no need to do it again.');
      } else {
        setNotice(msg || 'Something went wrong, please try again later');
      }
    }
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - form.images.length;
    const picked = Array.from(files).slice(0, room);
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        setNotice('Only image files can be uploaded');
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setNotice(`"${file.name}" is over 2MB, please compress it and try again`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) return;
        setForm((f) =>
          f.images.length >= MAX_IMAGES
            ? f
            : { ...f, images: [...f.images, dataUrl] }
        );
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  };

  const handlePublish = async () => {
    if (!user) {
      setNotice('Please sign in first.');
      return;
    }
    if (!form.title.trim() && !form.body.trim() && form.images.length === 0) {
      setNotice('Fill in at least one of title, body, or image');
      return;
    }
    setSubmitting(true);
    try {
      await apiSend('/api/plaza', 'POST', {
        title: form.title.trim(),
        body: form.body,
        images: form.images,
        tags: form.tags
          .split(/[,，]/)
          .map((t) => t.trim())
          .filter(Boolean),
        anonymous: form.anonymous,
      });
      setPublishOpen(false);
      setForm({ title: '', body: '', tags: '', anonymous: false, images: [] });
      setNotice('Posted — thank you for sharing.');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not post, please try again later');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAgree = async () => {
    if (!agreedChecked) return;
    try {
      await apiSend('/api/profile', 'POST', { communityAgreed: true });
      setAgreementDone(true);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not save, please try again later');
    }
  };

  const agreementOpen = !!user && !user.communityAgreed && !agreementDone;

  return (
    <div className="space-y-5">
      {/* Top banner */}
      <div className="rounded-2xl border border-silver-300 bg-gradient-to-r from-silver-200 via-softpink-100 to-softpink-200 p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-coral-500">
          Conversation Plaza · Free & non-profit
        </p>
        <h1 className="mt-1 text-lg font-black text-slateblue-900 sm:text-xl">
          No silly questions here — only questions still waiting for an answer.
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slateblue-700">
          Post it like a photo note — questions, wins, feelings, or finding a
          buddy. Share freely, then tap "I'll walk with you" to accompany
          someone on her path.
        </p>
      </div>

      {!authLoading && !user ? (
        <div className="rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-sm font-bold text-coral-700">
          Please sign in first.
        </div>
      ) : null}

      {/* Heading + publish */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          eyebrow="Plaza feed"
          title="Voices from our community"
          desc="Every voice deserves a response."
        />
        <Button onClick={() => setPublishOpen(true)}>
          <Plus className="h-4 w-4" />
          Post
        </Button>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {/* Masonry feed */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slateblue-700">Loading…</p>
      ) : posts.length === 0 ? (
        <EmptyState text={EMPTY_TEXT} />
      ) : (
        <div className="columns-2 gap-4 md:columns-3 xl:columns-4 [&>*]:mb-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              willinged={willingIds.has(p.id)}
              onWilling={() => void handleWilling(p.id)}
            />
          ))}
        </div>
      )}

      {/* Post modal */}
      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Create a post"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              Title (optional)
            </span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Sum up your mood, a win, or a question in one line"
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              Body (optional)
            </span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Tell us a bit more so we can understand you better"
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
            />
          </label>

          {/* Images (up to 3) */}
          <div>
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              Images (up to {MAX_IMAGES}, each ≤ 2MB)
            </span>
            <div className="flex flex-wrap gap-2">
              {form.images.map((src, i) => (
                <div
                  key={`${i}-${src.slice(-12)}`}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-silver-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_IMAGES ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-silver-400 text-slateblue-700 transition-colors hover:border-coral-400 hover:text-coral-600"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[11px] font-bold">Add image</span>
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleAddImages(e.target.files)}
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              Tags (comma-separated)
            </span>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. returning after leave, AI operations, finding a buddy"
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-slateblue-900">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) =>
                setForm((f) => ({ ...f, anonymous: e.target.checked }))
              }
              className="h-4 w-4 accent-coral-500"
            />
            Post anonymously (your name will be replaced with a handle)
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handlePublish()} disabled={submitting}>
              {submitting ? 'AI guardian reviewing…' : 'Post'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Community agreement modal */}
      <Modal
        open={agreementOpen}
        onClose={() => setAgreementDone(true)}
        title="HerRise Plaza Agreement"
        width="max-w-xl"
      >
        <p className="mb-3 text-sm leading-relaxed text-slateblue-700">
          Welcome to the Conversation Plaza. So every woman here can speak up
          safely, we agree to:
        </p>
        <ol className="space-y-2">
          {AGREEMENTS.map((a, i) => (
            <li key={a} className="flex gap-2 text-sm text-slateblue-900">
              <span className="font-black text-coral-500">{i + 1}.</span>
              <span className="leading-relaxed">{a}</span>
            </li>
          ))}
        </ol>
        <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slateblue-900">
          <input
            type="checkbox"
            checked={agreedChecked}
            onChange={(e) => setAgreedChecked(e.target.checked)}
            className="h-4 w-4 accent-coral-500"
          />
          I have read and agree to the agreement above
        </label>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void handleAgree()} disabled={!agreedChecked}>
            Agree and enter the plaza
          </Button>
        </div>
      </Modal>
    </div>
  );
}
