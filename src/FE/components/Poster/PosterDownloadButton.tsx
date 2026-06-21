import React, { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
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

  const handleDownload = useCallback(async () => {
    const element = document.getElementById(targetId);
    if (!element) {
      toast.error('海报元素未找到');
      return;
    }

    setIsGenerating(true);

    try {
      // 生成 PNG 图片
      const dataUrl = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // 高清图片
        backgroundColor: '#0f172a', // 防止透明背景
      });

      // 创建下载链接
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
  }, [targetId, filename]);

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
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
  );
};

export default PosterDownloadButton;
