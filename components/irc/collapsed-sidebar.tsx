"use client"

import { useIRCStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Plus, Settings, Hash, MessageSquare, ChevronsRight, X, Monitor } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ConnectionStatus, IRCChannel } from "@/lib/types"

function StatusRing({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
        status === "connected" && "bg-green-500",
        status === "connecting" && "bg-yellow-500 animate-pulse",
        status === "disconnected" && "bg-red-500"
      )}
    />
  )
}

function ChannelTooltipContent({ channel, isActive }: { channel: IRCChannel; isActive: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center gap-1.5">
        {channel.isDirectMessage ? (
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
        ) : (
          <Hash className="h-3 w-3 text-muted-foreground" />
        )}
        <span className={cn("font-mono text-xs font-medium", isActive && "text-primary")}>
          {channel.name}
        </span>
      </div>
      {channel.topic && (
        <p className="max-w-48 truncate font-mono text-[10px] text-muted-foreground">
          {channel.topic}
        </p>
      )}
      <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
        {channel.users.length > 0 && <span>{channel.users.length} users</span>}
        {channel.unreadCount > 0 && (
          <span className="text-foreground">{channel.unreadCount} unread</span>
        )}
        {channel.mentionCount > 0 && (
          <span className="font-semibold text-destructive">{channel.mentionCount} mentions</span>
        )}
      </div>
    </div>
  )
}

export function CollapsedSidebar({ onAddServer }: { onAddServer: () => void }) {
  const servers = useIRCStore((s) => s.servers)
  const activeView = useIRCStore((s) => s.activeView)
  const setActiveView = useIRCStore((s) => s.setActiveView)
  const setSettingsOpen = useIRCStore((s) => s.setSettingsOpen)
  const setSidebarCollapsed = useIRCStore((s) => s.setSidebarCollapsed)
  const setSidebarOpen = useIRCStore((s) => s.setSidebarOpen)

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full w-12 flex-col items-center bg-card text-card-foreground">
        {/* Expand bar - matches channel header height (status bar + channel info) */}
        <div className="flex w-full flex-col border-b">
          {/* Top row - matches status bar */}
          <div className="flex h-7 items-center justify-center border-b px-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label="Expand sidebar"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono text-xs">
                Expand Sidebar
                <span className="ml-2 text-muted-foreground">Ctrl+B</span>
              </TooltipContent>
            </Tooltip>
          </div>
          {/* Bottom row - matches channel info bar */}
          <div className="flex h-9 items-center justify-center px-1" />
        </div>

        {/* Server icons + channels */}
        <ScrollArea className="flex-1 w-full scrollbar-thin">
          <div className="flex flex-col items-center gap-1 py-2">
            {servers.map((server) => {
              const isActiveServer = activeView.serverId === server.id
              const isServerConsole = isActiveServer && activeView.channelId === ""
              const totalUnread = server.channels.reduce((sum, ch) => sum + ch.unreadCount, 0)
              const totalMentions = server.channels.reduce((sum, ch) => sum + ch.mentionCount, 0)

              return (
                <div key={server.id} className="flex flex-col items-center gap-0.5">
                  {/* Server icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          // Navigate to server console
                          setActiveView({ serverId: server.id, channelId: "" })
                        }}
                        className="relative"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all",
                            isServerConsole
                              ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40"
                              : isActiveServer
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {server.name.charAt(0).toUpperCase()}
                        </div>
                        <StatusRing status={server.status} />
                        {totalMentions > 0 && !isActiveServer && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 font-mono text-[8px] font-bold text-destructive-foreground">
                            {totalMentions}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-56">
                      <div className="flex flex-col gap-1 py-0.5">
                        <span className="font-mono text-xs font-semibold">{server.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {server.host}:{server.port}
                          {server.status === "connected"
                            ? ` - ${server.latency}ms`
                            : ` - ${server.status}`}
                        </span>
                        {server.channels.length > 0 && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {server.channels.length} channels
                            {totalUnread > 0 && `, ${totalUnread} unread`}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>

                  {/* Channel dots for active server */}
                  {isActiveServer && (
                    <div className="flex flex-col items-center gap-0.5 py-0.5">
                      {/* Server console icon */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveView({ serverId: server.id, channelId: "" })}
                            className={cn(
                              "relative flex h-6 w-6 items-center justify-center rounded transition-all",
                              isServerConsole
                                ? "bg-primary/20 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <Monitor className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-56">
                          <div className="flex flex-col gap-1 py-0.5">
                            <span className="font-mono text-xs font-medium text-primary">Server Console</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {server.host}:{server.port} - {server.serverMessages.length} messages
                            </span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                      {server.channels.map((channel) => {
                        const isActive = activeView.channelId === channel.id
                        const hasMentions = channel.mentionCount > 0
                        const hasUnread = channel.unreadCount > 0
                        return (
                          <Tooltip key={channel.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setActiveView({ serverId: server.id, channelId: channel.id })}
                                className={cn(
                                  "relative flex h-6 w-6 items-center justify-center rounded transition-all",
                                  isActive
                                    ? "bg-primary/20 text-primary"
                                    : hasMentions
                                    ? "bg-destructive/20 text-destructive"
                                    : hasUnread
                                    ? "text-foreground hover:bg-muted"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                {channel.isDirectMessage ? (
                                  <MessageSquare className="h-3 w-3" />
                                ) : (
                                  <Hash className="h-3 w-3" />
                                )}
                                {hasMentions && (
                                  <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-destructive px-0.5 font-mono text-[7px] font-bold text-destructive-foreground">
                                    {channel.mentionCount}
                                  </span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-56">
                              <ChannelTooltipContent channel={channel} isActive={isActive} />
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add server */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-1 h-8 w-8 rounded-lg border border-dashed border-muted-foreground/30"
                  onClick={onAddServer}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="sr-only">Add server</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-mono text-xs">Add Server</TooltipContent>
            </Tooltip>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="flex w-full flex-col items-center gap-1 border-t py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              Settings
              <span className="ml-2 text-muted-foreground">{'Ctrl+,'}</span>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Hide sidebar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-mono text-xs">
              Hide Sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
