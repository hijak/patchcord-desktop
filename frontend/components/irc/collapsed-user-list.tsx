"use client"

import { useIRCStore } from "@/lib/store"
import { getNickColor } from "@/lib/nick-colors"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ChevronsLeft, Crown, Mic, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CollapsedUserList() {
  const activeView = useIRCStore((s) => s.activeView)
  const servers = useIRCStore((s) => s.servers)
  const nickColorScheme = useIRCStore((s) => s.settings.nickColorScheme)
  const setUserListCollapsed = useIRCStore((s) => s.setUserListCollapsed)
  const setUserListOpen = useIRCStore((s) => s.setUserListOpen)

  const server = servers.find((s) => s.id === activeView.serverId)
  const channel = server?.channels.find((c) => c.id === activeView.channelId)

  if (!channel || channel.isDirectMessage) {
    return (
      <div className="flex h-full w-10 flex-col items-center bg-card pt-2">
        <span className="font-mono text-[8px] text-muted-foreground">--</span>
      </div>
    )
  }

  const ops = channel.users.filter((u) => u.isOp)
  const voiced = channel.users.filter((u) => u.isVoiced && !u.isOp)
  const regular = channel.users.filter((u) => !u.isOp && !u.isVoiced)

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-full w-10 flex-col items-center bg-card text-card-foreground">
        {/* Expand button */}
        <div className="flex w-full items-center justify-center border-b py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setUserListCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Expand user list"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-mono text-xs">
              Expand Users ({channel.users.length})
              <span className="ml-2 text-muted-foreground">Alt+U</span>
            </TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1 w-full scrollbar-thin">
          <div className="flex flex-col items-center gap-0.5 py-1">
            {/* Ops */}
            {ops.length > 0 && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mb-0.5 mt-1 cursor-default">
                      <Crown className="h-2.5 w-2.5 text-muted-foreground/50" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="font-mono text-[10px]">
                    Operators ({ops.length})
                  </TooltipContent>
                </Tooltip>
                {ops.map((user) => (
                  <UserDot key={user.nickname} nickname={user.nickname} isAway={user.isAway} nickColorScheme={nickColorScheme} prefix="@" role="Operator" hostmask={user.hostmask} />
                ))}
              </>
            )}
            {/* Voiced */}
            {voiced.length > 0 && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mb-0.5 mt-1 cursor-default">
                      <Mic className="h-2.5 w-2.5 text-muted-foreground/50" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="font-mono text-[10px]">
                    Voiced ({voiced.length})
                  </TooltipContent>
                </Tooltip>
                {voiced.map((user) => (
                  <UserDot key={user.nickname} nickname={user.nickname} isAway={user.isAway} nickColorScheme={nickColorScheme} prefix="+" role="Voiced" hostmask={user.hostmask} />
                ))}
              </>
            )}
            {/* Regular */}
            {regular.length > 0 && (
              <>
                <div className="mb-0.5 mt-1 h-px w-4 bg-muted-foreground/20" />
                {regular.map((user) => (
                  <UserDot key={user.nickname} nickname={user.nickname} isAway={user.isAway} nickColorScheme={nickColorScheme} hostmask={user.hostmask} />
                ))}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Hide button at bottom */}
        <div className="flex w-full items-center justify-center border-t py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => setUserListOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Hide user list</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="font-mono text-xs">
              Hide Users
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

function UserDot({
  nickname,
  isAway,
  nickColorScheme,
  prefix,
  role,
  hostmask,
}: {
  nickname: string
  isAway: boolean
  nickColorScheme: "default" | "pastel" | "vivid"
  prefix?: string
  role?: string
  hostmask?: string
}) {
  const color = getNickColor(nickname, nickColorScheme)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full transition-all hover:scale-110",
            isAway && "opacity-40"
          )}
          style={{ backgroundColor: `${color}20` }}
        >
          <span
            className="font-mono text-[9px] font-bold uppercase"
            style={{ color }}
          >
            {nickname.charAt(0)}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-52">
        <div className="flex flex-col gap-0.5 py-0.5">
          <div className="flex items-center gap-1">
            {prefix && (
              <span
                className="flex h-4 w-4 items-center justify-center rounded font-mono text-[9px] font-bold"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {prefix}
              </span>
            )}
            <span className="font-mono text-xs font-medium" style={{ color }}>
              {nickname}
            </span>
          </div>
          {role && (
            <span className="font-mono text-[10px] text-muted-foreground">{role}</span>
          )}
          {hostmask && (
            <span className="font-mono text-[10px] text-muted-foreground">{hostmask}</span>
          )}
          {isAway && (
            <span className="font-mono text-[10px] italic text-muted-foreground">Away</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
