import type { TerminalThemeId } from './themes'

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export type MessageType = 'message' | 'join' | 'part' | 'quit' | 'notice' | 'action' | 'system' | 'nick_change' | 'kick' | 'mode' | 'ctcp'

export type MessageDensity = 'compact' | 'cozy' | 'comfortable'

export type TimestampFormat = '12h' | '24h'

export type UiFontPreset = 'default' | 'system' | 'inter' | 'sf-pro' | 'segoe-ui' | 'roboto'

export type MonoFontPreset =
  | 'default'
  | 'system'
  | 'hack'
  | 'fira-code'
  | 'jetbrains-mono'
  | 'source-code-pro'

export interface IRCServer {
  id: string
  name: string
  host: string
  port: number
  ssl: boolean
  allowInvalidCerts?: boolean
  autoConnect?: boolean
  nickname: string
  username: string
  realName: string
  password?: string
  saslEnabled: boolean
  saslUsername?: string
  saslPassword?: string
  autoJoinChannels: string[]
  onJoinCommands: string[]
  status: ConnectionStatus
  channels: IRCChannel[]
  serverMessages: IRCMessage[]
  latency: number
  collapsed: boolean
  awayMessage: string
}

export interface IRCChannel {
  id: string
  serverId: string
  name: string
  topic: string
  topicSetBy?: string
  messages: IRCMessage[]
  users: IRCUser[]
  unreadCount: number
  mentionCount: number
  isDirectMessage: boolean
  joined: boolean
  showJoinPart: boolean
  modes: string
}

export interface IRCMessage {
  id: string
  channelId: string
  serverId: string
  type: MessageType
  nickname: string
  content: string
  timestamp: Date
  isHighlight: boolean
}

export interface IRCUser {
  nickname: string
  username?: string
  realName?: string
  hostmask?: string
  modes: string[]
  isOp: boolean
  isVoiced: boolean
  isAway: boolean
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  colorTheme: TerminalThemeId
  fontSize: number
  messageDensity: MessageDensity
  timestampFormat: TimestampFormat
  showJoinPartQuit: boolean
  showStatusPrefixesInChat: boolean
  accentColor: string
  uiFontPreset: UiFontPreset
  monoFontPreset: MonoFontPreset
  desktopNotifications: boolean
  notificationSounds: boolean
  highlightWords: string[]
  dmNotifications: boolean
  maxScrollbackLines: number
  inlineImagePreviews: boolean
  linkPreviews: boolean
  syntaxHighlighting: boolean
  ircColors: boolean
  nickColorScheme: 'default' | 'pastel' | 'vivid'
  avatarUrl?: string
  defaultNickname: string
  fallbackNicknames: string[]
  defaultUsername: string
  defaultRealName: string
  ignoreList: string[]
  quitMessage: string
  autoReconnect: boolean
  autoReconnectDelay: number
  encoding: string
  showRawLog: boolean
  saveAllLogs: boolean
  keybindings: Record<string, string>
}

export interface ActiveView {
  serverId: string
  channelId: string
}
