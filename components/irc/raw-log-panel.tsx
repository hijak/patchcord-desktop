"use client"

import { useIRCStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

export function RawLogPanel() {
  const rawLogOpen = useIRCStore((s) => s.rawLogOpen)
  const setRawLogOpen = useIRCStore((s) => s.setRawLogOpen)
  const rawLogMessages = useIRCStore((s) => s.rawLogMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [rawLogMessages.length])

  if (!rawLogOpen) return null

  return (
    <div className="flex h-48 flex-col border-t bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/40 bg-[#161b22] px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Raw IRC Log
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setRawLogOpen(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1 scrollbar-thin">
        <div className="p-2">
          {rawLogMessages.map((msg, i) => (
            <div key={i} className="font-mono text-[11px] leading-relaxed">
              {msg.startsWith(":") || msg.startsWith("PING") || msg.startsWith("PONG") ? (
                <span className={
                  msg.includes("PRIVMSG") ? "text-[#7ee787]" :
                  msg.includes("JOIN") ? "text-[#79c0ff]" :
                  msg.startsWith("PING") || msg.startsWith("PONG") ? "text-[#8b949e]" :
                  "text-[#e6edf3]"
                }>
                  {msg}
                </span>
              ) : (
                <span className="text-[#e6edf3]">{msg}</span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
