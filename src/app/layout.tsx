import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'ReBloom AI · 她径 | Your experience. A brighter future in the AI era.',
  description:
    '女性专属 AI 职业转型赋能平台：让女性的 AI 选择，从 Why me 走向 Why not me。技能发现 · AI 机会 · 实操任务 · 回归计划 · 对话广场 · 导师社区。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-silver-200 text-slateblue-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {children}
          </main>
          <footer className="mt-12 border-t border-silver-300 bg-white py-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-slateblue-700 sm:flex-row sm:px-6 sm:text-left">
              <span>
                ReBloom AI · 她径 — Google AI Builder Cup 参赛原型（Sustainability & Social Impact）
              </span>
              <span className="font-bold text-slateblue-900">
                同辈互助 100% 免费 · 专业导师付费支持
              </span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
