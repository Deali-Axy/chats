import React from 'react';
import {
  Sparkles,
  Search,
  MessageSquare,
  BarChart3,
  LogIn,
  Layout,
  Code,
  Download,
  Bug,
  Zap,
  Package,
  Palette,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const ReleasePoster: React.FC = () => {
  const features = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: '临时聊天功能',
      description: '支持创建临时对话，在侧边栏显示，切换时不再自动删除',
    },
    {
      icon: <Search className="h-5 w-5" />,
      title: '搜索功能增强',
      description: '手动触发搜索、结果弹窗、内容高亮显示',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: '聊天标题总结',
      description: '自动为聊天生成标题摘要',
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: '模型定价页面',
      description: '新增独立的模型价格查看页面，支持搜索和筛选',
    },
    {
      icon: <LogIn className="h-5 w-5" />,
      title: '登录页优化',
      description: '添加轮播背景、产品介绍卡与联系弹窗',
    },
  ];

  const uiImprovements = [
    {
      icon: <Layout className="h-5 w-5" />,
      title: '侧边栏重构',
      description: '使用 shadcn sidebar 组件重新设计',
    },
    {
      icon: <Code className="h-5 w-5" />,
      title: '代码块优化',
      description: '支持复制、下载、展开/收起功能',
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: '欢迎界面',
      description: '改进欢迎引导界面',
    },
  ];

  const bugFixes = [
    '修复临时聊天的多个问题',
    '修复消息加载竞态条件',
    '修复搜索栏与菜单按钮遮挡问题',
    '修复 SidebarProvider 导致聊天记录无法显示',
  ];

  const otherUpdates = [
    {
      icon: <Package className="h-5 w-5" />,
      title: '包管理器迁移',
      description: '从 npm 迁移到 pnpm',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: '构建优化',
      description: '修复 TypeScript 类型错误',
    },
  ];

  return (
    <div
      id="release-poster"
      className="relative w-[1080px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -left-20 bottom-1/4 h-60 w-60 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-40 w-40 bg-gradient-to-tl from-purple-500/10 to-transparent" />
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 px-16 py-12">
        {/* 头部 */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">新版本发布</span>
          </div>
          <h1 className="mb-3 text-6xl font-bold tracking-tight text-white">
            Ayaka Chats
          </h1>
          <div className="mb-4 inline-flex items-center gap-3">
            <span className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-3xl font-bold text-white">
              v1.13.0
            </span>
          </div>
          <p className="text-lg text-gray-300">
            全新功能与体验优化
          </p>
        </div>

        {/* 新功能区域 */}
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
              <Sparkles className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">✨ 新功能</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-purple-400">{feature.icon}</div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* UI 改进区域 */}
        <div className="mb-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
              <Layout className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">🎨 UI/UX 改进</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {uiImprovements.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="text-blue-400">{item.icon}</div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-xs leading-relaxed text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bug 修复和其他更新 */}
        <div className="mb-8 grid grid-cols-2 gap-6">
          {/* Bug 修复 */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
                <Bug className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">🐛 Bug 修复</h2>
            </div>
            <div className="space-y-2">
              {bugFixes.map((fix, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg bg-white/5 p-3"
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                  <span className="text-sm text-gray-300">{fix}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 其他更新 */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                <Package className="h-5 w-5 text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">📦 其他更新</h2>
            </div>
            <div className="space-y-3">
              {otherUpdates.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className="text-orange-400">{item.icon}</div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs text-gray-300">{item.description}</p>
                </div>
              ))}
              <div className="rounded-xl border border-white/10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 p-4">
                <p className="text-sm font-medium text-white">
                  品牌重命名：Sdcb Chats → Ayaka Chats
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                <span className="text-lg font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-base font-semibold text-white">Ayaka Chats</p>
                <p className="text-xs text-gray-400">智能聊天助手</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">2026 年 6 月 22 日</p>
              <p className="text-xs text-gray-500">立即升级体验全新功能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleasePoster;
