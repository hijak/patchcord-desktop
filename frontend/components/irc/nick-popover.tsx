"use client"

import { useState } from "react"
import { useIRCStore } from "@/lib/store"
import { getNickColor } from "@/lib/nick-colors"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Crown, Mic, Moon, MessageSquare, Search, Ban, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"

interface NickPopoverProps {
  nickname: string
  serverId: string
  channelId: string
  nickColorScheme: "default" | "pastel" | "vivid"
  children: React.ReactNode
}

export function NickPopover({ nickname, serverId, channelId, nickColorScheme, children }: NickPopoverProps) {
  const [open, setOpen] = useState(false)
  const servers = useIRCStore((s) => s.servers)
  const settings = useIRCStore((s) => s.settings)
  const addSystemMessage = useIRCStore((s) => s.addSystemMessage)
  const openDM = useIRCStore((s) => s.openDM)
  const ignoreUser = useIRCStore((s) => s.ignoreUser)
  const unignoreUser = useIRCStore((s) => s.unignoreUser)

  const server = servers.find((s) => s.id === serverId)
  const channel = server?.channels.find((c) => c.id === channelId)
  const user = channel?.users.find((u) => u.nickname === nickname)
  const nickColor = getNickColor(nickname, nickColorScheme)
  const isIgnored = (settings.ignoreList || []).includes(nickname.toLowerCase())
  const isSelf = server?.nickname === nickname

  const handleWhois = () => {
    addSystemMessage(serverId, channelId, `[${nickname}] is ~${user?.username || nickname}@${user?.hostmask || `user/${nickname}`} (${user?.realName || nickname})`)
    if (user?.isAway) {
      addSystemMessage(serverId, channelId, `[${nickname}] is away`)
    }
    addSystemMessage(serverId, channelId, `[${nickname}] is on: ${channel?.name || 'unknown'}`)
    addSystemMessage(serverId, channelId, `[${nickname}] idle: ${Math.floor(Math.random() * 60)} minutes`)
    addSystemMessage(serverId, channelId, `[${nickname}] End of /WHOIS`)
    setOpen(false)
  }

  const handleDM = () => {
    openDM(serverId, nickname)
    setOpen(false)
  }

  const handleIgnore = () => {
    if (isIgnored) {
      unignoreUser(nickname)
      addSystemMessage(serverId, channelId, `${nickname} has been removed from your ignore list`)
    } else {
      ignoreUser(nickname)
      addSystemMessage(serverId, channelId, `${nickname} has been added to your ignore list`)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0 font-mono text-xs"
        side="right"
        align="start"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
            style={{ backgroundColor: nickColor + '20', color: nickColor }}
          >
            {nickname[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate font-bold" style={{ color: nickColor }}>
                {nickname}
              </span>
              {user?.isOp && <Crown className="h-3 w-3 shrink-0 text-yellow-500" />}
              {user?.isVoiced && !user?.isOp && <Mic className="h-3 w-3 shrink-0 text-blue-400" />}
              {user?.isAway && <Moon className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
            </div>
            {user?.hostmask && (
              <p className="truncate text-[10px] text-muted-foreground">{user.hostmask}</p>
            )}
          </div>
        </div>

        {/* User info */}
        {user?.realName && (
          <div className="border-b px-3 py-1.5 text-[10px] text-muted-foreground">
            {user.realName}
          </div>
        )}

        {/* Actions */}
        {!isSelf && (
          <div className="py-1">
            <button
              onClick={handleWhois}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5" />
              Whois
            </button>
            <button
              onClick={handleDM}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message
            </button>
            <button
              onClick={handleIgnore}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-muted",
                isIgnored ? "text-yellow-500 hover:text-yellow-400" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isIgnored ? <VolumeX className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {isIgnored ? "Unignore" : "Ignore"}
            </button>
          </div>
        )}

        {isSelf && (
          <div className="px-3 py-2 text-[10px] italic text-muted-foreground">
            This is you
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
