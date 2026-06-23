import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import posterData from '@/data/release-poster.json';
import type { PosterData } from '@/components/Poster/ReleasePoster';

// 动态导入海报组件，避免 SSR 问题
const ReleasePoster = dynamic(() => import('@/components/Poster/ReleasePoster'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center">
      <div className="text-lg text-gray-400">加载海报中...</div>
    </div>
  ),
});

const PosterDownloadButton = dynamic(
  () => import('@/components/Poster/PosterDownloadButton'),
  { ssr: false }
);

const data = posterData as PosterData;

export default function PosterPage() {
  return (
    <>
      <Head>
        <title>v{data.version} 更新海报 | Ayaka Chats</title>
        <meta name="description" content={`Ayaka Chats v${data.version} 版本更新内容海报`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8">
        {/* 顶部导航 */}
        <div className="container mx-auto mb-8 px-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>

        {/* 页面标题 */}
        <div className="container mx-auto mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold text-white">v{data.version} 版本更新海报</h1>
          <p className="text-lg text-gray-400">
            下方海报可直接保存分享到群聊
          </p>
        </div>

        {/* 海报展示区域 */}
        <div className="container mx-auto mb-8 flex justify-center px-4">
          <div className="overflow-hidden rounded-2xl shadow-2xl shadow-purple-500/10">
            <ReleasePoster data={data} />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="container mx-auto text-center">
          <PosterDownloadButton
            targetId="release-poster"
            filename={`ayaka-chats-v${data.version}-release.png`}
          />
          <p className="mt-4 text-sm text-gray-500">
            复制图片可直接粘贴到聊天窗口，下载海报保存到本地
          </p>
        </div>

        {/* 使用说明 */}
        <div className="container mx-auto mt-12 max-w-2xl px-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-semibold text-white">📱 使用说明</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-400">1.</span>
                <span><strong>复制图片</strong>：点击「复制图片」按钮，然后直接在微信/QQ 聊天窗口中粘贴（Ctrl+V）</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-400">2.</span>
                <span><strong>下载海报</strong>：点击「下载海报」按钮，图片将保存到本地，可手动发送</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-400">3.</span>
                <span>海报尺寸为 1080px 宽，适合手机竖屏查看</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-purple-400">💡</span>
                <span>推荐使用「复制图片」功能，操作更快捷</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
