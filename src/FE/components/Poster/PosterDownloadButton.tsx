import React, { useCallback, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { Download, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface PosterDownloadButtonProps {
  targetId: string;
  filename?: string;
}

const PosterDownloadButton: React.FC<PosterDownloadButtonProps> = ({
  targetId,
  filename = 'ayaka-chats-v1.13.0-release.png',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const getElement = useCallback(() => {
    const element = document.getElementById(targetId);
    if (!element) {
      toast.error('海报元素未找到');
      return null;
    }
    return element;
  }, [targetId]);

  const handleDownload = useCallback(async () => {
    const element = getElement();
    if (!element) return;

    setIsGenerating(true);

    try {
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast.success('海报已生成并开始下载');
    } catch (error) {
      console.error('生成海报失败:', error);
      toast.error('生成海报失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [getElement, filename]);

  const handleCopy = useCallback(async () => {
    const element = getElement();
    if (!element) return;

    // 检查剪贴板 API 是否可用
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      toast.error('当前浏览器不支持复制图片，请使用下载功能');
      return;
    }

    setIsCopying(true);

    try {
      const blob = await toBlob(element, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });

      if (!blob) {
        throw new Error('生成图片失败');
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      toast.success('海报已复制到剪贴板，可直接粘贴到聊天窗口');
    } catch (error) {
      console.error('复制海报失败:', error);
      toast.error('复制失败，请尝试使用下载功能');
    } finally {
      setIsCopying(false);
    }
  }, [getElement]);

  const isLoading = isGenerating || isCopying;

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleCopy}
        disabled={isLoading}
        variant="outline"
        className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
        size="lg"
      >
        {isCopying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            复制中...
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" />
            复制图片
          </>
        )}
      </Button>
      <Button
        onClick={handleDownload}
        disabled={isLoading}
        className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            下载海报
          </>
        )}
      </Button>
    </div>
  );
};

export default PosterDownloadButton;
