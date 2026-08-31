import { useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import useTranslation from '@/hooks/useTranslation';

import { AdminModelDto } from '@/types/adminApis';
import { DEFAULT_TEMPERATURE } from '@/types/chat';
import { ChatSpanDto, ChatSpanMcp } from '@/types/clientApis';
import { Prompt } from '@/types/prompt';

import ModelProviderIcon from '@/components/common/ModelProviderIcon';
import ChatModelDropdownMenu from '@/components/ChatModelDropdownMenu/ChatModelDropdownMenu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import { setChats } from '@/actions/chat.actions';
import HomeContext from '@/contexts/home.context';
import ChatModelInfo from './ChatModelInfo';
import ChatResponsePresetConfig from './ChatResponsePresetConfig';
import ImageGenerationPresetConfig from './ImageGenerationPresetConfig';

import { putChatSpan } from '@/apis/clientApis';

interface Props {
  spanId: number;
  notSetSpanDisabled: boolean;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (spanId: number) => void;
}
const ChatModelSettingModal = (props: Props) => {
  const { spanId, notSetSpanDisabled, isOpen, onRemove, onClose } = props;
  const {
    state: { modelMap, prompts, models, chats },
    selectedChat,
    chatDispatch,
  } = useContext(HomeContext);
  const [span, setSpan] = useState<ChatSpanDto>();
  const [model, setModel] = useState<AdminModelDto>();
  const [isLoading, setIsLoading] = useState(false);
  const [mcpServersLoaded, setMcpServersLoaded] = useState(false);
  const [mcpLoadingTriggered, setMcpLoadingTriggered] = useState(false);

  // JSON 验证函数
  const validateJSON = (jsonString: string): boolean => {
    if (!jsonString.trim()) return true; // 空字符串认为是有效的
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  // 检查是否需要在初始化时加载MCP
  const shouldLoadMcpOnInit = (currentSpan?: ChatSpanDto) => {
    if (!currentSpan) return false;
    return currentSpan.mcps && currentSpan.mcps.length > 0;
  };

  // 加载MCP服务器数据
  const loadMcpServers = useCallback(async () => {
    if (mcpServersLoaded || mcpLoadingTriggered) return;
    setMcpLoadingTriggered(true);
    setMcpServersLoaded(true);
  }, [mcpLoadingTriggered, mcpServersLoaded]);

  useEffect(() => {
    if (!selectedChat || !isOpen) return;
    
    const originalSpan = selectedChat.spans.find((x) => x.spanId === spanId);
    if (!originalSpan) {
      return;
    }
    const normalizedSpan: ChatSpanDto = {
      ...originalSpan,
      mcps: originalSpan.mcps || [],
      thinkingBudget: originalSpan.thinkingBudget ?? null,
      reasoningEffort: originalSpan.reasoningEffort ?? null,
      format: originalSpan.format ?? null,
      compression: originalSpan.compression ?? null,
      background: originalSpan.background ?? null,
    };
    setSpan(normalizedSpan);
    setModel(modelMap[normalizedSpan.modelId]);
    
    // 只在以下情况加载MCP服务器数据：
    // A. 当前span拥有至少一个MCP时
    if (shouldLoadMcpOnInit(normalizedSpan)) {
      loadMcpServers();
    }
  }, [isOpen, loadMcpServers, modelMap, selectedChat, spanId]);

  useEffect(() => {
    if (!isOpen) {
      setMcpServersLoaded(false);
      setMcpLoadingTriggered(false);
    }
  }, [isOpen]);

  const { t } = useTranslation();

  const onChangeModel = (model: AdminModelDto) => {
    setModel(modelMap[model?.modelId]);
    const nextThinkingBudget = (() => {
      if (!span) return null;
      if (model.maxThinkingBudget === null) {
        return null;
      }
      if (span.thinkingBudget === null) {
        return null;
      }
      return Math.min(span.thinkingBudget, model.maxThinkingBudget);
    })();
    const nextReasoningEffort =
      span?.reasoningEffort && model.supportedEfforts.includes(span.reasoningEffort)
        ? span.reasoningEffort
        : null;
    const nextImageSize =
      span?.imageSize && model.supportedImageSizes.includes(span.imageSize)
        ? span.imageSize
        : null;
    const nextFormat =
      span?.format && model.supportedFormats.includes(span.format)
        ? span.format
        : null;
    setSpan({
      ...span!,
      modelId: model.modelId,
      modelName: model.name,
      modelProviderId: model.modelProviderId,
      reasoningEffort: nextReasoningEffort,
      imageSize: nextImageSize,
      format: nextFormat,
      compression: nextFormat ? span?.compression ?? null : null,
      background: span?.background ?? null,
      thinkingBudget: nextThinkingBudget,
    });
  };

  const onChangePrompt = (prompt: Prompt) => {
    const promptTemperature = prompt.temperature;
    setSpan({
      ...span!,
      systemPrompt: prompt.content,
      temperature:
        promptTemperature != null ? promptTemperature : span!.temperature,
    });
  };

  const onChangePromptText = (value: string) => {
    setSpan({ ...span!, systemPrompt: value });
  };

  const onChangeTemperature = (value: number | null) => {
    setSpan({ ...span!, temperature: value });
  };

  const onChangeEnableSearch = (value: boolean) => {
    setSpan({ ...span!, webSearchEnabled: value });
  };

  const onChangeCodeExecution = (value: boolean) => {
    setSpan({ ...span!, codeExecutionEnabled: value });
  };

  const onChangeReasoningEffort = (value: string) => {
    setSpan({ ...span!, reasoningEffort: value === '' ? null : value });
  };

  const onChangeImageQuality = (value: string) => {
    setSpan({ ...span!, reasoningEffort: value === '' ? null : value });
  };

  const onChangeImageSize = (value: string | null) => {
    setSpan({ ...span!, imageSize: value });
  };

  const onChangeFormat = (value: string | null) => {
    const nextFormat = span?.background === 'transparent' && value !== 'png' && value !== 'webp'
      ? 'png'
      : value;
    setSpan({
      ...span!,
      format: nextFormat,
      compression: nextFormat === null ? null : span?.compression ?? null,
    });
  };

  const onChangeCompression = (value: number | null) => {
    setSpan({ ...span!, compression: value });
  };

  const onChangeBackground = (value: string | null) => {
    setSpan({
      ...span!,
      background: value === 'transparent' && span?.format !== 'png' && span?.format !== 'webp'
        ? 'transparent'
        : value,
      format: value === 'transparent' && span?.format !== 'png' && span?.format !== 'webp'
        ? 'png'
        : span?.format ?? null,
    });
  };

  const onChangeThinkingBudget = (value: number | null) => {
    setSpan({ ...span!, thinkingBudget: value });
  };

  const onChangeMcps = (mcps: ChatSpanMcp[]) => {
    setSpan({ ...span!, mcps });
  };

  const onChangeMaxOutputTokens = (value: number | null) => {
    setSpan({ ...span!, maxOutputTokens: value });
  };

  const onChangeSpanEnable = (value: boolean) => {
    if (notSetSpanDisabled && value === false) {
      return;
    }
    setSpan({ ...span!, enabled: value });
  };

  const handleSave = async () => {
    if (!span || !selectedChat) return;

    if (span.modelId == null || !model) {
      toast.error(t('Model not available'));
      return;
    }

    // 验证MCP工具设置
    if (span.mcps && span.mcps.length > 0) {
      for (const mcp of span.mcps) {
        // 验证工具名是否为空
        if (!mcp.id || mcp.id === 0) {
          toast.error(t('All MCP tools must have a valid tool name'));
          return;
        }
        
        // 验证自定义headers是否为有效的JSON
        if (mcp.customHeaders && !validateJSON(mcp.customHeaders)) {
          toast.error(t('Invalid JSON format in MCP custom headers'));
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      await putChatSpan(span.spanId, selectedChat.id, {
        enabled: span.enabled,
        modelId: span.modelId,
        systemPrompt: span.systemPrompt,
        maxOutputTokens: span?.maxOutputTokens ?? null,
        temperature: span?.temperature ?? null,
        reasoningEffort: span.reasoningEffort,
        webSearchEnabled: !!span.webSearchEnabled,
        codeExecutionEnabled: !!span.codeExecutionEnabled,
        imageSize: span.imageSize ?? null,
        format: span.format ?? null,
        compression: span.compression ?? null,
        background: span.background ?? null,
        thinkingBudget: span.thinkingBudget ?? null,
        mcps: span.mcps,
      });
      
      const updatedSpans = selectedChat.spans.map((s) =>
        s.spanId === spanId ? { ...span } : s,
      );
      const updatedChat = { ...selectedChat, spans: updatedSpans };
      const updatedChats = chats.map((chat) =>
        chat.id === selectedChat.id ? updatedChat : chat
      );
      
      chatDispatch(setChats(updatedChats));
      onClose();
    } catch (error) {
      console.error('Failed to save chat span:', error);
      toast.error(t('Failed to save settings'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[min(90vh,780px)] w-[calc(100%-2rem)] max-w-[720px] flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl sm:w-full">
        {span && (
          <>
            <div className="shrink-0 border-b border-border/70 bg-gradient-to-br from-muted/70 via-background to-primary/5 px-5 pb-4 pt-5 sm:px-6">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {t('Model Settings')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('Configure this model for the current conversation')}
              </DialogDescription>
              <div className="mt-4 flex flex-col gap-1.5">
                <ChatModelDropdownMenu
                  className="p-0"
                  triggerClassName={
                    'h-14 w-full rounded-xl border-border/80 bg-background/90 px-4 text-base font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-background'
                  }
                  groupClassName="scroller md:!max-h-80 md:!overflow-y-auto"
                  models={models}
                  content={
                    <div className="flex min-w-0 items-center gap-3">
                      {span.modelProviderId != null && (
                        <ModelProviderIcon providerId={span.modelProviderId} />
                      )}
                      <span className="truncate">
                        {model?.name || span.modelName || t('Model not available')}
                      </span>
                    </div>
                  }
                  hideIcon={true}
                  onChangeModel={(model) => {
                    onChangeModel(model);
                  }}
                />
                {span.modelId != null && (
                  <div className="px-1 text-xs text-muted-foreground">
                    <ChatModelInfo modelId={span.modelId} />
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 overscroll-contain sm:px-6">
              <div className="space-y-4 pb-1">
              {/* 根据模型的 API 类型显示不同的配置组件 */}
              {model && (
                <>
                  {/* Chat/Response/AnthropicMessages API 配置 (apiType=0/1/3) */}
                  {(model.apiType === 0 || model.apiType === 1 || model.apiType === 3) && (
                    <ChatResponsePresetConfig
                      model={model}
                      systemPrompt={span.systemPrompt}
                      prompts={prompts}
                      webSearchEnabled={span.webSearchEnabled}
                      codeExecutionEnabled={span.codeExecutionEnabled}
                      reasoningEffort={span.reasoningEffort}
                      thinkingBudget={span.thinkingBudget}
                      mcps={span.mcps || []}
                      temperature={span.temperature}
                      maxOutputTokens={span.maxOutputTokens}
                      mcpServersLoaded={mcpServersLoaded}
                      onChangePromptText={onChangePromptText}
                      onChangePrompt={onChangePrompt}
                      onChangeEnableSearch={onChangeEnableSearch}
                      onChangeCodeExecution={onChangeCodeExecution}
                      onChangeReasoningEffort={onChangeReasoningEffort}
                      onChangeThinkingBudget={onChangeThinkingBudget}
                      onChangeMcps={onChangeMcps}
                      onChangeTemperature={onChangeTemperature}
                      onChangeMaxOutputTokens={onChangeMaxOutputTokens}
                      onRequestMcpLoad={loadMcpServers}
                    />
                  )}
                  
                  {/* ImageGeneration API 配置 (apiType=2) */}
                  {model.apiType === 2 && (
                    <ImageGenerationPresetConfig
                      model={model}
                      imageSize={span.imageSize}
                      reasoningEffort={span.reasoningEffort}
                      format={span.format}
                      compression={span.compression}
                      background={span.background}
                      maxOutputTokens={span.maxOutputTokens}
                      onChangeImageSize={onChangeImageSize}
                      onChangeImageQuality={onChangeImageQuality}
                      onChangeFormat={onChangeFormat}
                      onChangeCompression={onChangeCompression}
                      onChangeBackground={onChangeBackground}
                      onChangeMaxOutputTokens={onChangeMaxOutputTokens}
                    />
                  )}
                </>
              )}
              </div>
            </div>
          </>
        )}
        <DialogFooter className="shrink-0 border-t border-border/70 bg-muted/30 px-5 py-3 sm:px-6">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-medium sm:justify-start">
              <span>{span?.enabled ? t('Enabled') : t('Disabled')}</span>
              <Switch onCheckedChange={onChangeSpanEnable} checked={span?.enabled} />
            </label>
            <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onRemove(spanId);
                onClose();
              }}
              className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            >
              {t('Remove')}
            </Button>
            <Button
              variant="default"
              disabled={isLoading}
              onClick={() => {
                handleSave();
              }}
            >
              {isLoading ? t('Saving...') : t('Save')}
            </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModelSettingModal;
