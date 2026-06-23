import React from 'react';
import Head from 'next/head';
import { ArrowLeft, Image, Sparkles, Layout, Bug, Package } from 'lucide-react';
import Link from 'next/link';
import changelogData from '@/data/changelog.json';
import type { ChangelogData, ChangelogFeature } from '@/types/changelog';

const data = changelogData as ChangelogData;

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  } catch {
    return dateStr;
  }
}

function FeatureList({ items, icon }: { items: ChangelogFeature[]; icon: React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 py-3 border-b border-white/5 last:border-0">
          <div className="mt-0.5 flex-shrink-0 text-purple-400">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            <p className="mt-0.5 text-sm text-gray-400">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BugFixList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      {items.map((fix, i) => (
        <div key={i} className="flex gap-3 py-3 border-b border-white/5 last:border-0">
          <div className="mt-0.5 flex-shrink-0 text-green-400">
            <Bug className="h-4 w-4" />
          </div>
          <p className="text-sm text-gray-300">{fix}</p>
        </div>
      ))}
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <>
      <Head>
        <title>更新日志 v{data.version} | Ayaka Chats</title>
        <meta name="description" content={`Ayaka Chats v${data.version} 更新日志`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        <div className="container mx-auto max-w-3xl px-4">
          {/* 顶部导航 */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
            <Link
              href="/poster"
              className="inline-flex items-center gap-2 text-sm text-purple-400 transition-colors hover:text-purple-300"
            >
              <Image className="h-4 w-4" />
              生成分享海报
            </Link>
          </div>

          {/* 版本摘要 */}
          <div className="mb-10">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1">
              <span className="text-xs font-medium text-purple-400">v{data.version}</span>
              <span className="text-xs text-gray-500">·</span>
              <span className="text-xs text-gray-500">{formatDate(data.date)}</span>
            </div>
            <h1 className="text-3xl font-bold text-white">更新日志</h1>
            <p className="mt-2 text-gray-400">{data.tagline}</p>
          </div>

          {/* 新功能 */}
          {data.features.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">新功能</h2>
              </div>
              <FeatureList items={data.features} icon={<Sparkles className="h-4 w-4" />} />
            </section>
          )}

          {/* UI 改进 */}
          {data.uiImprovements.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">UI/UX 改进</h2>
              </div>
              <FeatureList items={data.uiImprovements} icon={<Layout className="h-4 w-4" />} />
            </section>
          )}

          {/* Bug 修复 */}
          {data.bugFixes.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Bug className="h-5 w-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Bug 修复</h2>
              </div>
              <BugFixList items={data.bugFixes} />
            </section>
          )}

          {/* 其他更新 */}
          {data.otherUpdates.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-400" />
                <h2 className="text-lg font-semibold text-white">其他更新</h2>
              </div>
              <FeatureList items={data.otherUpdates} icon={<Package className="h-4 w-4" />} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
