'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { apiGet } from '@/lib/client';
import type { Mentor } from '@/lib/types';

function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <Link href={`/mentors/${mentor.id}`} className="block">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="flex items-start gap-3">
          {mentor.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.avatarUrl}
              alt={mentor.displayName}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-lg font-black text-coral-600">
              {mentor.displayName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-extrabold text-slateblue-900">
                {mentor.displayName}
              </span>
              {mentor.verified ? (
                <CheckCircle
                  className="h-4 w-4 text-slateblue-700"
                  aria-label="已认证"
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-bold text-coral-600">
              {mentor.headline}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...mentor.companies, ...mentor.schools].slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded-full border border-silver-300 bg-silver-50 px-2 py-0.5 text-[11px] font-bold text-slateblue-700"
            >
              {c}
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
          <span>{mentor.sessionsCount} 次会话</span>
          <span>影响 {mentor.impactWomenCount} 位女性</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-2 border-t border-silver-300 pt-3">
          <div>
            <p className="text-lg font-black text-slateblue-900">
              ¥{mentor.priceSingle}
              <span className="text-xs font-bold text-slateblue-700"> / 次</span>
            </p>
            <p className="text-[11px] font-bold text-slateblue-700">
              5 次套餐 ¥{mentor.pricePackage5}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-600">
            查看详情
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default function CommunityPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiGet<{ mentors: Mentor[] }>('/api/mentors')
      .then((d) => {
        if (active) setMentors(d.mentors);
      })
      .catch(() => {
        if (active) setMentors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* 社区感文案 */}
      <div className="rounded-2xl border border-silver-300 bg-gradient-to-r from-silver-200 via-softpink-100 to-softpink-200 p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-coral-500">
          导师社区 · 女性帮女性
        </p>
        <h1 className="mt-1 text-lg font-black text-slateblue-900 sm:text-xl">
          她们曾走过你想走的那条路。
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slateblue-700">
          专业导师一对一付费支持，全部经过平台认证。她们愿意把自己的经验，变成你的下一步。
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold text-slateblue-900">
          全部导师（{mentors.length}）
        </h2>
        <span className="text-xs font-bold text-slateblue-700">
          付费会话 · 平台担保交易
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slateblue-700">加载中…</p>
      ) : mentors.length === 0 ? (
        <EmptyState text="暂时还没有导师入驻，敬请期待。" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      )}

      {/* 成为导师入口 */}
      <Card className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-extrabold text-slateblue-900">
            也想成为导师？
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slateblue-700">
            把你的经验分享给更多姐妹，一起把路走宽。
          </p>
        </div>
        <Link href="/become-mentor">
          <Button>
            成为导师
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
