"use client"

import { useState, useMemo } from "react"
import { useIRCStore } from "@/lib/store"
import type { LogEntry } from "@/lib/store"
import { X, Search, Download, Trash2, Filter, Calendar, Hash, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatTimeOnly(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function groupLogsByDate(logs: LogEntry[]): Record<string, LogEntry[]> {
  const groups: Record<string, LogEntry[]> = {}
  for (const log of logs) {
    const dateKey = new Date(log.timestamp).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(log)
  }
  return groups
}

export function LogViewer() {
  const logViewerOpen = useIRCStore((s) => s.logViewerOpen)
  const setLogViewerOpen = useIRCStore((s) => s.setLogViewerOpen)
  const logHistory = useIRCStore((s) => s.logHistory)
  const clearLogHistory = useIRCStore((s) => s.clearLogHistory)
  const servers = useIRCStore((s) => s.servers)

  const [searchQuery, setSearchQuery] = useState("")
  const [filterServer, setFilterServer] = useState<string>("all")
  const [filterChannel, setFilterChannel] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const uniqueServers = useMemo(() => {
    const s = new Map<string, string>()
    logHistory.forEach((l) => s.set(l.serverId, l.serverName))
    return Array.from(s.entries())
  }, [logHistory])

  const uniqueChannels = useMemo(() => {
    const c = new Map<string, string>()
    logHistory
      .filter((l) => filterServer === "all" || l.serverId === filterServer)
      .forEach((l) => c.set(l.channelId, l.channelName))
    return Array.from(c.entries())
  }, [logHistory, filterServer])

  const filteredLogs = useMemo(() => {
    return logHistory.filter((log) => {
      if (filterServer !== "all" && log.serverId !== filterServer) return false
      if (filterChannel !== "all" && log.channelId !== filterChannel) return false
      if (filterType !== "all" && log.type !== filterType) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          log.content.toLowerCase().includes(q) ||
          log.nickname.toLowerCase().includes(q) ||
          log.channelName.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [logHistory, searchQuery, filterServer, filterChannel, filterType])

  const groupedLogs = useMemo(() => groupLogsByDate(filteredLogs), [filteredLogs])

  const handleExportLogs = () => {
    const lines = filteredLogs.map(
      (l) =>
        `[${new Date(l.timestamp).toISOString()}] [${l.serverName}/${l.channelName}] <${l.nickname}> ${l.content}`
    )
    const blob = new Blob([lines.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `patchcord-logs-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!logViewerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-sm font-bold text-foreground">Log History</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {filteredLogs.length} / {logHistory.length} entries
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleExportLogs}
              title="Export logs"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Clear all saved log history?")) {
                  clearLogHistory()
                }
              }}
              title="Clear all logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setLogViewerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="border-b px-4 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs by content, nickname, or channel..."
                className="h-8 pl-8 font-mono text-xs"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 font-mono text-xs"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3 w-3" />
              Filters
              <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 pb-1">
              <Select value={filterServer} onValueChange={(v) => { setFilterServer(v); setFilterChannel("all") }}>
                <SelectTrigger className="h-7 w-40 font-mono text-[11px]">
                  <Hash className="mr-1 h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Servers</SelectItem>
                  {uniqueServers.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="h-7 w-40 font-mono text-[11px]">
                  <Hash className="mr-1 h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  {uniqueChannels.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-7 w-36 font-mono text-[11px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="action">Actions</SelectItem>
                  <SelectItem value="join">Joins</SelectItem>
                  <SelectItem value="part">Parts</SelectItem>
                  <SelectItem value="notice">Notices</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Log content */}
        <ScrollArea className="flex-1 scrollbar-thin">
          {logHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-mono text-sm text-muted-foreground">No logs saved yet</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/60">
                Enable "Save All Logs" in Settings {'>'} Advanced to start recording
              </p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-mono text-sm text-muted-foreground">No matching logs found</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground/60">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="p-3">
              {Object.entries(groupedLogs).map(([dateLabel, logs]) => (
                <div key={dateLabel} className="mb-4">
                  {/* Date separator */}
                  <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-card/90 py-1 backdrop-blur-sm">
                    <div className="h-px flex-1 bg-border" />
                    <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-0.5 font-mono text-[10px] text-muted-foreground">
                      <Calendar className="h-2.5 w-2.5" />
                      {dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Log entries */}
                  {logs.map((log) => (
                    <LogLine key={log.id} log={log} searchQuery={searchQuery} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer stats */}
        {logHistory.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              Oldest: {formatTimestamp(new Date(logHistory[0].timestamp))}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Newest: {formatTimestamp(new Date(logHistory[logHistory.length - 1].timestamp))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function LogLine({ log, searchQuery }: { log: LogEntry; searchQuery: string }) {
  const typeColors: Record<string, string> = {
    message: "text-foreground",
    action: "text-primary italic",
    join: "text-green-500",
    part: "text-orange-400",
    quit: "text-red-400",
    notice: "text-yellow-400",
    system: "text-muted-foreground italic",
  }

  const highlightMatch = (text: string) => {
    if (!searchQuery) return text
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-primary/30 px-0.5 text-primary-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="group flex items-start gap-2 rounded px-2 py-0.5 font-mono text-xs leading-relaxed hover:bg-muted/50">
      <span className="shrink-0 text-[10px] text-muted-foreground/60">{formatTimeOnly(new Date(log.timestamp))}</span>
      <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0 text-[9px] text-muted-foreground">
        {log.channelName}
      </span>
      {log.type === "action" ? (
        <span className={cn("min-w-0 break-words", typeColors[log.type])}>
          * {log.nickname} {highlightMatch(log.content)}
        </span>
      ) : log.type === "system" ? (
        <span className={cn("min-w-0 break-words", typeColors[log.type])}>
          -- {highlightMatch(log.content)}
        </span>
      ) : (
        <>
          <span className="shrink-0 font-medium text-accent">
            {'<'}{log.nickname}{'>'}
          </span>
          <span className={cn("min-w-0 break-words", typeColors[log.type] || "text-foreground")}>
            {highlightMatch(log.content)}
          </span>
        </>
      )}
    </div>
  )
}
