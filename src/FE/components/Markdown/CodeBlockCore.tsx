import { FC, memo, useState } from 'react';
import { useTheme } from 'next-themes';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import useTranslation from '@/hooks/useTranslation';

import { IconCheck, IconClipboard, IconDownload } from '@/components/Icons/index';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  language: string;
  value: string;
}

export const CodeBlockCore: FC<Props> = memo(({ language, value }) => {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const baseTheme = resolvedTheme === 'dark' ? oneDark : oneLight;

  const copyToClipboard = (e: React.MouseEvent) => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
    e.stopPropagation();
  };

  const downloadAsFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `code.${language || 'txt'}`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="codeblock relative font-sans text-base group my-4 border rounded-md bg-muted overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted-foreground/10 text-xs text-muted-foreground">
        <span className="font-mono lowercase">{language || 'text'}</span>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={downloadAsFile}
                >
                  <IconDownload size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('Download')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={copyToClipboard}
                >
                  {isCopied ? (
                    <IconCheck stroke={'currentColor'} size={14} />
                  ) : (
                    <IconClipboard stroke={'currentColor'} size={14} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isCopied ? t('Copied') : t('Click Copy')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="p-0 overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={baseTheme}
          customStyle={{
            margin: 0,
            background: 'transparent',
            borderRadius: 0,
            padding: '12px',
          }}
          codeTagProps={{
            style: { background: 'transparent' },
          }}
          useInlineStyles
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});

CodeBlockCore.displayName = 'CodeBlockCore';
