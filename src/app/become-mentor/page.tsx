'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { apiGet, apiSend } from '@/lib/client';
import { Button, Card, SectionTitle } from '@/components/ui';
import type { Mentor } from '@/lib/types';

interface ProfileData {
  mentor: Mentor | null;
}

interface FormState {
  displayName: string;
  headline: string;
  bio: string;
  companies: string;
  schools: string;
  topicTags: string;
  priceSingle: string;
  pricePackage5: string;
}

const EMPTY_FORM: FormState = {
  displayName: '',
  headline: '',
  bio: '',
  companies: '',
  schools: '',
  topicTags: '',
  priceSingle: '199',
  pricePackage5: '899',
};

export default function BecomeMentorPage() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [existing, setExisting] = useState<Mentor | null>(null);
  const [certName, setCertName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await apiGet<ProfileData>('/api/mentor/profile');
        if (res.mentor) {
          setExisting(res.mentor);
          setForm({
            displayName: res.mentor.displayName,
            headline: res.mentor.headline,
            bio: res.mentor.bio,
            companies: res.mentor.companies.join('，'),
            schools: res.mentor.schools.join('，'),
            topicTags: res.mentor.topicTags.join('，'),
            priceSingle: String(res.mentor.priceSingle),
            pricePackage5: String(res.mentor.pricePackage5),
          });
        } else {
          setForm({ ...EMPTY_FORM, displayName: user.name });
        }
      } catch {
        // 忽略加载错误，保持空表单
      }
    })();
  }, [user]);

  const submit = async () => {
    if (!form.displayName.trim()) {
      setError('请填写展示名称');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiSend<{ mentor: Mentor }>('/api/mentor/profile', 'POST', {
        displayName: form.displayName.trim(),
        headline: form.headline.trim(),
        bio: form.bio,
        companies: form.companies
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        schools: form.schools
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        topicTags: form.topicTags
          .split(/[，,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        priceSingle: Number(form.priceSingle) || 0,
        pricePackage5: Number(form.pricePackage5) || 0,
      });
      setExisting(res.mentor);
      setSuccess('资料已提交，审核中');
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSaving(false);
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

  const field =
    'mt-1 w-full rounded-xl border border-silver-300 px-3 py-2 text-sm outline-none focus:border-coral-500';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <SectionTitle
        eyebrow="导师社区"
        title={existing ? '更新导师资料' : '开通导师资料'}
        desc="把你的经验变成可被预约的支持，帮助更多女性走通 AI 转型之路。"
      />

      {existing ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <BadgeCheck className="h-4 w-4 text-coral-500" />
          <span className="text-xs font-bold text-slateblue-900">
            当前状态：
            {existing.verificationStatus === 'pending'
              ? '审核中'
              : existing.verificationStatus === 'seed_approved'
                ? '已认证'
                : '未通过'}
          </span>
        </div>
      ) : null}

      <Card>
        <div className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">展示名称</span>
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="例如：林知夏"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">一句话头衔</span>
            <input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="例如：前电商运营，转型 AI 产品经理"
              className={field}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">个人简介</span>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="你的经历、擅长的话题、能提供的帮助…"
              className={`${field} resize-none`}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                就职公司（逗号分隔）
              </span>
              <input
                value={form.companies}
                onChange={(e) => setForm({ ...form, companies: e.target.value })}
                placeholder="例如：字节跳动，某电商平台"
                className={field}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                毕业院校（逗号分隔）
              </span>
              <input
                value={form.schools}
                onChange={(e) => setForm({ ...form, schools: e.target.value })}
                placeholder="例如：浙江大学"
                className={field}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-slateblue-900">
              擅长话题（逗号分隔）
            </span>
            <input
              value={form.topicTags}
              onChange={(e) => setForm({ ...form, topicTags: e.target.value })}
              placeholder="例如：AI 产品，转型简历，面试辅导"
              className={field}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                单次咨询价（元）
              </span>
              <input
                type="number"
                value={form.priceSingle}
                onChange={(e) =>
                  setForm({ ...form, priceSingle: e.target.value })
                }
                className={field}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slateblue-900">
                5 次套餐价（元）
              </span>
              <input
                type="number"
                value={form.pricePackage5}
                onChange={(e) =>
                  setForm({ ...form, pricePackage5: e.target.value })
                }
                className={field}
              />
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-silver-400 bg-silver-50 px-3 py-3">
            <p className="text-xs font-bold text-slateblue-900">上传资质证明</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-silver-300 bg-white px-3 py-1.5 text-xs font-bold text-slateblue-700 hover:bg-silver-100">
                <Upload className="h-3.5 w-3.5" />
                选择文件
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setCertName(f ? f.name : '');
                  }}
                />
              </label>
              {certName ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slateblue-900">
                  <FileText className="h-3.5 w-3.5 text-coral-500" />
                  {certName}
                </span>
              ) : (
                <span className="text-xs text-slateblue-700">尚未选择文件</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slateblue-700">
              原型仅记录文件名，不会真正上传。
            </p>
          </div>

          {error ? (
            <p className="text-xs font-bold text-warmred">{error}</p>
          ) : null}
          {success ? (
            <div className="rounded-xl border border-warmgreen/40 bg-warmgreen/10 px-3 py-2 text-xs font-bold text-[#3f7a4a]">
              {success}
              <Link href="/mentor/manage" className="ml-2 underline">
                前往导师工作台 →
              </Link>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? '提交中…' : existing ? '保存更新' : '提交资料'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
