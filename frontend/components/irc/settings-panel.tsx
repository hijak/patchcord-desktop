"use client"

import { useState, useRef } from "react"
import { useIRCStore } from "@/lib/store"
import { useTheme } from "next-themes"
import { X, Palette, Server, Bell, MessageCircle, User, Keyboard, Wrench, Download, Trash2, History, Check, Pencil, Terminal } from "lucide-react"
import { terminalThemes } from "@/lib/themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const ACCENT_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
]

const KEYBIND_ACTIONS: { id: string; label: string }[] = [
  { id: "toggle-sidebar", label: "Toggle sidebar" },
  { id: "toggle-userlist", label: "Toggle user list" },
  { id: "open-settings", label: "Open settings" },
  { id: "search", label: "Search" },
  { id: "next-channel", label: "Next channel" },
  { id: "prev-channel", label: "Previous channel" },
  { id: "server-1", label: "Switch to server 1" },
  { id: "server-2", label: "Switch to server 2" },
  { id: "server-3", label: "Switch to server 3" },
  { id: "server-4", label: "Switch to server 4" },
  { id: "server-5", label: "Switch to server 5" },
  { id: "server-6", label: "Switch to server 6" },
  { id: "server-7", label: "Switch to server 7" },
  { id: "server-8", label: "Switch to server 8" },
  { id: "server-9", label: "Switch to server 9" },
]

export function SettingsPanel({ onEditServer }: { onEditServer?: (serverId: string) => void }) {
  const settingsOpen = useIRCStore((s) => s.settingsOpen)
  const setSettingsOpen = useIRCStore((s) => s.setSettingsOpen)
  const settings = useIRCStore((s) => s.settings)
  const updateSettings = useIRCStore((s) => s.updateSettings)
  const servers = useIRCStore((s) => s.servers)
  const removeServer = useIRCStore((s) => s.removeServer)
  const rawLogOpen = useIRCStore((s) => s.rawLogOpen)
  const setRawLogOpen = useIRCStore((s) => s.setRawLogOpen)
  const rawLogMessages = useIRCStore((s) => s.rawLogMessages)
  const applyColorTheme = useIRCStore((s) => s.applyColorTheme)
  const setLogViewerOpen = useIRCStore((s) => s.setLogViewerOpen)
  const logHistory = useIRCStore((s) => s.logHistory)
  const { setTheme } = useTheme()

  const [highlightInput, setHighlightInput] = useState("")
  const [fallbackInput, setFallbackInput] = useState("")
  const [newKeyAction, setNewKeyAction] = useState("")
  const [newKeyValue, setNewKeyValue] = useState("")

  if (!settingsOpen) return null

  const handleThemeChange = (value: string) => {
    updateSettings({ theme: value as "dark" | "light" | "system" })
    setTheme(value)
  }

  const handleExportServers = () => {
    const data = servers.map((s) => ({
      name: s.name,
      host: s.host,
      port: s.port,
      ssl: s.ssl,
      nickname: s.nickname,
      username: s.username,
      realName: s.realName,
      autoJoinChannels: s.autoJoinChannels,
      saslEnabled: s.saslEnabled,
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "patchcord-servers.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-mono text-sm font-bold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSettingsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="appearance" className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Tab list */}
          <TabsList className="flex h-auto w-full flex-row justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0 md:w-48 md:flex-col md:border-b-0 md:border-r md:p-2">
            {[
              { value: "appearance", icon: Palette, label: "Appearance" },
              { value: "servers", icon: Server, label: "Servers" },
              { value: "notifications", icon: Bell, label: "Notifications" },
              { value: "chat", icon: MessageCircle, label: "Chat" },
              { value: "identity", icon: User, label: "Identity" },
              { value: "keybindings", icon: Keyboard, label: "Keybindings" },
              { value: "advanced", icon: Wrench, label: "Advanced" },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex items-center justify-start gap-2 rounded-none border-b-2 border-transparent px-3 py-2 font-mono text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent md:w-full md:rounded md:border-b-0 md:data-[state=active]:bg-muted"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab content */}
          <ScrollArea className="flex-1 scrollbar-thin">
            <div className="p-4">
              {/* Appearance */}
              <TabsContent value="appearance" className="mt-0 space-y-6">
                <Section title="Color Theme">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {terminalThemes.map((theme) => {
                      const isActive = settings.colorTheme === theme.id
                      return (
                        <button
                          key={theme.id}
                          onClick={() => {
                            applyColorTheme(theme.id)
                            setTheme(theme.isDark ? "dark" : "light")
                          }}
                          className={cn(
                            "group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all hover:scale-[1.02]",
                            isActive
                              ? "border-primary shadow-md shadow-primary/20"
                              : "border-transparent hover:border-muted-foreground/30"
                          )}
                        >
                          {/* Theme preview swatches */}
                          <div className="flex h-8" style={{ backgroundColor: theme.colors.background }}>
                            {theme.swatches.map((color, i) => (
                              <div
                                key={i}
                                className="flex-1"
                                style={{ backgroundColor: color, opacity: i === 0 ? 1 : 0.85 }}
                              />
                            ))}
                          </div>
                          {/* Code preview strip */}
                          <div
                            className="flex items-center gap-1 px-2 py-1"
                            style={{ backgroundColor: theme.colors.codeBackground }}
                          >
                            <span className="font-mono text-[8px]" style={{ color: theme.colors.primary }}>
                              {'const'}
                            </span>
                            <span className="font-mono text-[8px]" style={{ color: theme.colors.foreground }}>
                              {'x'}
                            </span>
                            <span className="font-mono text-[8px]" style={{ color: theme.colors.accent }}>
                              {'='}
                            </span>
                            <span className="font-mono text-[8px]" style={{ color: theme.colors.primary }}>
                              {'42'}
                            </span>
                          </div>
                          {/* Label */}
                          <div
                            className="flex items-center justify-between px-2 py-1.5"
                            style={{ backgroundColor: theme.colors.card }}
                          >
                            <div className="text-left">
                              <p className="font-mono text-[10px] font-medium" style={{ color: theme.colors.foreground }}>
                                {theme.name}
                              </p>
                              <p className="font-mono text-[8px]" style={{ color: theme.colors.mutedForeground }}>
                                {theme.isDark ? "Dark" : "Light"}
                              </p>
                            </div>
                            {isActive && (
                              <div className="flex h-4 w-4 items-center justify-center rounded-full" style={{ backgroundColor: theme.colors.primary }}>
                                <Check className="h-2.5 w-2.5" style={{ color: theme.colors.primaryForeground }} />
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Font Size">
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([v]) => updateSettings({ fontSize: v })}
                      min={10}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-8 text-right font-mono text-xs text-muted-foreground">{settings.fontSize}px</span>
                  </div>
                </Section>

                <Section title="Message Density">
                  <Select value={settings.messageDensity} onValueChange={(v) => updateSettings({ messageDensity: v as any })}>
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="cozy">Cozy</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </Section>

                <Section title="Timestamp Format">
                  <Select value={settings.timestampFormat} onValueChange={(v) => updateSettings({ timestampFormat: v as any })}>
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24-hour</SelectItem>
                      <SelectItem value="12h">12-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </Section>

                <ToggleRow
                  label="Show Join/Part/Quit Messages"
                  checked={settings.showJoinPartQuit}
                  onChange={(v) => updateSettings({ showJoinPartQuit: v })}
                />

                <Section title="Accent Color">
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSettings({ accentColor: color })}
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                          settings.accentColor === color ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </Section>

                <Section title="Fonts">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="font-mono text-[11px] text-foreground">UI font</Label>
                      <Select
                        value={settings.uiFontPreset}
                        onValueChange={(v) => updateSettings({ uiFontPreset: v as any })}
                      >
                        <SelectTrigger className="font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (theme)</SelectItem>
                          <SelectItem value="system">System UI</SelectItem>
                          <SelectItem value="inter">Inter</SelectItem>
                          <SelectItem value="sf-pro">SF Pro (macOS)</SelectItem>
                          <SelectItem value="segoe-ui">Segoe UI (Windows)</SelectItem>
                          <SelectItem value="roboto">Roboto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="font-mono text-[11px] text-foreground">Terminal / monospace font</Label>
                      <Select
                        value={settings.monoFontPreset}
                        onValueChange={(v) => updateSettings({ monoFontPreset: v as any })}
                      >
                        <SelectTrigger className="font-mono text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default (theme)</SelectItem>
                          <SelectItem value="system">System monospace</SelectItem>
                          <SelectItem value="hack">Hack</SelectItem>
                          <SelectItem value="fira-code">Fira Code</SelectItem>
                          <SelectItem value="jetbrains-mono">JetBrains Mono</SelectItem>
                          <SelectItem value="source-code-pro">Source Code Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Section>
              </TabsContent>

              {/* Servers */}
              <TabsContent value="servers" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">Saved Servers</h3>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 font-mono text-[10px]" onClick={handleExportServers}>
                      <Download className="mr-1 h-3 w-3" />
                      Export
                    </Button>
                  </div>
                </div>
                {servers.map((server) => (
                  <div key={server.id} className="rounded border">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-medium text-foreground">{server.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {server.host}:{server.port} {server.ssl ? "(SSL)" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (onEditServer) {
                              setSettingsOpen(false)
                              onEditServer(server.id)
                            }
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit server</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeServer(server.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove server</span>
                        </Button>
                      </div>
                    </div>
                    {/* Show on-join commands summary if any */}
                    {server.onJoinCommands && server.onJoinCommands.length > 0 && (
                      <div className="border-t px-3 py-2">
                        <div className="flex items-center gap-1.5 pb-1">
                          <Terminal className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {server.onJoinCommands.length} on-join command{server.onJoinCommands.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {server.onJoinCommands.slice(0, 3).map((cmd, i) => (
                            <p key={i} className="truncate font-mono text-[10px] text-muted-foreground/70">
                              {cmd.includes("IDENTIFY") || cmd.includes("password") || cmd.includes("GHOST")
                                ? cmd.replace(/(\S+)$/, "********")
                                : cmd}
                            </p>
                          ))}
                          {server.onJoinCommands.length > 3 && (
                            <p className="font-mono text-[10px] text-muted-foreground/50">
                              +{server.onJoinCommands.length - 3} more...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* Notifications */}
              <TabsContent value="notifications" className="mt-0 space-y-4">
                <ToggleRow
                  label="Desktop Notifications"
                  checked={settings.desktopNotifications}
                  onChange={(v) => updateSettings({ desktopNotifications: v })}
                />
                <ToggleRow
                  label="Notification Sounds"
                  checked={settings.notificationSounds}
                  onChange={(v) => updateSettings({ notificationSounds: v })}
                />
                <ToggleRow
                  label="DM Notifications"
                  checked={settings.dmNotifications}
                  onChange={(v) => updateSettings({ dmNotifications: v })}
                />
                <Section title="Highlight Words">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {settings.highlightWords.map((word) => (
                      <span key={word} className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                        {word}
                        <button
                          onClick={() =>
                            updateSettings({
                              highlightWords: settings.highlightWords.filter((w) => w !== word),
                            })
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && highlightInput.trim()) {
                          updateSettings({
                            highlightWords: [...settings.highlightWords, highlightInput.trim()],
                          })
                          setHighlightInput("")
                        }
                      }}
                      placeholder="Add word..."
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 font-mono text-xs"
                      onClick={() => {
                        if (highlightInput.trim()) {
                          updateSettings({
                            highlightWords: [...settings.highlightWords, highlightInput.trim()],
                          })
                          setHighlightInput("")
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </Section>
              </TabsContent>

              {/* Chat */}
              <TabsContent value="chat" className="mt-0 space-y-4">
                <Section title="Max Scrollback Lines">
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.maxScrollbackLines]}
                      onValueChange={([v]) => updateSettings({ maxScrollbackLines: v })}
                      min={500}
                      max={50000}
                      step={500}
                      className="flex-1"
                    />
                    <span className="w-12 text-right font-mono text-xs text-muted-foreground">{settings.maxScrollbackLines}</span>
                  </div>
                </Section>
                <ToggleRow
                  label="Inline Image Previews"
                  checked={settings.inlineImagePreviews}
                  onChange={(v) => updateSettings({ inlineImagePreviews: v })}
                />
                <ToggleRow
                  label="Link Previews"
                  checked={settings.linkPreviews}
                  onChange={(v) => updateSettings({ linkPreviews: v })}
                />
                <ToggleRow
                  label="Syntax Highlighting"
                  checked={settings.syntaxHighlighting}
                  onChange={(v) => updateSettings({ syntaxHighlighting: v })}
                />
                <ToggleRow
                  label="IRC Colors (mIRC)"
                  checked={settings.ircColors}
                  onChange={(v) => updateSettings({ ircColors: v })}
                />
                <ToggleRow
                  label="Show Operator Symbols in Chat"
                  checked={settings.showStatusPrefixesInChat}
                  onChange={(v) => updateSettings({ showStatusPrefixesInChat: v })}
                />
                <Section title="Nick Color Scheme">
                  <Select value={settings.nickColorScheme} onValueChange={(v) => updateSettings({ nickColorScheme: v as any })}>
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="pastel">Pastel</SelectItem>
                      <SelectItem value="vivid">Vivid</SelectItem>
                    </SelectContent>
                  </Select>
                </Section>
              </TabsContent>

              {/* Identity */}
              <TabsContent value="identity" className="mt-0 space-y-4">
                <Section title="Avatar image (local file or URL)">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                      {settings.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.avatarUrl}
                          alt="avatar preview"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-mono text-sm text-primary">
                          {settings.defaultNickname.slice(0, 2).toUpperCase() || "PC"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex gap-2">
                        <AvatarFilePicker
                          onDataUrl={(dataUrl) => updateSettings({ avatarUrl: dataUrl })}
                        />
                        {settings.avatarUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 font-mono text-[10px]"
                            onClick={() => updateSettings({ avatarUrl: "" })}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <Input
                        value={settings.avatarUrl ?? ""}
                        onChange={(e) => updateSettings({ avatarUrl: e.target.value })}
                        placeholder="Or paste image URL (PNG/JPG/GIF)"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </Section>
                <Section title="Default Nickname">
                  <Input
                    value={settings.defaultNickname}
                    onChange={(e) => updateSettings({ defaultNickname: e.target.value })}
                    className="font-mono text-xs"
                  />
                </Section>
                <Section title="Fallback Nicknames">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {settings.fallbackNicknames.map((nick) => (
                      <span key={nick} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
                        {nick}
                        <button
                          onClick={() =>
                            updateSettings({
                              fallbackNicknames: settings.fallbackNicknames.filter((n) => n !== nick),
                            })
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={fallbackInput}
                      onChange={(e) => setFallbackInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && fallbackInput.trim()) {
                          updateSettings({
                            fallbackNicknames: [...settings.fallbackNicknames, fallbackInput.trim()],
                          })
                          setFallbackInput("")
                        }
                      }}
                      placeholder="Add fallback..."
                      className="font-mono text-xs"
                    />
                  </div>
                </Section>
                <Section title="Username">
                  <Input
                    value={settings.defaultUsername}
                    onChange={(e) => updateSettings({ defaultUsername: e.target.value })}
                    className="font-mono text-xs"
                  />
                </Section>
                <Section title="Real Name">
                  <Input
                    value={settings.defaultRealName}
                    onChange={(e) => updateSettings({ defaultRealName: e.target.value })}
                    className="font-mono text-xs"
                  />
                </Section>
                <Section title="Quit Message">
                  <Input
                    value={settings.quitMessage}
                    onChange={(e) => updateSettings({ quitMessage: e.target.value })}
                    className="font-mono text-xs"
                  />
                </Section>
                <Section title="Ignore List">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(settings.ignoreList || []).map((nick) => (
                      <span key={nick} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground">
                        {nick}
                        <button
                          onClick={() =>
                            updateSettings({
                              ignoreList: (settings.ignoreList || []).filter((n) => n !== nick),
                            })
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    {(!settings.ignoreList || settings.ignoreList.length === 0) && (
                      <span className="font-mono text-[10px] text-muted-foreground italic">No users ignored</span>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">Use /ignore username to add, or click a nickname and select Ignore.</p>
                </Section>
              </TabsContent>

              {/* Keybindings */}
              <TabsContent value="keybindings" className="mt-0 space-y-4">
                <Section title="Existing Keybindings">
                  <p className="mb-2 font-mono text-[11px] text-muted-foreground">
                    Click a keybinding value to edit it.
                  </p>
                  <div className="space-y-1.5">
                    {Object.entries(settings.keybindings).map(([action, key]) => (
                      <div key={action} className="flex items-center justify-between rounded border px-3 py-2">
                        <span className="font-mono text-xs text-foreground">
                          {action.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <Input
                          value={key}
                          onChange={(e) =>
                            updateSettings({
                              keybindings: {
                                ...settings.keybindings,
                                [action]: e.target.value,
                              },
                            })
                          }
                          className="w-32 font-mono text-[11px]"
                        />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Add Keybinding">
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={newKeyAction}
                      onValueChange={(v) => setNewKeyAction(v)}
                    >
                      <SelectTrigger className="flex-1 min-w-[140px] font-mono text-[11px]">
                        <SelectValue placeholder="Choose action" />
                      </SelectTrigger>
                      <SelectContent>
                        {KEYBIND_ACTIONS.map((action) => (
                          <SelectItem key={action.id} value={action.id}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Shortcut (e.g. Alt+J)"
                      className="w-32 font-mono text-[11px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 font-mono text-[11px]"
                      onClick={() => {
                        const action = newKeyAction.trim()
                        const key = newKeyValue.trim()
                        if (!action || !key) return
                        updateSettings({
                          keybindings: {
                            ...settings.keybindings,
                            [action]: key,
                          },
                        })
                        setNewKeyAction("")
                        setNewKeyValue("")
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    These bindings are stored in your settings and can be consumed by future shortcuts.
                  </p>
                </Section>
              </TabsContent>

              {/* Advanced */}
              <TabsContent value="advanced" className="mt-0 space-y-4">
                <ToggleRow
                  label="Auto-Reconnect"
                  checked={settings.autoReconnect}
                  onChange={(v) => updateSettings({ autoReconnect: v })}
                />
                {settings.autoReconnect && (
                  <Section title="Reconnect Delay (seconds)">
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[settings.autoReconnectDelay]}
                        onValueChange={([v]) => updateSettings({ autoReconnectDelay: v })}
                        min={1}
                        max={60}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-8 text-right font-mono text-xs text-muted-foreground">{settings.autoReconnectDelay}s</span>
                    </div>
                  </Section>
                )}
                <Section title="Encoding">
                  <Select value={settings.encoding} onValueChange={(v) => updateSettings({ encoding: v })}>
                    <SelectTrigger className="font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                      <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </Section>

                <ToggleRow
                  label="Raw IRC Log"
                  checked={rawLogOpen}
                  onChange={(v) => setRawLogOpen(v)}
                />

                <ToggleRow
                  label="Save All Logs"
                  checked={settings.saveAllLogs}
                  onChange={(v) => updateSettings({ saveAllLogs: v })}
                />
                {settings.saveAllLogs && (
                  <div className="flex items-center justify-between rounded border px-3 py-2">
                    <div>
                      <p className="font-mono text-xs text-foreground">Log History</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {logHistory.length} entries saved
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 font-mono text-[10px]"
                      onClick={() => {
                        setSettingsOpen(false)
                        setLogViewerOpen(true)
                      }}
                    >
                      <History className="h-3 w-3" />
                      View Logs
                    </Button>
                  </div>
                )}
                {rawLogOpen && (
                  <div className="rounded border bg-background">
                    <ScrollArea className="h-48">
                      <div className="p-2">
                        {rawLogMessages.map((msg, i) => (
                          <div key={i} className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                            {msg}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-xs text-muted-foreground">{title}</Label>
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded border px-3 py-2">
      <Label className="font-mono text-xs text-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function AvatarFilePicker({ onDataUrl }: { onDataUrl: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        onDataUrl(result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 font-mono text-[10px]"
        onClick={() => inputRef.current?.click()}
      >
        Browse…
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </>
  )
}
