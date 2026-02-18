"use client"

import { useEffect, useRef, useState } from "react"
import { useIRCStore } from "@/lib/store"
import { getNickColor } from "@/lib/nick-colors"
import { parseMessageContent } from "./code-block"
import { NickPopover } from "./nick-popover"
import { cn } from "@/lib/utils"
import type { IRCMessage, MessageDensity, TimestampFormat } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { ImagePreview } from "./image-preview"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu"
import { emitInputInsert } from "@/lib/input-bridge"

function formatTimestamp(date: Date, format: TimestampFormat): string {
  const h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, "0")
  if (format === "12h") {
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${m} ${ampm}`
  }
  return `${h.toString().padStart(2, "0")}:${m}`
}

function formatFullTimestamp(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function densityClasses(density: MessageDensity): string {
  switch (density) {
    case "compact": return "py-0.5"
    case "cozy": return "py-1"
    case "comfortable": return "py-2"
  }
}

const IMAGE_REGEX = /https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?/gi

function extractImageUrls(content: string): string[] {
  return Array.from(content.matchAll(IMAGE_REGEX), (m) => m[0])
}

interface TimestampBadgeProps {
  date: Date
  format: TimestampFormat
  fontSize: number
}

function TimestampBadge({ date, format, fontSize }: TimestampBadgeProps) {
  const ts = formatTimestamp(new Date(date), format)
  const full = formatFullTimestamp(new Date(date))
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="shrink-0 cursor-default text-muted-foreground/50 select-none" style={{ fontSize: fontSize - 2 }}>
          {ts}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-mono text-[10px]">
        {full}
      </TooltipContent>
    </Tooltip>
  )
}

interface MessageLineProps {
  message: IRCMessage
  density: MessageDensity
  timestampFormat: TimestampFormat
  showJoinPart: boolean
  nickColorScheme: "default" | "pastel" | "vivid"
  showStatusPrefixesInChat: boolean
  syntaxHighlighting: boolean
  ircColors: boolean
  fontSize: number
  searchQuery: string
  ignoreList: string[]
  inlineImagePreviews: boolean
}

function MessageLine({
  message,
  density,
  timestampFormat,
  showJoinPart,
  nickColorScheme,
  showStatusPrefixesInChat,
  syntaxHighlighting,
  ircColors,
  fontSize,
  searchQuery,
  ignoreList,
  inlineImagePreviews,
}: MessageLineProps) {
  // Filter ignored users (but not system messages)
  if (message.type === "message" || message.type === "action" || message.type === "notice") {
    if (ignoreList.includes(message.nickname.toLowerCase())) {
      return null
    }
  }

  // Filter join/part/quit if setting is off
  if (!showJoinPart && ["join", "part", "quit"].includes(message.type)) {
    return null
  }

  // Search filter
  if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase()) && !message.nickname.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null
  }

  const nickColor = getNickColor(message.nickname, nickColorScheme)
  const paddingClass = densityClasses(density)
  const rowBase = "flex items-start gap-2 px-3 font-mono min-w-0 max-w-full sm:px-4"

  // Image URLs for preview
  const imageUrls = inlineImagePreviews ? extractImageUrls(message.content) : []

  let lastContextSelection = ""

  const getSelectedText = () => {
    if (typeof window === "undefined") return ""
    const sel = window.getSelection()
    return sel ? sel.toString() : ""
  }

  const copyToClipboard = async (text: string) => {
    if (!text) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return
      }
    } catch {
      // fall through to fallback
    }
    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    } catch {
      // ignore
    }
  }

  const wrapWithContextMenu = (node: React.ReactNode) => {
    const nick = message.nickname
    const baseText = message.content
    const serverId = message.serverId

    const handleContextMenuCapture: React.MouseEventHandler<HTMLDivElement> = () => {
      const sel = getSelectedText().trim()
      if (sel) {
        lastContextSelection = sel
      }
    }

    const handleCopySelection = async () => {
      const txt = (lastContextSelection || getSelectedText().trim())
      if (txt) await copyToClipboard(txt)
    }

    const handleCopyMessage = async () => {
      if (baseText) await copyToClipboard(baseText)
    }

    const handleQuoteUser = () => {
      if (!nick) return
      emitInputInsert({ text: `@${nick} `, mode: "append" })
    }

    const handleQuoteText = () => {
      const sel = getSelectedText().trim()
      const text = sel || baseText
      if (!text) return
      const quoted = `> ${nick}: ${text}`
      emitInputInsert({ text: quoted, mode: "append" })
    }

    const handleWhoisUser = () => {
      if (!nick) return
      emitInputInsert({ text: `/whois ${nick}`, mode: "replace" })
    }

    const handleDmUser = () => {
      if (!nick || !serverId) return
      // Open or focus DM with this user
      useIRCStore.getState().openDM(serverId, nick)
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div onContextMenuCapture={handleContextMenuCapture}>
            {node}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={handleCopySelection}>Copy selection</ContextMenuItem>
          <ContextMenuItem onSelect={handleCopyMessage}>Copy entire message</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={handleQuoteUser}>Quote user</ContextMenuItem>
          <ContextMenuItem onSelect={handleQuoteText}>Quote text</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={handleWhoisUser}>Whois user</ContextMenuItem>
          <ContextMenuItem onSelect={handleDmUser}>DM user</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // Nick change
  if (message.type === "nick_change") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-muted-foreground/60 italic" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {"***"} {message.content}
        </span>
      </div>
    )
  }

  // Kick
  if (message.type === "kick") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, "bg-red-500/5 border-l-2 border-red-500/30", paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-red-400/80" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {"<--"} {message.content}
        </span>
      </div>
    )
  }

  // Mode change
  if (message.type === "mode") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-muted-foreground" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {"***"} {message.content}
        </span>
      </div>
    )
  }

  // CTCP
  if (message.type === "ctcp") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-cyan-400/80" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {"***"} {message.content}
        </span>
      </div>
    )
  }

  if (message.type === "join" || message.type === "part" || message.type === "quit") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-muted-foreground/60 italic" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {message.type === "join" ? "-->" : "<--"} {message.content}
        </span>
      </div>
    )
  }

  if (message.type === "system") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 text-muted-foreground" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>*** {message.content}</span>
      </div>
    )
  }

  if (message.type === "notice") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, "bg-yellow-500/5 border-l-2 border-yellow-500/30", paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="shrink-0 font-bold text-yellow-500">-{message.nickname}-</span>
        <span className="min-w-0 flex-1 text-yellow-400/80" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {parseMessageContent(message.content, syntaxHighlighting, ircColors)}
        </span>
      </div>
    )
  }

  if (message.type === "action") {
    return wrapWithContextMenu(
      <div className={cn(rowBase, paddingClass)} style={{ fontSize }}>
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
        <span className="min-w-0 italic text-foreground/80" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {"* "}
          <NickPopover nickname={message.nickname} serverId={message.serverId} channelId={message.channelId} nickColorScheme={nickColorScheme}>
            <button className="font-bold transition-opacity hover:opacity-80" style={{ color: nickColor }}>{message.nickname}</button>
          </NickPopover>
          {" "}
          {message.content}
        </span>
      </div>
    )
  }

  // Regular message
  const displayNickname = (() => {
    if (!showStatusPrefixesInChat) return message.nickname
    const store = useIRCStore.getState()
    const server = store.servers.find((s) => s.id === message.serverId)
    const channel = server?.channels.find((c) => c.id === message.channelId)
    const user = channel?.users.find((u) => u.nickname === message.nickname)
    if (!user) return message.nickname
    const prefix = user.isOp ? "@" : user.isVoiced ? "+" : ""
    return prefix ? `${prefix}${message.nickname}` : message.nickname
  })()
  return wrapWithContextMenu(
    <div
      className={cn(
        rowBase,
        "transition-colors hover:bg-muted/30",
        paddingClass,
        message.isHighlight && "bg-primary/5 border-l-2 border-primary"
      )}
      style={{ fontSize }}
    >
      <span className="hidden shrink-0 select-none sm:inline">
        <TimestampBadge date={message.timestamp} format={timestampFormat} fontSize={fontSize} />
      </span>
      <NickPopover nickname={message.nickname} serverId={message.serverId} channelId={message.channelId} nickColorScheme={nickColorScheme}>
        <button className="shrink-0 font-bold transition-opacity hover:opacity-80" style={{ color: nickColor }}>
          {"<"}{displayNickname}{">"}
        </button>
      </NickPopover>
      <span className="min-w-0 flex-1 text-foreground/90" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {parseMessageContent(message.content, syntaxHighlighting, ircColors)}
        {imageUrls.length > 0 && (
          <span className="flex flex-col gap-1 pt-1">
            {imageUrls.map((url, i) => (
              <ImagePreview key={i} url={url} />
            ))}
          </span>
        )}
      </span>
    </div>
  )
}

export function MessageArea() {
  const activeView = useIRCStore((s) => s.activeView)
  const servers = useIRCStore((s) => s.servers)
  const settings = useIRCStore((s) => s.settings)
  const searchQuery = useIRCStore((s) => s.searchQuery)
  const bottomRef = useRef<HTMLDivElement>(null)

  const server = servers.find((s) => s.id === activeView.serverId)
  const isServerConsole = !activeView.channelId
  const channel = isServerConsole ? null : server?.channels.find((c) => c.id === activeView.channelId)
  const messages = isServerConsole ? (server?.serverMessages || []) : (channel?.messages || [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages.length])

  if (!server) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground font-mono text-sm">
        Select a server or channel to start chatting
      </div>
    )
  }

  if (!isServerConsole && !channel) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground font-mono text-sm">
        Select a channel to start chatting
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="flex flex-col py-2">
          {messages.map((msg) => (
            <MessageLine
              key={msg.id}
              message={msg}
              density={settings.messageDensity}
              timestampFormat={settings.timestampFormat}
              showJoinPart={settings.showJoinPartQuit}
              nickColorScheme={settings.nickColorScheme}
              showStatusPrefixesInChat={settings.showStatusPrefixesInChat}
              syntaxHighlighting={settings.syntaxHighlighting}
              ircColors={settings.ircColors}
              fontSize={settings.fontSize}
              searchQuery={searchQuery}
              ignoreList={settings.ignoreList || []}
              inlineImagePreviews={settings.inlineImagePreviews}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}
