"use client"

import { useIRCStore } from "@/lib/store"
import { getNickColor } from "@/lib/nick-colors"
import { NickPopover } from "./nick-popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Crown, Mic, Moon } from "lucide-react"

export function UserList() {
  const activeView = useIRCStore((s) => s.activeView)
  const servers = useIRCStore((s) => s.servers)
  const nickColorScheme = useIRCStore((s) => s.settings.nickColorScheme)

  const server = servers.find((s) => s.id === activeView.serverId)
  const channel = server?.channels.find((c) => c.id === activeView.channelId)

  if (!channel || channel.isDirectMessage) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground font-mono text-xs p-4 text-center">
        No user list available
      </div>
    )
  }

  const ops = channel.users.filter((u) => u.isOp)
  const voiced = channel.users.filter((u) => u.isVoiced && !u.isOp)
  const regular = channel.users.filter((u) => !u.isOp && !u.isVoiced)

  return (
    <div className="flex h-full flex-col bg-card text-card-foreground">
      <div className="border-b px-3 py-2">
        <h3 className="font-mono text-xs font-medium text-foreground">
          Users ({channel.users.length})
        </h3>
      </div>
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="py-1">
          {ops.length > 0 && (
            <div className="px-3 py-1">
              <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Crown className="h-3 w-3" />
                Operators ({ops.length})
              </h4>
              {ops.map((user) => (
                <UserEntry key={user.nickname} nickname={user.nickname} prefix="@" isAway={user.isAway} nickColorScheme={nickColorScheme} serverId={activeView.serverId} channelId={activeView.channelId} />
              ))}
            </div>
          )}
          {voiced.length > 0 && (
            <div className="px-3 py-1">
              <h4 className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Mic className="h-3 w-3" />
                Voiced ({voiced.length})
              </h4>
              {voiced.map((user) => (
                <UserEntry key={user.nickname} nickname={user.nickname} prefix="+" isAway={user.isAway} nickColorScheme={nickColorScheme} serverId={activeView.serverId} channelId={activeView.channelId} />
              ))}
            </div>
          )}
          {regular.length > 0 && (
            <div className="px-3 py-1">
              <h4 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Users ({regular.length})
              </h4>
              {regular.map((user) => (
                <UserEntry key={user.nickname} nickname={user.nickname} isAway={user.isAway} nickColorScheme={nickColorScheme} serverId={activeView.serverId} channelId={activeView.channelId} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function UserEntry({
  nickname,
  prefix,
  isAway,
  nickColorScheme,
  serverId,
  channelId,
}: {
  nickname: string
  prefix?: string
  isAway: boolean
  nickColorScheme: "default" | "pastel" | "vivid"
  serverId: string
  channelId: string
}) {
  const color = getNickColor(nickname, nickColorScheme)
  return (
    <NickPopover nickname={nickname} serverId={serverId} channelId={channelId} nickColorScheme={nickColorScheme}>
      <button className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left transition-colors hover:bg-muted">
        {prefix && (
          <span className="font-mono text-[10px] text-muted-foreground">{prefix}</span>
        )}
        <span
          className={cn("font-mono text-xs truncate", isAway && "opacity-50")}
          style={{ color }}
        >
          {nickname}
        </span>
        {isAway && <Moon className="h-3 w-3 text-muted-foreground/50" />}
      </button>
    </NickPopover>
  )
}
