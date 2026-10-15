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
  '这里还没有人开口——做第一个说出困惑的人，姐妹们在等你';

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 单张 ≤ 2MB

// 按钮措辞：不叫「帮助」，叫「同行」——不是求助大厅，是同行的社区
const WILLING_CTA = '我愿同行';
const WILLING_DONE = '✓ 已同行';

const AGREEMENTS = [
  '无评判：每个困惑都值得被认真对待，不嘲笑、不说教。',
  '不泄露他人隐私：未经允许，不截图、不转发他人的经历与信息。',
  '不推销：这里不卖课、不卖货、不拉私单。',
  '遇到危机信号转专业资源：涉及自伤、暴力等，请引导到专业帮助。',
  '感恩比建议更有力：先共情、再分享，陪伴本身就是支持。',
];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
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
              {post.images.length} 张
            </span>
          ) : null}
        </Link>
      ) : null}

      <div className="p-3.5">
        {post.status === 'resolved' ? (
          <Badge tone="green" className="mb-1.5">
            已解决
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
              {post.willingToHelpCount} 同行
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
            查看详情 →
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
      setNotice('请先登录（右上角可切换演示账号）');
      return;
    }
    try {
      await apiSend(`/api/plaza/${postId}/willing`, 'POST');
      setWillingIds((prev) => new Set(prev).add(postId));
      setNotice('已同行：谢谢你愿意陪她走一段。');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('已经')) {
        setWillingIds((prev) => new Set(prev).add(postId));
        setNotice('你已经报名同行，无需重复。');
      } else {
        setNotice(msg || '操作失败，请稍后再试');
      }
    }
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - form.images.length;
    const picked = Array.from(files).slice(0, room);
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        setNotice('只能上传图片文件');
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setNotice(`「${file.name}」超过 2MB，请压缩后再试`);
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
      setNotice('请先登录（右上角可切换演示账号）');
      return;
    }
    if (!form.title.trim() && !form.body.trim() && form.images.length === 0) {
      setNotice('标题、正文、图片至少填写一项');
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
      setNotice('已发布，谢谢你的分享。');
      await load();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '发布失败，请稍后再试');
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
      setNotice(e instanceof Error ? e.message : '保存失败，请稍后再试');
    }
  };

  const agreementOpen = !!user && !user.communityAgreed && !agreementDone;

  return (
    <div className="space-y-5">
      {/* 顶部 banner */}
      <div className="rounded-2xl border border-silver-300 bg-gradient-to-r from-silver-200 via-softpink-100 to-softpink-200 p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-coral-500">
          对话广场 · 公益免费
        </p>
        <h1 className="mt-1 text-lg font-black text-slateblue-900 sm:text-xl">
          这里没有蠢问题，只有还没被回答的困惑。
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slateblue-700">
          像发图文笔记一样：困惑、成果、心情、找搭子，随手发出来——点「我愿同行」，陪她走一段。
        </p>
      </div>

      {!authLoading && !user ? (
        <div className="rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-sm font-bold text-coral-700">
          请先登录（右上角可切换演示账号）
        </div>
      ) : null}

      {/* 标题 + 发布 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          eyebrow="广场动态"
          title="姐妹们的声音"
          desc="每一条声音都值得被接住。"
        />
        <Button onClick={() => setPublishOpen(true)}>
          <Plus className="h-4 w-4" />
          发布
        </Button>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-silver-300 bg-white px-4 py-2.5 text-sm font-bold text-slateblue-900 shadow-card">
          {notice}
        </div>
      ) : null}

      {/* 瀑布流列表 */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slateblue-700">加载中…</p>
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

      {/* 发布 Modal */}
      <Modal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="发布新帖"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              标题（可不填）
            </span>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="一句话说出你的心情 / 成果 / 困惑"
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              正文（可不填）
            </span>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="多说一点，让我们更懂你"
              className="w-full rounded-xl border border-silver-300 bg-white px-3 py-2 text-sm text-slateblue-900 outline-none focus:border-coral-500"
            />
          </label>

          {/* 图片（最多 3 张） */}
          <div>
            <span className="mb-1.5 block text-xs font-bold text-slateblue-700">
              图片（最多 {MAX_IMAGES} 张，单张 ≤ 2MB）
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
                    alt={`预览 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="移除图片"
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
                  <span className="text-[11px] font-bold">添加图片</span>
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
              标签（逗号分隔）
            </span>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="如：产后回归, AI 运营, 找搭子"
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
            匿名发布（将显示为花名）
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setPublishOpen(false)}>
              取消
            </Button>
            <Button onClick={() => void handlePublish()} disabled={submitting}>
              {submitting ? 'AI 守护者审核中…' : '发布'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 公约 Modal */}
      <Modal
        open={agreementOpen}
        onClose={() => setAgreementDone(true)}
        title="ReBloom 广场公约"
        width="max-w-xl"
      >
        <p className="mb-3 text-sm leading-relaxed text-slateblue-700">
          欢迎来到对话广场。为了让每一位姐妹都能安心开口，我们约定：
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
          我已阅读并同意以上公约
        </label>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void handleAgree()} disabled={!agreedChecked}>
            同意并进入广场
          </Button>
        </div>
      </Modal>
    </div>
  );
}
