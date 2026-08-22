import dynamic from 'next/dynamic';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  Download,
  FileJson,
  Image as ImageIcon,
  LayoutList,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import changelogData from '@/data/changelog.json';
import type { ChangelogData, ChangelogFeature } from '@/types/changelog';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const ReleasePoster = dynamic(() => import('@/components/Poster/ReleasePoster'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center text-muted-foreground">
      正在加载海报…
    </div>
  ),
});

const PosterDownloadButton = dynamic(
  () => import('@/components/Poster/PosterDownloadButton'),
  { ssr: false },
);

const initialData = changelogData as ChangelogData;

const isChangelogData = (value: unknown): value is ChangelogData => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<ChangelogData>;
  return typeof data.version === 'string'
    && typeof data.date === 'string'
    && typeof data.tagline === 'string'
    && Array.isArray(data.features)
    && Array.isArray(data.uiImprovements)
    && Array.isArray(data.bugFixes)
    && Array.isArray(data.otherUpdates);
};

const FeatureGroup = ({
  title,
  items,
}: {
  title: string;
  items: ChangelogFeature[];
}) => {
  if (items.length === 0) return null;
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={`${item.title}-${item.description}`}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default function AdminChangelogPage() {
  const [json, setJson] = useState(() => JSON.stringify(initialData, null, 2));
  const [previewData, setPreviewData] = useState<ChangelogData>(initialData);
  const [copied, setCopied] = useState(false);

  const filename = useMemo(
    () => `ayaka-chats-v${previewData.version}-release.png`,
    [previewData.version],
  );

  const parseJson = useCallback(() => {
    const parsed: unknown = JSON.parse(json);
    if (!isChangelogData(parsed)) {
      throw new Error('missing required fields');
    }
    return parsed;
  }, [json]);

  const handleDownload = useCallback(() => {
    try {
      const parsed = parseJson();
      const blob = new Blob([JSON.stringify(parsed, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'changelog.json';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('已下载 changelog.json');
    } catch {
      toast.error('JSON 格式或字段不正确，无法下载');
    }
  }, [parseJson]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success('已复制到剪贴板');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  }, [json]);

  const handleFormat = useCallback(() => {
    try {
      setJson(JSON.stringify(parseJson(), null, 2));
      toast.success('JSON 已格式化');
    } catch {
      toast.error('JSON 格式或字段不正确，无法格式化');
    }
  }, [parseJson]);

  const handlePreview = useCallback(() => {
    try {
      const parsed = parseJson();
      setPreviewData(parsed);
      toast.success('预览已更新');
    } catch {
      toast.error('JSON 格式或字段不正确，无法更新预览');
    }
  }, [parseJson]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="rounded-2xl border bg-gradient-to-br from-violet-500/15 via-background to-sky-500/10 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-violet-500">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">版本公告中心</span>
            </div>
            <h1 className="text-2xl font-semibold">Ayaka Chats v{previewData.version}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              在此预览公告、生成分享海报，并维护构建时使用的 changelog JSON。
            </p>
          </div>
          <div className="rounded-lg border bg-background/70 px-4 py-3 text-sm">
            <p className="text-muted-foreground">发布日期</p>
            <p className="mt-1 font-medium">{previewData.date}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="block border-0 p-0">
        <TabsList className="flex h-auto flex-row justify-start gap-1 overflow-x-auto bg-muted">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutList className="h-4 w-4" />
            公告概览
          </TabsTrigger>
          <TabsTrigger value="poster" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            海报预览
          </TabsTrigger>
          <TabsTrigger value="json" className="gap-2">
            <FileJson className="h-4 w-4" />
            JSON 编辑
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="ml-0 mt-6">
          <div className="mb-6 rounded-xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">v{previewData.version} · {previewData.date}</p>
            <p className="mt-2 text-lg font-medium">{previewData.tagline}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <FeatureGroup title="新功能" items={previewData.features} />
            <FeatureGroup title="UI / UX 改进" items={previewData.uiImprovements} />
            <FeatureGroup title="其他更新" items={previewData.otherUpdates} />
            {previewData.bugFixes.length > 0 && (
              <section className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 font-semibold">问题修复</h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {previewData.bugFixes.map((fix) => <li key={fix}>• {fix}</li>)}
                </ul>
              </section>
            )}
          </div>
        </TabsContent>

        <TabsContent value="poster" className="ml-0 mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">版本分享海报</h2>
              <p className="mt-1 text-sm text-muted-foreground">海报直接复用当前预览数据，可复制或下载。</p>
            </div>
            <PosterDownloadButton targetId="admin-release-poster" filename={filename} />
          </div>
          <div className="overflow-auto rounded-xl border bg-slate-950 p-3 sm:p-6">
            <div className="min-w-[1080px] overflow-hidden rounded-xl shadow-2xl">
              <ReleasePoster data={previewData} posterId="admin-release-poster" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="json" className="ml-0 mt-6 space-y-4">
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm text-muted-foreground">
              编辑后先更新预览，再下载文件替换 <code className="rounded bg-muted px-1 py-0.5 text-xs">src/FE/data/changelog.json</code>；重新构建后对所有用户生效。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleFormat}>格式化</Button>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? '已复制' : '复制'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview}>更新预览</Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
                下载 JSON
              </Button>
            </div>
          </div>
          <Textarea
            value={json}
            onChange={(event) => setJson(event.target.value)}
            className="min-h-[640px] font-mono text-sm"
            spellCheck={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
