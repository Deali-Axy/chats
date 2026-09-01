import { Dispatch, SetStateAction, createContext } from 'react';

import { ActionType } from '@/hooks/useCreateReducer';

import { CHATS_SELECT_TYPE, IChat, IChatPaging } from '@/types/chat';
import { GetChatsParams } from '@/types/clientApis';
import { IChatGroup } from '@/types/group';
import { Prompt, PromptSlim } from '@/types/prompt';
import { getSettings } from '@/utils/settings';

import {
  ChatAction,
} from '@/reducers/chat.reducer';
import {
  MessageAction,
} from '@/reducers/message.reducer';
import {
  ModelAction,
} from '@/reducers/model.reducer';
import {
  PromptAction,
} from '@/reducers/prompt.reducer';
import { SettingsAction } from '@/reducers/setting.reducer';

import { AdminModelDto } from '@/types/adminApis';
import { IChatMessage } from '@/types/chatMessage';

export interface HandleUpdateChatParams {
  isShared?: boolean;
  title?: string;
  chatModelId?: string;
}

export interface HomeInitialState {
  messages: IChatMessage[];
  selectedMessages: IChatMessage[][];

  chats: IChat[];
  chatGroups: IChatGroup[];
  selectedChatId: string | undefined;
  chatPaging: IChatPaging[];
  isChatsLoading: boolean;
  isMessagesLoading: boolean;
  chatsSelectType: CHATS_SELECT_TYPE;

  models: AdminModelDto[];
  modelMap: Record<string, AdminModelDto>;

  defaultPrompt: Prompt | null;
  prompts: PromptSlim[];

  showChatBar: boolean;
  showChatInput: boolean;
  chatBarWidth: number;
  effectiveChatBarWidth: number;
  chatBarMaxWidth: number;
}

export const initialState: HomeInitialState = {
  messages: [],
  selectedMessages: [],

  chats: [],
  chatGroups: [],
  selectedChatId: undefined,
  chatPaging: [],
  isChatsLoading: false,
  isMessagesLoading: false,
  chatsSelectType: CHATS_SELECT_TYPE.NONE,

  models: [],
  modelMap: {},

  defaultPrompt: null,
  prompts: [],

  showChatBar: getSettings().showChatBar,
  showChatInput: true,
  chatBarWidth: getSettings().chatBarWidth,
  effectiveChatBarWidth: getSettings().chatBarWidth,
  chatBarMaxWidth: getSettings().chatBarWidth,
};

export interface HomeContextProps {
  state: HomeInitialState;
  dispatch: Dispatch<ActionType<HomeInitialState>>;

  // 计算属性
  selectedChat: IChat | undefined;

  chatDispatch: Dispatch<ChatAction>;
  messageDispatch: Dispatch<MessageAction>;
  modelDispatch: Dispatch<ModelAction>;
  settingDispatch: Dispatch<SettingsAction>;
  promptDispatch: Dispatch<PromptAction>;

  hasModel: () => boolean;
  /** 显示新聊天欢迎页，不创建持久化聊天。 */
  handleNewChat: () => void;
  /** 创建持久化聊天，用于欢迎页和分组内的新建操作。 */
  handleCreateChat: (
    groupId?: string | null,
    modelId?: number,
  ) => Promise<void>;
  /** 创建临时聊天 */
  handleNewTempChat: () => void;
  /** 结束临时对话 */
  handleEndTempChat: () => void;
  /** 临时聊天对象 */
  tempChat: IChat | null;
  /** 更新临时聊天对象 */
  setTempChat: Dispatch<SetStateAction<IChat | null>>;
  handleDeleteChat: (ids: string[]) => void;
  handleSelectChat: (chat: IChat) => void;
  handleUpdateChat: (
    chats: IChat[],
    id: string,
    params: HandleUpdateChatParams,
  ) => void;
  getChats: (query?: string) => Promise<void>;
  getChatsByGroup: (params: GetChatsParams) => void;
  handleStopChats: () => void;
}

const HomeContext = createContext<HomeContextProps>(undefined!);

export default HomeContext;
