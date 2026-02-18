import { create } from 'zustand'
import type { IRCServer, IRCChannel, IRCMessage, AppSettings, ActiveView, MessageType, ConnectionStatus } from './types'
import { mockServers, defaultSettings } from './mock-data'
import { getThemeById } from './themes'
import type { TerminalThemeId } from './themes'
import { isDemoBuild, isLiveBuild } from './build-mode'
import {
  connectNativeIrc,
  disconnectNativeIrc,
  joinNativeIrc,
  listenNativeIrcEvents,
  partNativeIrc,
  sendNativePrivmsg,
  sendNativeRaw,
} from './irc-native'

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function applyColorTheme(themeId: TerminalThemeId) {
  if (typeof document === 'undefined') return
  const theme = getThemeById(themeId)
  const root = document.documentElement
  const c = theme.colors

  root.style.setProperty('--background', hexToHSL(c.background))
  root.style.setProperty('--foreground', hexToHSL(c.foreground))
  root.style.setProperty('--card', hexToHSL(c.card))
  root.style.setProperty('--card-foreground', hexToHSL(c.cardForeground))
  root.style.setProperty('--popover', hexToHSL(c.card))
  root.style.setProperty('--popover-foreground', hexToHSL(c.cardForeground))
  root.style.setProperty('--primary', hexToHSL(c.primary))
  root.style.setProperty('--primary-foreground', hexToHSL(c.primaryForeground))
  root.style.setProperty('--secondary', hexToHSL(c.secondary))
  root.style.setProperty('--secondary-foreground', hexToHSL(c.secondaryForeground))
  root.style.setProperty('--muted', hexToHSL(c.muted))
  root.style.setProperty('--muted-foreground', hexToHSL(c.mutedForeground))
  root.style.setProperty('--accent', hexToHSL(c.accent))
  root.style.setProperty('--accent-foreground', hexToHSL(c.accentForeground))
  root.style.setProperty('--border', hexToHSL(c.border))
  root.style.setProperty('--input', hexToHSL(c.border))
  root.style.setProperty('--ring', hexToHSL(c.primary))
  root.style.setProperty('--surface', hexToHSL(c.surface))
  root.style.setProperty('--surface-foreground', hexToHSL(c.surfaceForeground))
  root.style.setProperty('--sidebar-background', hexToHSL(c.sidebarBg))
  root.style.setProperty('--sidebar-foreground', hexToHSL(c.sidebarFg))
  root.style.setProperty('--sidebar-border', hexToHSL(c.sidebarBorder))
  root.style.setProperty('--sidebar-primary', hexToHSL(c.primary))
  root.style.setProperty('--sidebar-primary-foreground', hexToHSL(c.primaryForeground))
  root.style.setProperty('--sidebar-accent', hexToHSL(c.secondary))
  root.style.setProperty('--sidebar-accent-foreground', hexToHSL(c.secondaryForeground))
  root.style.setProperty('--sidebar-ring', hexToHSL(c.primary))

  // Also set data attribute for code blocks
  root.setAttribute('data-color-theme', themeId)

  // Handle dark/light class
  if (theme.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Re-apply user accent override if present
  try {
    const stored = localStorage.getItem('patchcord-settings')
    if (stored) {
      const parsed = JSON.parse(stored) as { accentColor?: string }
      if (parsed.accentColor) {
        const accent = hexToHSL(parsed.accentColor)
        root.style.setProperty('--primary', accent)
        root.style.setProperty('--accent', accent)
        root.style.setProperty('--ring', accent)
      }
    }
  } catch {}
}

export function applyFontPreferences(settings: AppSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-font-ui', settings.uiFontPreset || 'default')
  root.setAttribute('data-font-mono', settings.monoFontPreset || 'default')
}

export interface LogEntry {
  id: string
  serverId: string
  serverName: string
  channelId: string
  channelName: string
  timestamp: Date
  type: MessageType
  nickname: string
  content: string
}

function loadLogHistory(): LogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('patchcord-log-history')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((e: LogEntry) => ({ ...e, timestamp: new Date(e.timestamp) }))
    }
  } catch {}
  return []
}

function saveLogHistory(logs: LogEntry[]) {
  if (typeof window === 'undefined') return
  try {
    // Keep max 10000 entries
    const trimmed = logs.slice(-10000)
    localStorage.setItem('patchcord-log-history', JSON.stringify(trimmed))
  } catch {}
}

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const stored = localStorage.getItem('patchcord-settings')
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {}
  return defaultSettings
}

function saveSettings(settings: AppSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('patchcord-settings', JSON.stringify(settings))
  } catch {}
}

type ServerSnapshot = Pick<
  IRCServer,
  | 'id'
  | 'name'
  | 'host'
  | 'port'
  | 'ssl'
  | 'allowInvalidCerts'
  | 'autoConnect'
  | 'nickname'
  | 'username'
  | 'realName'
  | 'password'
  | 'saslEnabled'
  | 'saslUsername'
  | 'saslPassword'
  | 'autoJoinChannels'
  | 'onJoinCommands'
>

function loadServersSnapshot(): IRCServer[] {
  if (typeof window === 'undefined' || isDemoBuild) return []
  try {
    const stored = localStorage.getItem('patchcord-servers')
    if (!stored) return []
    const parsed = JSON.parse(stored) as ServerSnapshot[]
    return parsed.map((s) => ({
      ...s,
      status: 'disconnected' as ConnectionStatus,
      channels: [],
      serverMessages: [],
      latency: 0,
      collapsed: false,
      awayMessage: '',
    }))
  } catch {
    return []
  }
}

function saveServersSnapshot(servers: IRCServer[]) {
  if (typeof window === 'undefined') return
  try {
    const snapshot: ServerSnapshot[] = servers.map((s) => ({
      id: s.id,
      name: s.name,
      host: s.host,
      port: s.port,
      ssl: s.ssl,
      allowInvalidCerts: s.allowInvalidCerts,
      autoConnect: s.autoConnect,
      nickname: s.nickname,
      username: s.username,
      realName: s.realName,
      password: s.password,
      saslEnabled: s.saslEnabled,
      saslUsername: s.saslUsername,
      saslPassword: s.saslPassword,
      autoJoinChannels: s.autoJoinChannels,
      onJoinCommands: s.onJoinCommands,
    }))
    localStorage.setItem('patchcord-servers', JSON.stringify(snapshot))
  } catch {}
}

interface IRCStore {
  servers: IRCServer[]
  settings: AppSettings
  activeView: ActiveView
  sidebarOpen: boolean
  sidebarWidth: number
  sidebarCollapsed: boolean
  userListOpen: boolean
  userListWidth: number
  userListCollapsed: boolean
  settingsOpen: boolean
  searchOpen: boolean
  searchQuery: string
  splitView: boolean
  splitChannelId: string | null
  rawLogOpen: boolean
  rawLogMessages: string[]
  commandHistory: string[]
  commandHistoryIndex: number
  logHistory: LogEntry[]
  logViewerOpen: boolean

  // Server actions
  addServer: (server: Omit<IRCServer, 'id' | 'status' | 'channels' | 'latency' | 'collapsed'>) => void
  updateServer: (serverId: string, data: Partial<Omit<IRCServer, 'id' | 'status' | 'channels' | 'latency' | 'collapsed'>>) => void
  removeServer: (serverId: string) => void
  updateServerStatus: (serverId: string, status: ConnectionStatus) => void
  toggleServerCollapsed: (serverId: string) => void
  connectServer: (serverId: string) => void
  disconnectServer: (serverId: string) => void

  // Channel actions
  setActiveView: (view: ActiveView) => void
  joinChannel: (serverId: string, channelName: string) => void
  partChannel: (serverId: string, channelId: string) => void
  closeDM: (serverId: string, channelId: string) => void
  setChannelTopic: (serverId: string, channelId: string, topic: string) => void
  clearUnread: (serverId: string, channelId: string) => void

  // Message actions
  sendMessage: (serverId: string, channelId: string, content: string) => void
  addSystemMessage: (serverId: string, channelId: string, content: string) => void
  addServerMessage: (serverId: string, content: string, type?: MessageType, nickname?: string) => void

  // Nick/User actions
  changeNick: (serverId: string, newNick: string) => void
  setAway: (serverId: string, message: string) => void
  setBack: (serverId: string) => void
  ignoreUser: (nickname: string) => void
  unignoreUser: (nickname: string) => void
  kickUser: (serverId: string, channelId: string, nickname: string, reason?: string) => void
  setChannelMode: (serverId: string, channelId: string, mode: string) => void
  openDM: (serverId: string, nickname: string) => void

  // UI actions
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setUserListOpen: (open: boolean) => void
  setUserListWidth: (width: number) => void
  setUserListCollapsed: (collapsed: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setSplitView: (split: boolean) => void
  setSplitChannelId: (channelId: string | null) => void
  setRawLogOpen: (open: boolean) => void

  // Settings actions
  updateSettings: (partial: Partial<AppSettings>) => void
  applyColorTheme: (themeId: TerminalThemeId) => void

  // Log history
  setLogViewerOpen: (open: boolean) => void
  clearLogHistory: () => void

  // Command
  addToCommandHistory: (cmd: string) => void

  // Native bridge
  initNativeBridge: () => void
}

let msgCounter = 10000
let nativeBridgeInitialized = false

function channelIdFor(serverId: string, channelName: string) {
  return `${serverId}:${channelName.toLowerCase()}`
}

function nowMessage(
  serverId: string,
  channelId: string,
  nickname: string,
  content: string,
  type: MessageType = 'message',
  isHighlight = false,
  timestamp?: Date
): IRCMessage {
  return {
    id: `msg-${++msgCounter}`,
    channelId,
    serverId,
    type,
    nickname,
    content,
    timestamp: timestamp ?? new Date(),
    isHighlight,
  }
}

export const useIRCStore = create<IRCStore>((set, get) => ({
  servers: isDemoBuild
    ? mockServers
    : typeof window !== 'undefined'
      ? loadServersSnapshot()
      : [],
  settings: typeof window !== 'undefined' ? loadSettings() : defaultSettings,
  activeView: isDemoBuild ? { serverId: 'freenode', channelId: 'fn-general' } : { serverId: '', channelId: '' },
  sidebarOpen: true,
  sidebarWidth: 240,
  sidebarCollapsed: false,
  userListOpen: true,
  userListWidth: 208,
  userListCollapsed: false,
  settingsOpen: false,
  searchOpen: false,
  searchQuery: '',
  splitView: false,
  splitChannelId: null,
  rawLogOpen: false,
  rawLogMessages: isDemoBuild ? [
    ':irc.freenode.net 001 devuser :Welcome to the Freenode Internet Relay Chat Network devuser',
    ':irc.freenode.net 002 devuser :Your host is irc.freenode.net, running version ircd-7.2',
    ':irc.freenode.net 003 devuser :This server was created 2024-01-01',
    ':irc.freenode.net 376 devuser :End of /MOTD command.',
    ':devuser!~devuser@user/devuser JOIN #general',
    ':irc.freenode.net 353 devuser = #general :@rustacean +nodemaster pythonicgal +goopher @kerneldev csswhiz devopsguru +sqlninja hackernews typescripter devuser',
    ':irc.freenode.net 366 devuser #general :End of /NAMES list.',
    'PING :irc.freenode.net',
    'PONG :irc.freenode.net',
  ] : [],
  commandHistory: [],
  commandHistoryIndex: -1,
  logHistory: typeof window !== 'undefined' ? loadLogHistory() : [],
  logViewerOpen: false,

  addServer: (serverData) => {
    if (isLiveBuild) {
      const id = `server-${Date.now()}`
      const server: IRCServer = {
        ...serverData,
        id,
        status: 'disconnected',
        channels: [],
        serverMessages: [],
        latency: 0,
        collapsed: false,
        awayMessage: '',
      }
      set((state) => {
        const servers = [...state.servers, server]
        // Persist new server list so it is remembered across restarts
        saveServersSnapshot(servers)
        return {
          servers,
          activeView: state.activeView.serverId ? state.activeView : { serverId: id, channelId: '' },
        }
      })
      get().connectServer(id)
      return
    }

    const id = `server-${Date.now()}`
    const server: IRCServer = {
      ...serverData,
      id,
      onJoinCommands: serverData.onJoinCommands || [],
      status: 'connecting',
      channels: [],
      serverMessages: [
        {
          id: `msg-${++msgCounter}`,
          channelId: '',
          serverId: id,
          type: 'system' as MessageType,
          nickname: 'system',
          content: `Connecting to ${serverData.host}:${serverData.port}${serverData.ssl ? ' (SSL)' : ''}...`,
          timestamp: new Date(),
          isHighlight: false,
        },
      ],
      latency: 0,
      collapsed: false,
      awayMessage: '',
    }
    set((state) => {
      const servers = [...state.servers, server]
      saveServersSnapshot(servers)
      return { servers }
    })

    // Simulate connection
    setTimeout(() => {
      const connectMsgs: IRCMessage[] = [
        { id: `msg-${++msgCounter}`, channelId: '', serverId: id, type: 'system', nickname: 'system', content: `Welcome to ${serverData.name}`, timestamp: new Date(), isHighlight: false },
        { id: `msg-${++msgCounter}`, channelId: '', serverId: id, type: 'system', nickname: 'system', content: `Your host is ${serverData.host}, running version ircd-7.2`, timestamp: new Date(), isHighlight: false },
        { id: `msg-${++msgCounter}`, channelId: '', serverId: id, type: 'system', nickname: 'system', content: `There are ${Math.floor(Math.random() * 5000) + 1000} users on ${Math.floor(Math.random() * 30) + 5} servers`, timestamp: new Date(), isHighlight: false },
      ]
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'connected' as ConnectionStatus,
                latency: Math.floor(Math.random() * 100) + 20,
                serverMessages: [...s.serverMessages, ...connectMsgs],
                channels: serverData.autoJoinChannels.map((ch, i) => ({
                  id: `${id}-ch-${i}`,
                  serverId: id,
                  name: ch,
                  topic: `Welcome to ${ch}`,
                  messages: [],
                  users: [],
                  unreadCount: 0,
                  mentionCount: 0,
                  isDirectMessage: false,
                  joined: true,
                  showJoinPart: true,
                  modes: '+nst',
                })),
              }
            : s
        ),
      }))

      // Execute on-join commands
      if (serverData.onJoinCommands && serverData.onJoinCommands.length > 0) {
        const updatedServers = get().servers
        const connectedServer = updatedServers.find((s) => s.id === id)
        if (connectedServer && connectedServer.channels.length > 0) {
          const firstChannelId = connectedServer.channels[0].id
          serverData.onJoinCommands.forEach((cmd, idx) => {
            setTimeout(() => {
              get().addSystemMessage(id, firstChannelId, `Executing on-join command: ${cmd}`)
            }, (idx + 1) * 500)
          })
        }
      }
    }, 2000)
  },

  updateServer: (serverId, data) => {
    set((state) => {
      const servers = state.servers.map((s) =>
        s.id === serverId ? { ...s, ...data } : s
      )
      saveServersSnapshot(servers)
      return { servers }
    })
  },

  removeServer: (serverId) => {
    set((state) => {
      const newServers = state.servers.filter((s) => s.id !== serverId)
      let newView = state.activeView
      if (state.activeView.serverId === serverId && newServers.length > 0) {
        const firstServer = newServers[0]
        newView = {
          serverId: firstServer.id,
          channelId: firstServer.channels[0]?.id || '',
        }
      }
      saveServersSnapshot(newServers)
      return { servers: newServers, activeView: newView }
    })
  },

  updateServerStatus: (serverId, status) => {
    set((state) => ({
      servers: state.servers.map((s) => (s.id === serverId ? { ...s, status } : s)),
    }))
  },

  toggleServerCollapsed: (serverId) => {
    set((state) => ({
      servers: state.servers.map((s) => (s.id === serverId ? { ...s, collapsed: !s.collapsed } : s)),
    }))
  },

  connectServer: (serverId) => {
    if (isLiveBuild) {
      const server = get().servers.find((s) => s.id === serverId)
      if (!server) return
      get().updateServerStatus(serverId, 'connecting')
      get().addServerMessage(serverId, `Connecting to ${server.host}:${server.port}${server.ssl ? ' (TLS)' : ''}...`)
      void connectNativeIrc({
        serverId,
        host: server.host,
        port: server.port,
        ssl: server.ssl,
        allowInvalidCerts: !!server.allowInvalidCerts,
        nickname: server.nickname,
        username: server.username,
        realName: server.realName,
        password: server.password,
        autoJoinChannels: server.autoJoinChannels,
      }).catch((err) => {
        get().updateServerStatus(serverId, 'disconnected')
        get().addServerMessage(serverId, `Connection failed: ${String(err)}`)
      })
      return
    }

    get().updateServerStatus(serverId, 'connecting')
    get().addServerMessage(serverId, 'Reconnecting...')
    setTimeout(() => {
      const server = get().servers.find((s) => s.id === serverId)
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === serverId ? { ...s, status: 'connected', latency: Math.floor(Math.random() * 100) + 20 } : s
        ),
      }))
      get().addServerMessage(serverId, `Connected to ${server?.host || 'server'}`)
      get().addServerMessage(serverId, `Welcome back, ${server?.nickname || 'user'}`)
    }, 1500)
  },

  disconnectServer: (serverId) => {
    if (isLiveBuild) {
      void disconnectNativeIrc(serverId).catch(() => {})
      get().updateServerStatus(serverId, 'disconnected')
      get().addServerMessage(serverId, 'Disconnected from server.')
      return
    }
    get().updateServerStatus(serverId, 'disconnected')
    get().addServerMessage(serverId, 'Disconnected from server.')
  },

  setActiveView: (view) => {
    set({ activeView: view })
    if (view.channelId) {
      get().clearUnread(view.serverId, view.channelId)
    }
  },

  joinChannel: (serverId, channelName) => {
    if (isLiveBuild) {
      const normalized = channelName.startsWith('#') ? channelName : `#${channelName}`
      const channelId = channelIdFor(serverId, normalized)
      set((state) => ({
        servers: state.servers.map((s) =>
          s.id === serverId && s.channels.every((c) => c.id !== channelId)
            ? {
                ...s,
                channels: [
                  ...s.channels,
                  {
                    id: channelId,
                    serverId,
                    name: normalized,
                    topic: '',
                    messages: [],
                    users: [],
                    unreadCount: 0,
                    mentionCount: 0,
                    isDirectMessage: false,
                    joined: true,
                    showJoinPart: true,
                    modes: '',
                  },
                ],
              }
            : s
        ),
        activeView: { serverId, channelId },
      }))
      void joinNativeIrc(serverId, normalized).catch((err) => {
        get().addServerMessage(serverId, `Join failed: ${String(err)}`)
      })
      return
    }

    const channelId = `${serverId}-${channelName.replace('#', '')}-${Date.now()}`
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: [
                ...s.channels,
                {
                  id: channelId,
                  serverId,
                  name: channelName,
                  topic: `Welcome to ${channelName}`,
                  messages: [
                    {
                      id: `msg-${++msgCounter}`,
                      channelId,
                      serverId,
                      type: 'system' as MessageType,
                      nickname: 'system',
                      content: `Now talking in ${channelName}`,
                      timestamp: new Date(),
                      isHighlight: false,
                    },
                  ],
                  users: [],
                  unreadCount: 0,
                  mentionCount: 0,
                  isDirectMessage: false,
                  joined: true,
                  showJoinPart: true,
                  modes: '+nst',
                },
              ],
            }
          : s
      ),
    }))
    set({ activeView: { serverId, channelId } })
  },

  partChannel: (serverId, channelId) => {
    if (isLiveBuild) {
      const channelName = get().servers.find((s) => s.id === serverId)?.channels.find((c) => c.id === channelId)?.name
      if (channelName) {
        void partNativeIrc(serverId, channelName).catch(() => {})
      }
    }
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId ? { ...s, channels: s.channels.filter((c) => c.id !== channelId) } : s
      ),
    }))
  },

  closeDM: (serverId, channelId) => {
    set((state) => {
      const servers = state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.filter(
                (c) => !(c.id === channelId && c.isDirectMessage)
              ),
            }
          : s
      )

      let activeView = state.activeView
      if (state.activeView.serverId === serverId && state.activeView.channelId === channelId) {
        const server = servers.find((s) => s.id === serverId)
        activeView = {
          serverId,
          channelId: server?.channels[0]?.id || '',
        }
      }

      return { servers, activeView }
    })
  },

  setChannelTopic: (serverId, channelId, topic) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) => (c.id === channelId ? { ...c, topic, topicSetBy: s.nickname } : c)),
            }
          : s
      ),
    }))

    if (isLiveBuild) {
      const server = get().servers.find((s) => s.id === serverId)
      const channelName = server?.channels.find((c) => c.id === channelId)?.name
      if (channelName) {
        void sendNativeRaw(serverId, `TOPIC ${channelName} :${topic}`).catch((err) => {
          get().addServerMessage(serverId, `Topic change failed: ${String(err)}`)
        })
      }
    }
  },

  clearUnread: (serverId, channelId) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) =>
                c.id === channelId ? { ...c, unreadCount: 0, mentionCount: 0 } : c
              ),
            }
          : s
      ),
    }))
  },

  sendMessage: (serverId, channelId, content) => {
    const server = get().servers.find((s) => s.id === serverId)
    if (!server) return

    let type: MessageType = 'message'
    let msgContent = content
    let nickname = server.nickname

    // Handle commands
    if (content.startsWith('/me ')) {
      type = 'action'
      msgContent = content.slice(4)
    } else if (content.startsWith('/notice ')) {
      type = 'notice'
      msgContent = content.slice(8)
    }

    const msg: IRCMessage = {
      id: `msg-${++msgCounter}`,
      channelId,
      serverId,
      type,
      nickname,
      content: msgContent,
      timestamp: new Date(),
      isHighlight: false,
    }

    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) =>
                c.id === channelId ? { ...c, messages: [...c.messages, msg] } : c
              ),
            }
          : s
      ),
      rawLogMessages: [...state.rawLogMessages, `:${nickname}!~${server.username}@user/${nickname} PRIVMSG ${get().servers.find((s) => s.id === serverId)?.channels.find((c) => c.id === channelId)?.name || channelId} :${content}`],
    }))

    if (isLiveBuild) {
      const channelName = server.channels.find((c) => c.id === channelId)?.name
      if (channelName) {
        void sendNativePrivmsg(serverId, channelName, content).catch((err) => {
          get().addServerMessage(serverId, `Send failed: ${String(err)}`)
        })
      }
      return
    }

    // Save to log history if enabled
    if (get().settings.saveAllLogs) {
      const channel = server.channels.find((c) => c.id === channelId)
      const logEntry: LogEntry = {
        id: msg.id,
        serverId,
        serverName: server.name,
        channelId,
        channelName: channel?.name || channelId,
        timestamp: msg.timestamp,
        type: msg.type,
        nickname: msg.nickname,
        content: msg.content,
      }
      set((state) => {
        const newHistory = [...state.logHistory, logEntry]
        saveLogHistory(newHistory)
        return { logHistory: newHistory }
      })
    }

    // Simulate a response after a delay
    if (!isLiveBuild && type === 'message' && Math.random() > 0.3) {
      const channel = server.channels.find((c) => c.id === channelId)
      if (channel && channel.users.length > 0) {
        const otherUsers = channel.users.filter((u) => u.nickname !== nickname)
        if (otherUsers.length > 0) {
          const responder = otherUsers[Math.floor(Math.random() * otherUsers.length)]
          const responses = [
            'Good point!',
            'I agree with that.',
            'Hmm, interesting perspective.',
            "That's a solid approach.",
            "Have you considered the alternative? Just curious.",
            'Nice, thanks for sharing!',
            '+1',
            'Makes sense to me.',
            'I had a similar experience recently.',
            "Let me think about that...",
          ]
          setTimeout(() => {
            const responseMsg: IRCMessage = {
              id: `msg-${++msgCounter}`,
              channelId,
              serverId,
              type: 'message',
              nickname: responder.nickname,
              content: responses[Math.floor(Math.random() * responses.length)],
              timestamp: new Date(),
              isHighlight: false,
            }
            set((state) => ({
              servers: state.servers.map((s) =>
                s.id === serverId
                  ? {
                      ...s,
                      channels: s.channels.map((c) =>
                        c.id === channelId ? { ...c, messages: [...c.messages, responseMsg] } : c
                      ),
                    }
                  : s
              ),
            }))
            // Also save bot response to log history
            if (get().settings.saveAllLogs) {
              const logEntry: LogEntry = {
                id: responseMsg.id,
                serverId,
                serverName: server.name,
                channelId,
                channelName: channel?.name || channelId,
                timestamp: responseMsg.timestamp,
                type: responseMsg.type,
                nickname: responseMsg.nickname,
                content: responseMsg.content,
              }
              set((state) => {
                const newHistory = [...state.logHistory, logEntry]
                saveLogHistory(newHistory)
                return { logHistory: newHistory }
              })
            }
          }, 1000 + Math.random() * 3000)
        }
      }
    }
  },

  addSystemMessage: (serverId, channelId, content) => {
    if (!channelId) return
    const msg: IRCMessage = {
      id: `msg-${++msgCounter}`,
      channelId,
      serverId,
      type: 'system',
      nickname: 'system',
      content,
      timestamp: new Date(),
      isHighlight: false,
    }
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) =>
                c.id === channelId ? { ...c, messages: [...c.messages, msg] } : c
              ),
            }
          : s
      ),
    }))
  },

  addServerMessage: (serverId, content, type = 'system', nickname = 'system') => {
    const msg: IRCMessage = {
      id: `msg-${++msgCounter}`,
      channelId: '',
      serverId,
      type,
      nickname,
      content,
      timestamp: new Date(),
      isHighlight: false,
    }
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === serverId ? { ...s, serverMessages: [...s.serverMessages, msg] } : s
      ),
    }))
  },

  changeNick: (serverId, newNick) => {
    if (isLiveBuild) {
      void sendNativeRaw(serverId, `NICK ${newNick}`).catch(() => {})
    }
    const server = get().servers.find((s) => s.id === serverId)
    if (!server) return
    const oldNick = server.nickname
    // Post nick change message to all joined channels
    server.channels.forEach((ch) => {
      const msg: IRCMessage = {
        id: `msg-${++msgCounter}`, channelId: ch.id, serverId, type: 'nick_change',
        nickname: oldNick, content: `${oldNick} is now known as ${newNick}`, timestamp: new Date(), isHighlight: false,
      }
      set((state) => ({
        servers: state.servers.map((s) => s.id === serverId ? {
          ...s, nickname: newNick,
          channels: s.channels.map((c) => c.id === ch.id ? { ...c, messages: [...c.messages, msg] } : c),
        } : s),
      }))
    })
    get().addServerMessage(serverId, `You are now known as ${newNick}`)
  },

  setAway: (serverId, message) => {
    set((state) => ({
      servers: state.servers.map((s) => s.id === serverId ? { ...s, awayMessage: message } : s),
    }))
    if (isLiveBuild) {
      void sendNativeRaw(serverId, `AWAY :${message}`).catch(() => {})
    }
    get().addServerMessage(serverId, `You have been marked as away: ${message}`)
  },

  setBack: (serverId) => {
    set((state) => ({
      servers: state.servers.map((s) => s.id === serverId ? { ...s, awayMessage: '' } : s),
    }))
    if (isLiveBuild) {
      void sendNativeRaw(serverId, 'AWAY').catch(() => {})
    }
    get().addServerMessage(serverId, 'You are no longer marked as away')
  },

  ignoreUser: (nickname) => {
    const current = get().settings.ignoreList || []
    if (!current.includes(nickname.toLowerCase())) {
      get().updateSettings({ ignoreList: [...current, nickname.toLowerCase()] })
    }
  },

  unignoreUser: (nickname) => {
    const current = get().settings.ignoreList || []
    get().updateSettings({ ignoreList: current.filter((n) => n !== nickname.toLowerCase()) })
  },

  kickUser: (serverId, channelId, nickname, reason) => {
    const msg: IRCMessage = {
      id: `msg-${++msgCounter}`, channelId, serverId, type: 'kick',
      nickname: 'system', content: `${nickname} was kicked${reason ? `: ${reason}` : ''}`,
      timestamp: new Date(), isHighlight: false,
    }
    set((state) => ({
      servers: state.servers.map((s) => s.id === serverId ? {
        ...s, channels: s.channels.map((c) => c.id === channelId ? {
          ...c, messages: [...c.messages, msg], users: c.users.filter((u) => u.nickname !== nickname),
        } : c),
      } : s),
    }))
    if (isLiveBuild) {
      const server = get().servers.find((s) => s.id === serverId)
      const channelName = server?.channels.find((c) => c.id === channelId)?.name
      if (channelName) {
        const reasonText = reason && reason.trim().length > 0 ? ` :${reason}` : ''
        void sendNativeRaw(serverId, `KICK ${channelName} ${nickname}${reasonText}`).catch(() => {})
      }
    }
  },

  setChannelMode: (serverId, channelId, mode) => {
    if (isLiveBuild) {
      const channelName = get().servers.find((s) => s.id === serverId)?.channels.find((c) => c.id === channelId)?.name
      if (channelName) {
        void sendNativeRaw(serverId, `MODE ${channelName} ${mode}`).catch(() => {})
      }
    }
    const msg: IRCMessage = {
      id: `msg-${++msgCounter}`, channelId, serverId, type: 'mode',
      nickname: 'system', content: `Channel mode set to ${mode}`,
      timestamp: new Date(), isHighlight: false,
    }
    set((state) => ({
      servers: state.servers.map((s) => s.id === serverId ? {
        ...s, channels: s.channels.map((c) => c.id === channelId ? {
          ...c, modes: mode, messages: [...c.messages, msg],
        } : c),
      } : s),
    }))
  },

  openDM: (serverId, nickname) => {
    const server = get().servers.find((s) => s.id === serverId)
    if (!server) return
    // Check if DM already exists
    const existing = server.channels.find((c) => c.isDirectMessage && c.name === nickname)
    if (existing) {
      set({ activeView: { serverId, channelId: existing.id } })
      return
    }
    const channelId = `${serverId}-dm-${nickname}-${Date.now()}`
    set((state) => ({
      servers: state.servers.map((s) => s.id === serverId ? {
        ...s, channels: [...s.channels, {
          id: channelId, serverId, name: nickname, topic: '', messages: [{
            id: `msg-${++msgCounter}`, channelId, serverId, type: 'system' as MessageType,
            nickname: 'system', content: `Started conversation with ${nickname}`, timestamp: new Date(), isHighlight: false,
          }], users: [{ nickname, modes: [], isOp: false, isVoiced: false, isAway: false }],
          unreadCount: 0, mentionCount: 0, isDirectMessage: true, joined: true, showJoinPart: false, modes: '',
        }],
      } : s),
      activeView: { serverId, channelId },
    }))
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(180, Math.min(400, width)) }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setUserListOpen: (open) => set({ userListOpen: open }),
  setUserListWidth: (width) => set({ userListWidth: Math.max(140, Math.min(360, width)) }),
  setUserListCollapsed: (collapsed) => set({ userListCollapsed: collapsed }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSplitView: (split) => set({ splitView: split }),
  setSplitChannelId: (channelId) => set({ splitChannelId: channelId }),
  setRawLogOpen: (open) => set({ rawLogOpen: open }),

  updateSettings: (partial) => {
    set((state) => {
      const newSettings = { ...state.settings, ...partial }
      saveSettings(newSettings)

      // When accentColor changes, immediately apply it to CSS variables
      if (partial.accentColor && typeof document !== 'undefined') {
        const root = document.documentElement
        const accent = hexToHSL(partial.accentColor)
        root.style.setProperty('--primary', accent)
        root.style.setProperty('--accent', accent)
        root.style.setProperty('--ring', accent)
      }

      // Apply font preferences when settings change
      applyFontPreferences(newSettings)

      return { settings: newSettings }
    })
  },

  applyColorTheme: (themeId) => {
    applyColorTheme(themeId)
    get().updateSettings({ colorTheme: themeId })
  },

  setLogViewerOpen: (open) => set({ logViewerOpen: open }),

  clearLogHistory: () => {
    set({ logHistory: [] })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('patchcord-log-history')
    }
  },

  initNativeBridge: () => {
    if (!isLiveBuild || nativeBridgeInitialized) return
    nativeBridgeInitialized = true

    // State for high-volume LIST output to avoid freezing the UI
    let currentListCount = 0
    let listTruncated = false
    const MAX_LIST_ITEMS = 400

    void listenNativeIrcEvents((event) => {
      const state = get()
      const server = state.servers.find((s) => s.id === event.server_id)
      if (!server) return

      const ensureChannel = (channelName: string) => {
        const channelId = channelIdFor(event.server_id, channelName)
        const currentState = get()
        const existingServer = currentState.servers.find((s) => s.id === event.server_id)
        const exists = existingServer?.channels.some((c) => c.id === channelId)

        if (!exists) {
          // Seed with recent history if available
          let seedMessages: IRCMessage[] = []
          const settings = currentState.settings
          if (settings.saveAllLogs) {
            const seedEntries = currentState.logHistory
              .filter(
                (e) =>
                  e.serverId === event.server_id &&
                  e.channelName === channelName
              )
              .slice(-50)

            seedMessages = seedEntries.map((e) => ({
              id: e.id,
              channelId,
              serverId: e.serverId,
              type: e.type,
              nickname: e.nickname,
              content: e.content,
              timestamp: new Date(e.timestamp),
              isHighlight: false,
            }))
          }

          set((s) => ({
            servers: s.servers.map((srv) =>
              srv.id === event.server_id
                ? {
                    ...srv,
                    channels: [
                      ...srv.channels,
                      {
                        id: channelId,
                        serverId: event.server_id,
                        name: channelName,
                        topic: '',
                        messages: seedMessages,
                        users: [],
                        unreadCount: 0,
                        mentionCount: 0,
                        isDirectMessage: false,
                        joined: true,
                        showJoinPart: true,
                        modes: '',
                      },
                    ],
                  }
                : srv
            ),
          }))
        }
        return channelId
      }

      const appendChannelMessage = (channelName: string, nickname: string, content: string, type: MessageType) => {
        const channelId = ensureChannel(channelName)

        // Highlight detection: @nick or custom highlight words
        const settings = get().settings
        const serverForHighlight = get().servers.find((s) => s.id === event.server_id)
        const myNick = serverForHighlight?.nickname
        const lowerContent = content.toLowerCase()
        const hasNickMention =
          !!myNick &&
          (lowerContent.includes(myNick.toLowerCase()) ||
            lowerContent.includes(`@${myNick.toLowerCase()}`))
        const hasCustomHighlight =
          (settings.highlightWords || []).some((w) =>
            lowerContent.includes(w.toLowerCase())
          )
        const isHighlight = hasNickMention || hasCustomHighlight

        const ts = event.time ? new Date(event.time) : undefined
        const msg = nowMessage(event.server_id, channelId, nickname, content, type, isHighlight, ts)
        const isSelfJoinOrPart = myNick && nickname === myNick && (type === 'join' || type === 'part')
        // System messages (topic, mode changes, etc.) should not increment unread
        const isSystemMessage = type === 'system' || type === 'mode'
        const isJoinPartHidden =
          !settings.showJoinPartQuit && (type === 'join' || type === 'part' || type === 'quit')
        const isIgnoredByUser =
          (type === 'message' || type === 'action' || type === 'notice') &&
          (settings.ignoreList || []).includes(nickname.toLowerCase())
        const shouldCountUnread = !isSystemMessage && !isSelfJoinOrPart && !isJoinPartHidden && !isIgnoredByUser
        set((s) => ({
          servers: s.servers.map((srv) =>
            srv.id === event.server_id
              ? {
                  ...srv,
                  channels: srv.channels.map((c) =>
                    c.id === channelId
                      ? {
                          ...c,
                          messages: [...c.messages, msg],
                          unreadCount:
                            // Count unread only for visible/actionable events, and never in active channel.
                            !shouldCountUnread ||
                            (event.server_id === s.activeView.serverId &&
                              channelId === s.activeView.channelId)
                              ? c.unreadCount
                              : c.unreadCount + 1,
                          mentionCount:
                            shouldCountUnread &&
                            isHighlight &&
                            !(
                              event.server_id === s.activeView.serverId &&
                              channelId === s.activeView.channelId
                            )
                              ? c.mentionCount + 1
                              : c.mentionCount,
                        }
                      : c
                  ),
                }
              : srv
          ),
        }))
      }

      switch (event.kind) {
        case 'status':
          if (event.status) get().updateServerStatus(event.server_id, event.status)
          break
        case 'latency': {
          const ms = event.content ? parseInt(event.content, 10) : NaN
          if (!Number.isNaN(ms) && Number.isFinite(ms) && ms >= 0) {
            set((state) => ({
              servers: state.servers.map((s) =>
                s.id === event.server_id ? { ...s, latency: ms } : s
              ),
            }))
          }
          break
        }
        case 'raw_in':
        case 'raw_out':
          if (event.raw) {
            set((s) => ({ rawLogMessages: [...s.rawLogMessages, event.raw!] }))
          }
          break
        case 'server':
          if (event.content) get().addServerMessage(event.server_id, event.content)
          break
        case 'list_start': {
          currentListCount = 0
          listTruncated = false
          const active = get().activeView
          const channelId = active.channelId
          const serverId = active.serverId || event.server_id
          if (!serverId) break
          if (channelId) {
            get().addSystemMessage(serverId, channelId, '--- Channel List ---')
          } else {
            get().addServerMessage(serverId, '--- Channel List ---')
          }
          break
        }
        case 'list_item': {
          if (listTruncated) break
          if (currentListCount >= MAX_LIST_ITEMS) {
            listTruncated = true
            const active = get().activeView
            const channelId = active.channelId
            const serverId = active.serverId || event.server_id
            if (!serverId) break
            const notice = `Channel list truncated after ${MAX_LIST_ITEMS} entries (too many results)`
            if (channelId) {
              get().addSystemMessage(serverId, channelId, notice)
            } else {
              get().addServerMessage(serverId, notice)
            }
            break
          }
          currentListCount++
          const active = get().activeView
          const channelId = active.channelId
          const serverId = active.serverId || event.server_id
          const text = (() => {
            if (!event.channel) return event.content || ''
            const [users, ...rest] = (event.content || '').split(' ')
            const topic = rest.join(' ')
            const userCount = users || '?'
            return `${event.channel} (${userCount} users) - ${topic}`
          })()
          if (!serverId || !text) break
          if (channelId) {
            get().addSystemMessage(serverId, channelId, text)
          } else {
            get().addServerMessage(serverId, text)
          }
          break
        }
        case 'list_end': {
          const active = get().activeView
          const channelId = active.channelId
          const serverId = active.serverId || event.server_id
          if (!serverId) break
          if (channelId) {
            get().addSystemMessage(serverId, channelId, '--- End of /LIST ---')
          } else {
            get().addServerMessage(serverId, '--- End of /LIST ---')
          }
          break
        }
        case 'invite': {
          // INVITE notifications (invite-notify capability)
          const server = get().servers.find((s) => s.id === event.server_id)
          const myNick = server?.nickname
          const channelName = event.channel || ''
          const targetNick = event.content || ''
          const inviter =
            event.nick ||
            (event.ident ? event.ident.split('!')[0] || 'someone' : 'someone')

          const text =
            myNick && targetNick.toLowerCase() === myNick.toLowerCase()
              ? `${inviter} has invited you to ${channelName || 'a channel'}`
              : `${inviter} invited ${targetNick} to ${channelName || 'a channel'}`

          get().addServerMessage(event.server_id, text)
          break
        }
        case 'join':
          if (event.channel) {
            const displayIdent =
              event.ident ||
              (event.nick ? event.nick : '') ||
              ''
            const nickForMessage =
              event.nick ||
              (event.ident ? event.ident.split('!')[0] || 'unknown' : 'unknown')

            ensureChannel(event.channel)
            appendChannelMessage(
              event.channel,
              nickForMessage,
              `${displayIdent || nickForMessage} joined ${event.channel}`,
              'join'
            )
          }
          break
        case 'part':
          if (event.channel) {
            const displayIdent =
              event.ident ||
              (event.nick ? event.nick : '') ||
              ''
            const nickForMessage =
              event.nick ||
              (event.ident ? event.ident.split('!')[0] || 'unknown' : 'unknown')

            appendChannelMessage(
              event.channel,
              nickForMessage,
              `${displayIdent || nickForMessage} left ${event.channel}`,
              'part'
            )
            set((s) => ({
              servers: s.servers.map((srv) =>
                srv.id === event.server_id
                  ? {
                      ...srv,
                      channels: srv.channels.map((c) =>
                        c.id === channelIdFor(event.server_id, event.channel!)
                          ? {
                              ...c,
                              users: c.users.filter(
                                (u) => u.nickname !== (event.nick || nickForMessage)
                              ),
                            }
                          : c
                      ),
                    }
                  : srv
              ),
            }))
          }
          break
        case 'privmsg':
          if (event.nick && event.content) {
            const server = get().servers.find((s) => s.id === event.server_id)
            const myNick = server?.nickname

            // Direct message to us: target equals our own nick
            if (myNick && event.channel && event.channel.toLowerCase() === myNick.toLowerCase()) {
              const dmNick = event.nick
              // Ensure DM channel exists (or create it)
              get().openDM(event.server_id, dmNick)

              const updatedServer = get().servers.find((s) => s.id === event.server_id)
              const dmChannel = updatedServer?.channels.find(
                (c) => c.isDirectMessage && c.name === dmNick
              )
              if (!dmChannel) break

              const lowerContent = event.content.toLowerCase()
              const settings = get().settings
              const hasCustomHighlight =
                (settings.highlightWords || []).some((w) =>
                  lowerContent.includes(w.toLowerCase())
                )
              const ts = event.time ? new Date(event.time) : undefined
              const msg = nowMessage(
                event.server_id,
                dmChannel.id,
                dmNick,
                event.content,
                'message',
                hasCustomHighlight,
                ts
              )
              set((s) => ({
                servers: s.servers.map((srv) =>
                  srv.id === event.server_id
                    ? {
                        ...srv,
                        channels: srv.channels.map((c) =>
                          c.id === dmChannel.id ? { ...c, messages: [...c.messages, msg] } : c
                        ),
                      }
                    : srv
                ),
              }))
            } else if (event.channel) {
              // Channel or DM where we are the sender / target nick
              appendChannelMessage(event.channel, event.nick, event.content, 'message')
            }
          }
          break
        case 'notice':
          if (event.nick && event.content) {
            const nickLower = event.nick.toLowerCase()
            const serverForNotice = get().servers.find((s) => s.id === event.server_id)
            const myNick = serverForNotice?.nickname?.toLowerCase()

            // Network status-style notices (e.g. "-*status-") should go to the server console,
            // not into individual channels.
            if (nickLower === '-*status-') {
              get().addServerMessage(event.server_id, event.content, 'notice', event.nick)
              break
            }

            // NOTICEs addressed to our own nick are server/service notices, not channel messages.
            if (event.channel && myNick && event.channel.toLowerCase() === myNick) {
              get().addServerMessage(event.server_id, event.content, 'notice', event.nick)
              break
            }

            if (event.channel) {
              appendChannelMessage(event.channel, event.nick, event.content, 'notice')
            } else {
              get().addServerMessage(event.server_id, event.content, 'notice', event.nick)
            }
          }
          break
        case 'topic':
          if (event.channel) {
            const channelId = ensureChannel(event.channel)
            const topicText = event.content || ''
            const setterNick =
              event.nick ||
              (event.ident ? event.ident.split('!')[0] || 'server' : 'server')

            // Update stored topic
            set((s) => ({
              servers: s.servers.map((srv) =>
                srv.id === event.server_id
                  ? {
                      ...srv,
                      channels: srv.channels.map((c) =>
                        c.id === channelId ? { ...c, topic: topicText } : c
                      ),
                    }
                  : srv
              ),
            }))

            // Add a visible message to the channel
            if (topicText) {
              appendChannelMessage(
                event.channel,
                setterNick,
                `Topic set to: ${topicText}`,
                'system'
              )
            }
          }
          break
        case 'names':
          if (event.channel) {
            const channelId = ensureChannel(event.channel)
            const users = (event.users || []).map((encoded) => {
              // encoded form from backend: "<modes>:<nick>", e.g. "@:alice" or "+@:bob"
              const [modesPart, nickPart] = encoded.split(':')
              const nickname = (nickPart ?? modesPart ?? '').trim()
              const modePrefix = nickPart ? (modesPart || '') : ''
              const isOp = modePrefix.includes('@') || modePrefix.includes('~') || modePrefix.includes('&')
              const isVoiced = modePrefix.includes('+')

              return {
                nickname,
                modes: modePrefix.split('').filter(Boolean),
                isOp,
                isVoiced,
                isAway: false,
              }
            })
            set((s) => ({
              servers: s.servers.map((srv) =>
                srv.id === event.server_id
                  ? {
                      ...srv,
                      channels: srv.channels.map((c) => (c.id === channelId ? { ...c, users } : c)),
                    }
                  : srv
              ),
            }))
          }
          break
        case 'mode':
          if (event.channel && event.content) {
            const channelId = ensureChannel(event.channel)
            const modeContent = event.content
            const setterNick = event.nick || (event.ident ? event.ident.split('!')[0] || 'server' : 'server')
            
            // Parse mode change like "+o nick" or "-o nick"
            const parts = modeContent.split(' ')
            if (parts.length >= 2) {
              const modeChange = parts[0] // e.g., "+o" or "-o"
              const targetNick = parts[1] // nickname
              
              // Check if it's a user mode change (operator, voice, etc.)
              if (modeChange.length === 2 && (modeChange[1] === 'o' || modeChange[1] === 'v' || modeChange[1] === 'h' || modeChange[1] === 'a')) {
                const isAdding = modeChange[0] === '+'
                const modeType = modeChange[1]
                
                // Update user in channel
                set((s) => ({
                  servers: s.servers.map((srv) =>
                    srv.id === event.server_id
                      ? {
                          ...srv,
                          channels: srv.channels.map((c) => {
                            if (c.id !== channelId) return c
                            
                            const updatedUsers = c.users.map((u) => {
                              if (u.nickname !== targetNick) return u
                              
                              let newModes = [...u.modes]
                              let newIsOp = u.isOp
                              let newIsVoiced = u.isVoiced
                              
                              if (modeType === 'o' || modeType === 'a') {
                                // Operator mode
                                if (isAdding) {
                                  if (!newModes.includes('@')) newModes.push('@')
                                  newIsOp = true
                                } else {
                                  newModes = newModes.filter(m => m !== '@' && m !== '~' && m !== '&')
                                  newIsOp = false
                                }
                              } else if (modeType === 'v' || modeType === 'h') {
                                // Voice mode
                                if (isAdding) {
                                  if (!newModes.includes('+')) newModes.push('+')
                                  newIsVoiced = true
                                } else {
                                  newModes = newModes.filter(m => m !== '+')
                                  newIsVoiced = false
                                }
                              }
                              
                              return {
                                ...u,
                                modes: newModes,
                                isOp: newIsOp,
                                isVoiced: newIsVoiced,
                              }
                            })
                            
                            return { ...c, users: updatedUsers }
                          }),
                        }
                      : srv
                  ),
                }))
                
                // Add chat message
                const modeName = modeType === 'o' ? 'operator' : modeType === 'v' ? 'voice' : modeType === 'a' ? 'admin' : 'halfop'
                const action = isAdding ? 'granted' : 'removed'
                appendChannelMessage(
                  event.channel,
                  setterNick,
                  `${setterNick} ${action} ${modeName} status to ${targetNick}`,
                  'mode'
                )
              } else {
                // Channel mode change (not user-specific)
                appendChannelMessage(
                  event.channel,
                  setterNick,
                  `${setterNick} sets mode ${modeContent}`,
                  'mode'
                )
              }
            } else {
              // Simple channel mode change
              appendChannelMessage(
                event.channel,
                setterNick,
                `${setterNick} sets mode ${modeContent}`,
                'mode'
              )
            }
          }
          break
        default:
          break
      }
    }).catch(() => {
      nativeBridgeInitialized = false
    })
  },

  addToCommandHistory: (cmd) => {
    set((state) => ({
      commandHistory: [...state.commandHistory, cmd],
      commandHistoryIndex: -1,
    }))
  },
}))
