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
  Globe,
  Shield,
  SlidersHorizontal,
  Database,
  Brain,
  RefreshCw,
  Users,
  Wrench,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import type { ChangelogData } from '@/types/changelog';

const featureIcons: Record<string, React.ReactNode> = {
  'MCP 快捷开关': <Zap className="h-5 w-5" />,
  '智能联网搜索': <Globe className="h-5 w-5" />,
  '系统预设': <Shield className="h-5 w-5" />,
  '模型请求自定义': <SlidersHorizontal className="h-5 w-5" />,
  '配置快照': <Database className="h-5 w-5" />,
  '用户上下文': <Brain className="h-5 w-5" />,
  'MCP 并行': <RefreshCw className="h-5 w-5" />,
  '管理员': <Users className="h-5 w-5" />,
  '临时聊天': <MessageSquare className="h-5 w-5" />,
  '搜索功能': <Search className="h-5 w-5" />,
  '聊天标题': <BarChart3 className="h-5 w-5" />,
  '模型定价': <Sparkles className="h-5 w-5" />,
  '登录': <LogIn className="h-5 w-5" />,
  '代码块': <Code className="h-5 w-5" />,
  '海报': <Download className="h-5 w-5" />,
};

const uiIcons: Record<string, React.ReactNode> = {
  '工具调用': <Wrench className="h-5 w-5" />,
  '模型选择': <Search className="h-5 w-5" />,
  '图片预览': <ImageIcon className="h-5 w-5" />,
  'MCP 用户分配': <Users className="h-5 w-5" />,
  '代码块': <Code className="h-5 w-5" />,
  '聊天布局': <Layout className="h-5 w-5" />,
  '侧边栏': <Layout className="h-5 w-5" />,
  '欢迎界面': <Palette className="h-5 w-5" />,
  '模型定价': <BarChart3 className="h-5 w-5" />,
};

const otherIcons: Record<string, React.ReactNode> = {
  'Prompt': <FileText className="h-5 w-5" />,
  '瞬态错误': <RefreshCw className="h-5 w-5" />,
  'Claude Code': <Code className="h-5 w-5" />,
  '依赖升级': <Package className="h-5 w-5" />,
  '包管理': <Package className="h-5 w-5" />,
  '构建': <Zap className="h-5 w-5" />,
  '侧边栏': <Layout className="h-5 w-5" />,
  '模型定价': <BarChart3 className="h-5 w-5" />,
};

function getIcon(title: string, iconMap: Record<string, React.ReactNode>): React.ReactNode {
  for (const [key, icon] of Object.entries(iconMap)) {
    if (title.includes(key)) return icon;
  }
  return <Sparkles className="h-5 w-5" />;
}

interface ReleasePosterProps {
  data: ChangelogData;
  posterId?: string;
}

const ReleasePoster: React.FC<ReleasePosterProps> = ({
  data,
  posterId = 'release-poster',
}) => {
  const { version, date, tagline, features, uiImprovements, bugFixes, otherUpdates } = data;

  // 格式化日期为中文格式
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id={posterId}
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
              v{version}
            </span>
          </div>
          <p className="text-lg text-gray-300">{tagline}</p>
        </div>

        {/* 新功能区域 */}
        {features.length > 0 && (
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
                    <div className="text-purple-400">{getIcon(feature.title, featureIcons)}</div>
                    <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UI 改进区域 */}
        {uiImprovements.length > 0 && (
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
                    <div className="text-blue-400">{getIcon(item.title, uiIcons)}</div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bug 修复和其他更新 */}
        {(bugFixes.length > 0 || otherUpdates.length > 0) && (
          <div className="mb-8 grid grid-cols-2 gap-6">
            {/* Bug 修复 */}
            {bugFixes.length > 0 && (
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
            )}

            {/* 其他更新 */}
            {otherUpdates.length > 0 && (
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
                        <div className="text-orange-400">{getIcon(item.title, otherIcons)}</div>
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      </div>
                      <p className="text-xs text-gray-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
              <p className="text-sm text-gray-400">{formatDate(date)}</p>
              <p className="text-xs text-gray-500">立即升级体验全新功能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleasePoster;
