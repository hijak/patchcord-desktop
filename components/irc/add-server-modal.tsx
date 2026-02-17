"use client"

import { useState, useEffect } from "react"
import { useIRCStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, GripVertical, Terminal } from "lucide-react"
import type { IRCServer } from "@/lib/types"

interface ServerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editServer?: IRCServer | null
}

const defaultForm = {
  name: "",
  host: "",
  port: "6697",
  ssl: true,
  allowInvalidCerts: false,
  autoConnect: true,
  nickname: "patchcord",
  username: "patchcord",
  realName: "Patchcord User",
  password: "",
  saslEnabled: false,
  saslUsername: "",
  saslPassword: "",
  autoJoinChannels: "#general",
  onJoinCommands: [] as string[],
}

export function ServerModal({ open, onOpenChange, editServer }: ServerModalProps) {
  const addServer = useIRCStore((s) => s.addServer)
  const updateServer = useIRCStore((s) => s.updateServer)
  const [form, setForm] = useState(defaultForm)
  const [newCommand, setNewCommand] = useState("")

  const isEditing = !!editServer

  // Populate form when editing
  useEffect(() => {
    if (editServer && open) {
      setForm({
        name: editServer.name,
        host: editServer.host,
        port: String(editServer.port),
        ssl: editServer.ssl,
        allowInvalidCerts: !!editServer.allowInvalidCerts,
        autoConnect: editServer.autoConnect ?? true,
        nickname: editServer.nickname,
        username: editServer.username,
        realName: editServer.realName,
        password: editServer.password || "",
        saslEnabled: editServer.saslEnabled,
        saslUsername: editServer.saslUsername || "",
        saslPassword: editServer.saslPassword || "",
        autoJoinChannels: editServer.autoJoinChannels.join(", "),
        onJoinCommands: [...(editServer.onJoinCommands || [])],
      })
    } else if (!editServer && open) {
      setForm(defaultForm)
    }
  }, [editServer, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.host) return

    const serverData = {
      name: form.name,
      host: form.host,
      port: parseInt(form.port) || 6697,
      ssl: form.ssl,
      allowInvalidCerts: form.allowInvalidCerts,
      nickname: form.nickname || "devuser",
      username: form.username || "devuser",
      realName: form.realName || "Developer User",
      password: form.password || undefined,
      saslEnabled: form.saslEnabled,
      saslUsername: form.saslEnabled ? form.saslUsername : undefined,
      saslPassword: form.saslEnabled ? form.saslPassword : undefined,
      autoJoinChannels: form.autoJoinChannels
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      onJoinCommands: form.onJoinCommands.filter((cmd) => cmd.trim().length > 0),
      autoConnect: form.autoConnect,
    }

    if (isEditing && editServer) {
      updateServer(editServer.id, serverData)
    } else {
      addServer(serverData as any)
    }

    onOpenChange(false)
    setForm(defaultForm)
    setNewCommand("")
  }

  const update = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const addCommand = () => {
    const cmd = newCommand.trim()
    if (!cmd) return
    setForm((f) => ({ ...f, onJoinCommands: [...f.onJoinCommands, cmd] }))
    setNewCommand("")
  }

  const removeCommand = (index: number) => {
    setForm((f) => ({
      ...f,
      onJoinCommands: f.onJoinCommands.filter((_, i) => i !== index),
    }))
  }

  const updateCommand = (index: number, value: string) => {
    setForm((f) => ({
      ...f,
      onJoinCommands: f.onJoinCommands.map((cmd, i) => (i === index ? value : cmd)),
    }))
  }

  const moveCommand = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= form.onJoinCommands.length) return
    setForm((f) => {
      const cmds = [...f.onJoinCommands]
      ;[cmds[index], cmds[newIndex]] = [cmds[newIndex], cmds[index]]
      return { ...f, onJoinCommands: cmds }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-3.5">
          <DialogTitle className="font-mono text-sm text-foreground">
            {isEditing ? "Edit Server" : "Add Server"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] scrollbar-thin">
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            {/* Connection */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Connection
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="font-mono text-xs text-muted-foreground">Server Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="My Server"
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="font-mono text-xs text-muted-foreground">Host</Label>
                  <Input
                    value={form.host}
                    onChange={(e) => update("host", e.target.value)}
                    placeholder="irc.example.com"
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">Port</Label>
                  <Input
                    value={form.port}
                    onChange={(e) => update("port", e.target.value)}
                    placeholder="6697"
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded border px-3 py-2">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs text-foreground">SSL/TLS</Label>
                  <Switch checked={form.ssl} onCheckedChange={(v) => update("ssl", v)} />
                </div>
                {form.ssl && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Allow invalid / self-signed certificates
                    </span>
                    <Switch
                      checked={form.allowInvalidCerts}
                      onCheckedChange={(v) => update("allowInvalidCerts", v)}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-foreground">
                    Auto-connect on startup
                  </span>
                  <Switch
                    checked={form.autoConnect}
                    onCheckedChange={(v) => update("autoConnect", v)}
                  />
                </div>
              </div>
            </fieldset>

            {/* Identity */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Identity
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">Nickname</Label>
                  <Input
                    value={form.nickname}
                    onChange={(e) => update("nickname", e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs text-muted-foreground">Username</Label>
                  <Input
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Real Name</Label>
                <Input
                  value={form.realName}
                  onChange={(e) => update("realName", e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Password (optional)</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </fieldset>

            {/* SASL */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Authentication
              </legend>
              <div className="flex items-center justify-between rounded border px-3 py-2">
                <Label className="font-mono text-xs text-foreground">SASL Authentication</Label>
                <Switch checked={form.saslEnabled} onCheckedChange={(v) => update("saslEnabled", v)} />
              </div>
              {form.saslEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-mono text-xs text-muted-foreground">SASL Username</Label>
                    <Input
                      value={form.saslUsername}
                      onChange={(e) => update("saslUsername", e.target.value)}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <Label className="font-mono text-xs text-muted-foreground">SASL Password</Label>
                    <Input
                      type="password"
                      value={form.saslPassword}
                      onChange={(e) => update("saslPassword", e.target.value)}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </fieldset>

            {/* Channels */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Channels
              </legend>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Auto-Join Channels (comma-separated)</Label>
                <Input
                  value={form.autoJoinChannels}
                  onChange={(e) => update("autoJoinChannels", e.target.value)}
                  placeholder="#general, #dev, #random"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </fieldset>

            {/* On-Join Commands */}
            <fieldset className="space-y-3">
              <legend className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                On-Join Commands
              </legend>
              <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                Commands executed automatically after connecting. They run in order, top to bottom.
                Common uses: NickServ IDENTIFY, setting user modes, joining additional channels.
              </p>

              {/* Command list */}
              {form.onJoinCommands.length > 0 && (
                <div className="space-y-1.5">
                  {form.onJoinCommands.map((cmd, i) => (
                    <div key={i} className="group flex items-center gap-1.5">
                      <span className="flex w-5 shrink-0 items-center justify-center font-mono text-[10px] text-muted-foreground">
                        {i + 1}.
                      </span>
                      <div className="flex flex-1 items-center gap-1 rounded border bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
                        <Terminal className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <input
                          value={cmd}
                          onChange={(e) => updateCommand(i, e.target.value)}
                          className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={i === 0}
                          onClick={() => moveCommand(i, -1)}
                          aria-label="Move command up"
                        >
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeCommand(i)}
                          aria-label="Remove command"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new command */}
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1 rounded border bg-background px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
                  <Terminal className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <input
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCommand()
                      }
                    }}
                    placeholder="/msg NickServ IDENTIFY user pass"
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 font-mono text-[10px]"
                  onClick={addCommand}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>

              {/* Quick-add presets */}
              {form.onJoinCommands.length === 0 && (
                <div className="space-y-1.5">
                  <p className="font-mono text-[10px] text-muted-foreground">Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "NickServ IDENTIFY", cmd: "/msg NickServ IDENTIFY <password>" },
                      { label: "Set mode +x", cmd: `/mode ${form.nickname || "nick"} +x` },
                      { label: "NickServ GHOST", cmd: `/msg NickServ GHOST ${form.nickname || "nick"} <password>` },
                      { label: "Join channel", cmd: "/join #channel" },
                      { label: "Set away", cmd: "/away Auto-away" },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            onJoinCommands: [...f.onJoinCommands, preset.cmd],
                          }))
                        }
                        className="rounded-full border px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-mono text-xs">
                Cancel
              </Button>
              <Button type="submit" className="font-mono text-xs">
                {isEditing ? "Save Changes" : "Connect"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
