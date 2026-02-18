"use client"

import { useState } from "react"
import { useIRCStore } from "@/lib/store"
import { Hash, Users, Search, Columns2, X, Menu, MessageSquare, Wifi, WifiOff, Loader2, Pencil, Check, History, PanelLeft, Monitor, RefreshCw, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { ConnectionStatus } from "@/lib/types"
import { parseMessageContent } from "./code-block"

function ConnectionStatusBar() {
  const servers = useIRCStore((s) => s.servers)
  const activeView = useIRCStore((s) => s.activeView)
  const server = servers.find((s) => s.id === activeView.serverId)

  if (!server) return null

  const statusColor =
    server.status === "connected" ? "text-green-500" :
    server.status === "connecting" ? "text-yellow-500" :
    "text-red-500"

  const StatusIcon =
    server.status === "connected" ? Wifi :
    server.status === "connecting" ? Loader2 :
    WifiOff

  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
      <StatusIcon className={cn("h-3 w-3", statusColor, server.status === "connecting" && "animate-spin")} />
      <span>{server.name}</span>
      {server.status === "connected" && (
        <span className="text-muted-foreground/50">{server.latency}ms</span>
      )}
      {server.status === "connecting" && (
        <span className="flex items-center gap-1 text-yellow-500">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" />
          <span>Reconnecting...</span>
        </span>
      )}
      {server.status === "disconnected" && server.status === "disconnected" && (
        <span className="text-red-400">Disconnected</span>
      )}
      {server.awayMessage && (
        <span className="flex items-center gap-1 text-yellow-500/70">
          <Moon className="h-2.5 w-2.5" />
          Away
        </span>
      )}
    </div>
  )
}

export function ChannelHeader() {
  const activeView = useIRCStore((s) => s.activeView)
  const servers = useIRCStore((s) => s.servers)
  const userListOpen = useIRCStore((s) => s.userListOpen)
  const setUserListOpen = useIRCStore((s) => s.setUserListOpen)
  const searchOpen = useIRCStore((s) => s.searchOpen)
  const setSearchOpen = useIRCStore((s) => s.setSearchOpen)
  const searchQuery = useIRCStore((s) => s.searchQuery)
  const setSearchQuery = useIRCStore((s) => s.setSearchQuery)
  const splitView = useIRCStore((s) => s.splitView)
  const setSplitView = useIRCStore((s) => s.setSplitView)
  const sidebarOpen = useIRCStore((s) => s.sidebarOpen)
  const setSidebarOpen = useIRCStore((s) => s.setSidebarOpen)
  const sidebarCollapsed = useIRCStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useIRCStore((s) => s.setSidebarCollapsed)
  const setChannelTopic = useIRCStore((s) => s.setChannelTopic)
  const addSystemMessage = useIRCStore((s) => s.addSystemMessage)
  const saveAllLogs = useIRCStore((s) => s.settings.saveAllLogs)
  const setLogViewerOpen = useIRCStore((s) => s.setLogViewerOpen)

  const server = servers.find((s) => s.id === activeView.serverId)
  const isServerConsole = !activeView.channelId
  const channel = isServerConsole ? null : server?.channels.find((c) => c.id === activeView.channelId)
  const settings = useIRCStore((s) => s.settings)

  const [editingTopic, setEditingTopic] = useState(false)
  const [topicValue, setTopicValue] = useState("")

  if (!server) return null

  const myNick = server.nickname
  const meInChannel = channel?.users.find((u) => u.nickname === myNick)
  const canEditTopic = !!channel && !channel.isDirectMessage && !!meInChannel?.isOp

  const topicText =
    channel && !channel.isDirectMessage
      ? (() => {
          if (channel.topic && channel.topic.trim()) return channel.topic
          const lastTopicMsg = [...channel.messages]
            .reverse()
            .find(
              (m) =>
                m.type === "system" &&
                (m.content.startsWith("Topic set to: ") ||
                  m.content.startsWith("Topic changed to: "))
            )
          if (lastTopicMsg) {
            return lastTopicMsg.content
              .replace(/^Topic set to:\s*/, "")
              .replace(/^Topic changed to:\s*/, "")
          }
          return "No topic set"
        })()
      : ""
  
  const topicDisplay = topicText ? parseMessageContent(topicText, settings.syntaxHighlighting, settings.ircColors) : null

  const handleTopicEdit = () => {
    setTopicValue(channel?.topic || "")
    setEditingTopic(true)
  }

  const handleTopicSave = () => {
    setChannelTopic(activeView.serverId, activeView.channelId, topicValue)
    if (activeView.channelId && topicValue.trim()) {
      addSystemMessage(
        activeView.serverId,
        activeView.channelId,
        `Topic changed to: ${topicValue}`
      )
    }
    setEditingTopic(false)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-b bg-card">
        {/* Connection status bar */}
        <div className="flex items-center justify-between px-3 py-1">
          <ConnectionStatusBar />
          <div className="flex items-center gap-1.5">
            {searchOpen && (
              <div className="flex items-center gap-1 rounded border bg-background px-2 py-0.5">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-32 bg-transparent font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none md:w-48"
                  autoFocus
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery("") }}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Channel info and controls */}
        <div className="flex items-center gap-2 px-3 py-2 min-h-[2.75rem]">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          {/* Desktop: show expand button when sidebar is fully hidden */}
          {!sidebarOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-7 w-7 shrink-0 md:inline-flex"
                  onClick={() => { setSidebarOpen(true); setSidebarCollapsed(false) }}
                >
                  <PanelLeft className="h-4 w-4" />
                  <span className="sr-only">Show sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Show Sidebar (Ctrl+B)</TooltipContent>
            </Tooltip>
          )}

          {isServerConsole ? (
            <>
              <div className="flex items-center gap-1.5">
                <Monitor className="h-4 w-4 text-primary" />
                <h2 className="font-mono text-sm font-bold text-foreground">{server.name}</h2>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  Server Console
                </span>
              </div>
              <div className="hidden flex-1 items-center gap-1 md:flex">
                <span className="mx-2 text-border">|</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {server.host}:{server.port}{server.ssl ? " (SSL)" : ""} - {server.serverMessages.length} messages
                </span>
              </div>
            </>
          ) : channel ? (
            <>
              <div className="flex items-center gap-1.5">
                {channel.isDirectMessage ? (
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Hash className="h-4 w-4 text-muted-foreground" />
                )}
                <h2 className="font-mono text-sm font-bold text-foreground">{channel.name}</h2>
                {channel.modes && !channel.isDirectMessage && (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {channel.modes}
                  </span>
                )}
              </div>

              {/* Topic */}
              {!channel.isDirectMessage && (
                <div className="hidden flex-1 items-center gap-1 md:flex">
                  <span className="mx-2 text-border">|</span>
                  {editingTopic && canEditTopic ? (
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        type="text"
                        value={topicValue}
                        onChange={(e) => setTopicValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleTopicSave()}
                        className="flex-1 bg-transparent font-mono text-xs text-muted-foreground focus:outline-none"
                        autoFocus
                      />
                      <button onClick={handleTopicSave}>
                        <Check className="h-3 w-3 text-primary" />
                      </button>
                      <button onClick={() => setEditingTopic(false)}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : canEditTopic ? (
                    <button
                      onClick={handleTopicEdit}
                      className="group flex flex-1 items-center gap-1"
                    >
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {topicDisplay}
                      </span>
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/50" />
                    </button>
                  ) : (
                    <span className="flex flex-1 items-center gap-1">
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {topicDisplay}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search (Ctrl+F)</TooltipContent>
            </Tooltip>

            {saveAllLogs && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setLogViewerOpen(true)}
                  >
                    <History className="h-4 w-4" />
                    <span className="sr-only">Log history</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Log History</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    userListOpen && !isServerConsole && "bg-muted",
                    isServerConsole && "opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (isServerConsole) return
                    setUserListOpen(!userListOpen)
                  }}
                  disabled={isServerConsole}
                >
                  <Users className="h-4 w-4" />
                  <span className="sr-only">Toggle user list</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isServerConsole ? "User list only available in channels" : "Users (Alt+U)"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile topic / server info */}
        {isServerConsole ? (
          <div className="border-t px-3 py-1 md:hidden">
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {server.host}:{server.port}{server.ssl ? " (SSL)" : ""}
            </p>
          </div>
        ) : channel && !channel.isDirectMessage && topicText ? (
          <div className="border-t px-3 py-1 md:hidden">
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {topicDisplay}
            </p>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
