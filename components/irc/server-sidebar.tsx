"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Hash, MessageSquare, Plus, Settings, Wifi, WifiOff, Loader2, Pencil, MoreHorizontal, Trash2, Power, PowerOff, Monitor, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useIRCStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import type { ConnectionStatus } from "@/lib/types"
import { buildMode } from "@/lib/build-mode"
import { HyperText } from "@/components/ui/hyper-text"

function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "connected" && "bg-green-500",
        status === "connecting" && "bg-yellow-500 animate-pulse",
        status === "disconnected" && "bg-red-500"
      )}
    />
  )
}

export function ServerSidebar({ onAddServer, onEditServer }: { onAddServer: () => void; onEditServer: (serverId: string) => void }) {
  const servers = useIRCStore((s) => s.servers)
  const activeView = useIRCStore((s) => s.activeView)
  const setActiveView = useIRCStore((s) => s.setActiveView)
  const toggleServerCollapsed = useIRCStore((s) => s.toggleServerCollapsed)
  const setSettingsOpen = useIRCStore((s) => s.setSettingsOpen)
  const setSidebarOpen = useIRCStore((s) => s.setSidebarOpen)
  const removeServer = useIRCStore((s) => s.removeServer)
  const connectServer = useIRCStore((s) => s.connectServer)
  const disconnectServer = useIRCStore((s) => s.disconnectServer)
  const settings = useIRCStore((s) => s.settings)

  const joinChannel = useIRCStore((s) => s.joinChannel)
  const partChannel = useIRCStore((s) => s.partChannel)

  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const [joinServerId, setJoinServerId] = useState<string | null>(null)
  const [joinChannelName, setJoinChannelName] = useState("#")

  const handleChannelClick = (serverId: string, channelId: string) => {
    setActiveView({ serverId, channelId })
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const openJoinModal = (serverId: string) => {
    setJoinServerId(serverId)
    setJoinChannelName("#")
    setJoinModalOpen(true)
  }

  const handleJoinConfirm = () => {
    if (!joinServerId) return
    const name = joinChannelName.trim()
    if (!name) return
    const normalized = name.startsWith("#") ? name : `#${name}`
    joinChannel(joinServerId, normalized)
    setJoinModalOpen(false)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col bg-card text-card-foreground">
        {/* Header */}
        <div className="flex h-[5rem] items-center justify-between border-b px-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/patchcord-logo.svg"
              alt="Patchcord"
              className="h-9 w-9 rounded"
            />
            <HyperText
              className="font-mono text-sm font-semibold text-foreground py-0"
              animateOnHover
              duration={600}
            >
              Patchcord
            </HyperText>
            {buildMode !== "prod" && (
              <span className="rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                {buildMode}
              </span>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddServer}>
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add server</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add Server</TooltipContent>
          </Tooltip>
        </div>

        {/* Server tree */}
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="py-1">
            {servers.map((server) => (
              <div key={server.id}>
                {/* Server header */}
                <div className="group flex items-center hover:bg-muted">
                  {/* Chevron toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleServerCollapsed(server.id) }}
                    className="flex shrink-0 items-center justify-center py-1.5 pl-3 pr-1 transition-colors"
                  >
                    {server.collapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {/* Server name - navigates to server console */}
                  <button
                    onClick={() => handleChannelClick(server.id, "")}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1 text-left transition-colors",
                      activeView.serverId === server.id && activeView.channelId === "" && "text-primary"
                    )}
                  >
                    <StatusDot status={server.status} />
                    <span className={cn(
                      "flex-1 truncate font-mono text-xs font-medium",
                      activeView.serverId === server.id && activeView.channelId === ""
                        ? "text-primary"
                        : "text-foreground"
                    )}>
                      {server.name}
                    </span>
                    {server.status === "connected" && (
                      <span className="font-mono text-[10px] text-muted-foreground">{server.latency}ms</span>
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mr-1 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                        <span className="sr-only">Server options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        className="gap-2 font-mono text-xs"
                        onClick={() => onEditServer(server.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Server
                      </DropdownMenuItem>
                      {server.status === "connected" && (
                        <DropdownMenuItem
                          className="gap-2 font-mono text-xs"
                          onClick={() => openJoinModal(server.id)}
                        >
                          <Hash className="h-3.5 w-3.5" />
                          Join Channel…
                        </DropdownMenuItem>
                      )}
                      {server.status === "connected" ? (
                        <DropdownMenuItem
                          className="gap-2 font-mono text-xs"
                          onClick={() => disconnectServer(server.id)}
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                          Disconnect
                        </DropdownMenuItem>
                      ) : server.status === "disconnected" ? (
                        <DropdownMenuItem
                          className="gap-2 font-mono text-xs"
                          onClick={() => connectServer(server.id)}
                        >
                          <Power className="h-3.5 w-3.5" />
                          Connect
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 font-mono text-xs text-destructive focus:text-destructive"
                        onClick={() => removeServer(server.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Server
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Channels and DMs */}
                {!server.collapsed && (
                  <div className="pb-1">
                    {/* Server console entry */}
                    <button
                      onClick={() => handleChannelClick(server.id, "")}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1 pl-8 text-left transition-colors",
                        activeView.serverId === server.id && activeView.channelId === ""
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Monitor className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate font-mono text-xs">Server Console</span>
                    </button>

                    {/* Regular channels */}
                    {server.channels
                      .filter((c) => !c.isDirectMessage)
                      .map((channel) => {
                        const isActive =
                          activeView.serverId === server.id && activeView.channelId === channel.id
                        const hasUnread = channel.unreadCount > 0
                        const hasMentions = channel.mentionCount > 0

                        return (
                          <div
                            key={channel.id}
                            className={cn(
                              "flex w-full items-center gap-1 px-3 py-1 pl-8 text-left transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              hasUnread && !isActive && "text-foreground font-medium"
                            )}
                          >
                            <button
                              onClick={() => handleChannelClick(server.id, channel.id)}
                              className="flex flex-1 items-center gap-2 text-left"
                            >
                              <Hash className="h-3.5 w-3.5 shrink-0" />
                              <span className="flex-1 truncate font-mono text-xs">{channel.name}</span>
                              {hasMentions ? (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                  {channel.mentionCount}
                                </span>
                              ) : hasUnread ? (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/30 px-1 text-[10px] font-medium text-foreground">
                                  {channel.unreadCount}
                                </span>
                              ) : null}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                partChannel(server.id, channel.id)
                              }}
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20"
                              aria-label="Leave channel"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })}

                    {/* Direct messages */}
                    {server.channels.some((c) => c.isDirectMessage) && (
                      <>
                        <div className="mt-1 flex items-center gap-2 px-3 pl-8">
                          <span className="h-px flex-1 bg-border/60" />
                          <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                            Direct Messages
                          </span>
                        </div>
                        {server.channels
                          .filter((c) => c.isDirectMessage)
                          .map((channel) => {
                            const isActive =
                              activeView.serverId === server.id && activeView.channelId === channel.id
                            const hasUnread = channel.unreadCount > 0
                            const hasMentions = channel.mentionCount > 0

                            return (
                              <div
                                key={channel.id}
                                className={cn(
                                  "flex w-full items-center gap-1 px-3 py-1 pl-8 text-left transition-colors",
                                  isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                  hasUnread && !isActive && "text-foreground font-medium"
                                )}
                              >
                                <button
                                  onClick={() => handleChannelClick(server.id, channel.id)}
                                  className="flex flex-1 items-center gap-2 text-left"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                                  <span className="flex-1 truncate font-mono text-xs">
                                    {channel.name}
                                  </span>
                                  {hasMentions ? (
                                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                                      {channel.mentionCount}
                                    </span>
                                  ) : hasUnread ? (
                                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/30 px-1 text-[10px] font-medium text-foreground">
                                      {channel.unreadCount}
                                    </span>
                                  ) : null}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    useIRCStore.getState().closeDM(server.id, channel.id)
                                  }}
                                  className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20"
                                  aria-label="Close DM"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )
                          })}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Join channel modal */}
        <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
          <DialogContent className="max-w-sm border-border bg-card p-0">
            <DialogHeader className="border-b px-4 py-3">
              <DialogTitle className="font-mono text-sm text-foreground">
                Join Channel
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4 p-4"
              onSubmit={(e) => {
                e.preventDefault()
                handleJoinConfirm()
              }}
            >
              <div className="space-y-1.5">
                <p className="font-mono text-[11px] text-muted-foreground">
                  Enter a channel name to join on{" "}
                  <span className="font-semibold text-foreground">
                    {joinServerId
                      ? servers.find((s) => s.id === joinServerId)?.name || "server"
                      : "server"}
                  </span>
                  .
                </p>
                <Input
                  value={joinChannelName}
                  onChange={(e) => setJoinChannelName(e.target.value)}
                  placeholder="#general"
                  className="font-mono text-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[11px]"
                  onClick={() => setJoinModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="font-mono text-[11px]"
                  disabled={!joinChannelName.trim()}
                >
                  Join
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="border-t px-3 py-2 min-h-[2.75rem] flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary/20">
                {settings.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.avatarUrl}
                    alt="avatar"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-mono text-[10px] font-bold text-primary">
                    {(servers.find((s) => s.id === activeView.serverId)?.nickname || settings.defaultNickname || "patchcord")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-foreground">
                {servers.find((s) => s.id === activeView.serverId)?.nickname || settings.defaultNickname || "patchcord"}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
