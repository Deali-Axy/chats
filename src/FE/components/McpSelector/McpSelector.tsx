import { FC, useEffect, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { getMcpDisplayLabel } from '@/utils/mcp';

import { ChatSpanMcp, McpServerListItemDto } from '@/types/clientApis';

import { IconPlus, IconTools, IconTrash } from '../Icons';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { getMcpServers } from '@/apis/clientApis';

interface Props {
  value: ChatSpanMcp[];
  onValueChange: (value: ChatSpanMcp[]) => void;
  onRequestMcpLoad?: () => Promise<void>; // 请求加载MCP服务器的回调
  mcpServersLoaded?: boolean; // MCP服务器是否已加载
  validate?: () => string | null; // 返回错误信息，null表示验证通过
}

const McpSelector: FC<Props> = ({
  value = [],
  onValueChange,
  onRequestMcpLoad,
  mcpServersLoaded = false,
}) => {
  const { t } = useTranslation();
  const [mcpServers, setMcpServers] = useState<McpServerListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 验证MCP配置
  const validateMcps = (): string | null => {
    const selectedNames = value
      .map((mcp) => mcpServers.find((server) => server.id === mcp.id)?.name.toLowerCase())
      .filter((name): name is string => !!name);
    if (new Set(selectedNames).size !== selectedNames.length) {
      return t('MCP servers with the same name cannot be enabled together');
    }

    for (let i = 0; i < value.length; i++) {
      const mcp = value[i];

      // 检查是否选择了工具
      if (!mcp.id || mcp.id === 0) {
        return t('Please select a tool for MCP entry') + ` ${i + 1}`;
      }

      // 检查自定义Header是否为有效JSON
      if (mcp.customHeaders && mcp.customHeaders.trim()) {
        try {
          JSON.parse(mcp.customHeaders);
        } catch (error) {
          return (
            t('Invalid JSON format in custom headers for MCP entry') +
            ` ${i + 1}`
          );
        }
      }
    }
    return null;
  };

  // 对外暴露验证函数
  if (typeof window !== 'undefined') {
    (window as any).validateMcps = validateMcps;
  }

  // 组件初始化时不自动加载MCP服务器列表，由父组件控制
  useEffect(() => {
    // 父组件告知可以加载时，并且本地还没有数据或未在加载中，再触发一次请求
    if (mcpServersLoaded && !isLoading && mcpServers.length === 0) {
      fetchMcpServers();
    }
  }, [mcpServersLoaded]);

  const fetchMcpServers = async () => {
    try {
      setIsLoading(true);
      const servers = await getMcpServers();
      setMcpServers(servers);
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMcp = async () => {
    // 当用户点击加号时，触发父组件加载MCP服务器（只发信号，不直接请求）
    if (onRequestMcpLoad && !mcpServersLoaded) {
      await onRequestMcpLoad();
    }
    // 如果本地还没有服务器列表，且父组件已允许加载，则由本组件拉取一次
    if (mcpServersLoaded && mcpServers.length === 0 && !isLoading) {
      await fetchMcpServers();
    }

    // 获取已选择的服务器ID
    const selectedIds = value.map((mcp) => mcp.id);
    const selectedNames = new Set(
      value
        .map((mcp) => mcpServers.find((server) => server.id === mcp.id)?.name.toLowerCase())
        .filter((name): name is string => !!name),
    );

    // 找到第一个未被选择的服务器
    const availableServer = mcpServers.find(
      (server) => !selectedIds.includes(server.id) && !selectedNames.has(server.name.toLowerCase()),
    );

    // 添加一个新的MCP项
    const newMcp: ChatSpanMcp = {
      id: availableServer
        ? availableServer.id
        : mcpServers.length > 0
        ? mcpServers[0].id
        : 0,
      customHeaders: '',
    };
    onValueChange([...value, newMcp]);
  };

  const handleUpdateMcp = (
    index: number,
    field: keyof ChatSpanMcp,
    newValue: string | number,
  ) => {
    const updatedMcps = value.map((mcp, i) =>
      i === index ? { ...mcp, [field]: newValue } : mcp,
    );
    onValueChange(updatedMcps);
  };

  const handleDeleteMcp = (index: number) => {
    const updatedMcps = value.filter((_, i) => i !== index);
    onValueChange(updatedMcps);
  };

  const getAvailableServers = (currentIndex: number) => {
    const selectedIds = value
      .map((mcp, index) => (index !== currentIndex ? mcp.id : null))
      .filter((id) => id !== null);

    return mcpServers.filter((server) => !selectedIds.includes(server.id));
  };

  const hasNameConflict = (server: McpServerListItemDto, currentIndex: number) => {
    return value.some((mcp, index) => {
      if (index === currentIndex) return false;
      const selected = mcpServers.find((candidate) => candidate.id === mcp.id);
      return selected?.name.toLowerCase() === server.name.toLowerCase();
    });
  };

  const getServerLabel = (id: number) => {
    const server = mcpServers.find((s) => s.id === id);
    return server ? getMcpDisplayLabel(server) : `Server ${id}`;
  };

  const hasAvailableServers = () => {
    const selectedIds = value.map((mcp) => mcp.id);
    const selectedNames = new Set(
      value
        .map((mcp) => mcpServers.find((server) => server.id === mcp.id)?.name.toLowerCase())
        .filter((name): name is string => !!name),
    );
    return mcpServers.some(
      (server) => !selectedIds.includes(server.id) && !selectedNames.has(server.name.toLowerCase()),
    );
  };

  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <IconTools size={18} className="text-muted-foreground" />
          {t('MCP Tools')}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddMcp}
          disabled={isLoading || (mcpServersLoaded && !hasAvailableServers())}
          className="h-8 w-8 rounded-lg border border-border bg-background p-0 shadow-sm hover:bg-muted"
        >
          <IconPlus size={20} />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {value.map((mcp, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-border/80 bg-background p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
            >
              <div className="flex-1">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {t('Tool Name')}
                </div>
                <Select
                  value={mcp.id > 0 ? mcp.id.toString() : ''}
                  onValueChange={(newValue) =>
                    handleUpdateMcp(index, 'id', parseInt(newValue))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-9 border-border/80 bg-muted/20">
                    <SelectValue
                      placeholder={
                        isLoading ? t('Loading...') : t('Select Tool')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem disabled value="loading">
                        {t('Loading...')}
                      </SelectItem>
                    ) : (
                      getAvailableServers(index).map((server) => (
                        <SelectItem
                          key={server.id}
                          value={server.id.toString()}
                          disabled={hasNameConflict(server, index)}
                        >
                          {getMcpDisplayLabel(server)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {t('Custom Headers (JSON)')}
                </div>
                <Input
                  value={mcp.customHeaders || ''}
                  onChange={(e) =>
                    handleUpdateMcp(index, 'customHeaders', e.target.value)
                  }
                  placeholder='{"key": "value"}'
                  className="h-9 border-border/80 bg-muted/20"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteMcp(index)}
                className="h-9 w-9 rounded-lg p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <IconTrash size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default McpSelector;
