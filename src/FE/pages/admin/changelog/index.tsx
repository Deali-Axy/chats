import React, { useState, useCallback } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import changelogData from '@/data/changelog.json';

export default function AdminChangelogPage() {
  const [json, setJson] = useState(() => JSON.stringify(changelogData, null, 2));
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'changelog.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已下载 changelog.json');
  }, [json]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  }, [json]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(json);
      setJson(JSON.stringify(parsed, null, 2));
      toast.success('JSON 已格式化');
    } catch {
      toast.error('JSON 格式错误，无法格式化');
    }
  }, [json]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            编辑更新日志 JSON 数据，修改后下载文件替换 <code className="rounded bg-white/10 px-1 py-0.5 text-xs">src/FE/data/changelog.json</code>，重新构建即可生效。
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFormat}>
            格式化
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? '已复制' : '复制'}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            下载 JSON
          </Button>
        </div>
      </div>

      <Textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        className="min-h-[600px] font-mono text-sm"
        spellCheck={false}
      />
    </div>
  );
}
