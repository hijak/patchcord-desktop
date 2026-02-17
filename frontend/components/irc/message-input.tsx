"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useIRCStore } from "@/lib/store"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { isLiveBuild } from "@/lib/build-mode"
import { sendNativeRaw } from "@/lib/irc-native"
import { ColorPicker } from "./color-picker"

const IRC_COMMANDS = [
  { cmd: "/join", desc: "Join a channel", usage: "/join #channel" },
  { cmd: "/part", desc: "Leave current channel", usage: "/part [message]" },
  { cmd: "/nick", desc: "Change nickname", usage: "/nick newnick" },
  { cmd: "/msg", desc: "Send private message", usage: "/msg nick message" },
  { cmd: "/me", desc: "Action message", usage: "/me does something" },
  { cmd: "/topic", desc: "View/set channel topic", usage: "/topic [new topic]" },
  { cmd: "/kick", desc: "Kick a user", usage: "/kick nick [reason]" },
  { cmd: "/ban", desc: "Ban a user", usage: "/ban nick" },
  { cmd: "/mode", desc: "Set channel mode", usage: "/mode +/-flags" },
  { cmd: "/whois", desc: "Look up a user", usage: "/whois nick" },
  { cmd: "/query", desc: "Open DM with user", usage: "/query nick" },
  { cmd: "/away", desc: "Mark yourself away", usage: "/away [message]" },
  { cmd: "/back", desc: "Remove away status", usage: "/back" },
  { cmd: "/ignore", desc: "Ignore a user", usage: "/ignore nick" },
  { cmd: "/unignore", desc: "Unignore a user", usage: "/unignore nick" },
  { cmd: "/list", desc: "List channels", usage: "/list [pattern]" },
  { cmd: "/ctcp", desc: "Send CTCP request", usage: "/ctcp nick VERSION|TIME|PING" },
  { cmd: "/quit", desc: "Disconnect from server", usage: "/quit [message]" },
  { cmd: "/connect", desc: "Connect to server", usage: "/connect" },
  { cmd: "/disconnect", desc: "Disconnect from server", usage: "/disconnect" },
  { cmd: "/clear", desc: "Clear message buffer", usage: "/clear" },
]

export function MessageInput() {
  const [value, setValue] = useState("")
  const [showCommands, setShowCommands] = useState(false)
  const [commandFilter, setCommandFilter] = useState("")
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const [tabCompleteIndex, setTabCompleteIndex] = useState(-1)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeView = useIRCStore((s) => s.activeView)
  const servers = useIRCStore((s) => s.servers)
  const sendMessage = useIRCStore((s) => s.sendMessage)
  const addServerMessage = useIRCStore((s) => s.addServerMessage)
  const joinChannel = useIRCStore((s) => s.joinChannel)
  const partChannel = useIRCStore((s) => s.partChannel)
  const setChannelTopic = useIRCStore((s) => s.setChannelTopic)
  const addSystemMessage = useIRCStore((s) => s.addSystemMessage)
  const connectServer = useIRCStore((s) => s.connectServer)
  const disconnectServer = useIRCStore((s) => s.disconnectServer)
  const addToCommandHistory = useIRCStore((s) => s.addToCommandHistory)
  const commandHistory = useIRCStore((s) => s.commandHistory)
  const changeNick = useIRCStore((s) => s.changeNick)
  const setAway = useIRCStore((s) => s.setAway)
  const setBack = useIRCStore((s) => s.setBack)
  const ignoreUser = useIRCStore((s) => s.ignoreUser)
  const unignoreUser = useIRCStore((s) => s.unignoreUser)
  const kickUser = useIRCStore((s) => s.kickUser)
  const setChannelMode = useIRCStore((s) => s.setChannelMode)
  const openDM = useIRCStore((s) => s.openDM)

  const server = servers.find((s) => s.id === activeView.serverId)
  const isServerConsole = !activeView.channelId
  const channel = isServerConsole ? null : server?.channels.find((c) => c.id === activeView.channelId)

  const filteredCommands = IRC_COMMANDS.filter((c) =>
    c.cmd.startsWith(commandFilter.toLowerCase())
  )

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommands(true)
      setCommandFilter(value)
      setSelectedCommandIndex(0)
    } else {
      setShowCommands(false)
    }
  }, [value])

  const handleCommand = useCallback(
    (input: string) => {
      const parts = input.trim().split(" ")
      const rawCmd = parts[0].toLowerCase()
      let cmd = rawCmd
      let serviceNick: string | null = null

      // Common IRC-style short aliases
      switch (cmd) {
        case "/j":
          cmd = "/join"
          break
        case "/p":
        case "/leave":
          cmd = "/part"
          break
        case "/n":
          cmd = "/nick"
          break
        case "/t":
          cmd = "/topic"
          break
        case "/m":
          cmd = "/msg"
          break
        case "/q":
          cmd = "/query"
          break
        case "/w":
          cmd = "/whois"
          break
        case "/a":
          cmd = "/away"
          break
        case "/r":
          cmd = "/back"
          break
        case "/k":
          cmd = "/kick"
          break
        case "/b":
          cmd = "/ban"
          break
        case "/l":
          cmd = "/list"
          break
      }

      // Services shortcuts: /nickserv, /chanserv, /operserv, /memoserv, /hostserv
      switch (rawCmd) {
        case "/nickserv":
          cmd = "/msg"
          serviceNick = "NickServ"
          break
        case "/chanserv":
          cmd = "/msg"
          serviceNick = "ChanServ"
          break
        case "/operserv":
          cmd = "/msg"
          serviceNick = "OperServ"
          break
        case "/memoserv":
          cmd = "/msg"
          serviceNick = "MemoServ"
          break
        case "/hostserv":
          cmd = "/msg"
          serviceNick = "HostServ"
          break
      }

      switch (cmd) {
        case "/join": {
          const channelName = parts[1]
          if (channelName) {
            joinChannel(activeView.serverId, channelName.startsWith("#") ? channelName : `#${channelName}`)
          }
          break
        }
        case "/part": {
          if (channel) {
            partChannel(activeView.serverId, channel.id)
          }
          break
        }
        case "/nick": {
          const newNick = parts[1]
          if (newNick) {
            changeNick(activeView.serverId, newNick)
          }
          break
        }
        case "/topic": {
          const topic = parts.slice(1).join(" ")
          if (topic && channel) {
            setChannelTopic(activeView.serverId, channel.id, topic)
            addSystemMessage(activeView.serverId, activeView.channelId, `Topic changed to: ${topic}`)
          }
          break
        }
        case "/me": {
          const actionMsg = parts.slice(1).join(" ")
          if (actionMsg) {
            sendMessage(activeView.serverId, activeView.channelId, `/me ${actionMsg}`)
          }
          break
        }
        case "/msg": {
          const nick = serviceNick || parts[1]
          const msg = parts.slice(2).join(" ")
          if (nick && msg) {
            if (isLiveBuild && server) {
              void sendNativeRaw(server.id, `PRIVMSG ${nick} :${msg}`).catch(() => {})
            }
            addSystemMessage(activeView.serverId, activeView.channelId, `-> ${nick}: ${msg}`)
          }
          break
        }
        case "/connect": {
          connectServer(activeView.serverId)
          break
        }
        case "/disconnect": {
          disconnectServer(activeView.serverId)
          break
        }
        case "/clear": {
          addSystemMessage(activeView.serverId, activeView.channelId, "Buffer cleared")
          break
        }
        case "/whois": {
          const target = parts[1]
          if (target) {
            if (isLiveBuild && server) {
              void sendNativeRaw(server.id, `WHOIS ${target}`).catch(() => {})
              addSystemMessage(activeView.serverId, activeView.channelId, `WHOIS request sent for ${target}`)
            } else {
              const targetUser = channel?.users.find((u) => u.nickname === target)
              addSystemMessage(activeView.serverId, activeView.channelId, `[${target}] is ~${targetUser?.username || target}@${targetUser?.hostmask || `user/${target}`} (${targetUser?.realName || target})`)
              if (targetUser?.isAway) {
                addSystemMessage(activeView.serverId, activeView.channelId, `[${target}] is away`)
              }
              addSystemMessage(activeView.serverId, activeView.channelId, `[${target}] idle: ${Math.floor(Math.random() * 60)} minutes`)
              addSystemMessage(activeView.serverId, activeView.channelId, `[${target}] End of /WHOIS`)
            }
          }
          break
        }
        case "/query": {
          const nick = parts[1]
          if (nick) {
            openDM(activeView.serverId, nick)
          }
          break
        }
        case "/away": {
          const msg = parts.slice(1).join(" ") || "Away"
          setAway(activeView.serverId, msg)
          if (activeView.channelId) {
            addSystemMessage(activeView.serverId, activeView.channelId, `You have been marked as away: ${msg}`)
          }
          break
        }
        case "/back": {
          setBack(activeView.serverId)
          if (activeView.channelId) {
            addSystemMessage(activeView.serverId, activeView.channelId, "You are no longer marked as away")
          }
          break
        }
        case "/kick": {
          const target = parts[1]
          const reason = parts.slice(2).join(" ")
          if (target && channel) {
            kickUser(activeView.serverId, channel.id, target, reason || undefined)
          }
          break
        }
        case "/ban": {
          const target = parts[1]
          if (target && channel) {
            if (isLiveBuild && server) {
              const channelName = channel.name
              // Simple hostmask ban; users can refine manually.
              void sendNativeRaw(server.id, `MODE ${channelName} +b ${target}!*@*`).catch(() => {})
            }
            addSystemMessage(activeView.serverId, activeView.channelId, `${target} has been banned from ${channel.name}`)
          }
          break
        }
        case "/mode": {
          const mode = parts.slice(1).join(" ")
          if (mode && channel) {
            setChannelMode(activeView.serverId, channel.id, mode)
          }
          break
        }
        case "/ignore": {
          const target = parts[1]
          if (target) {
            ignoreUser(target)
            addSystemMessage(activeView.serverId, activeView.channelId, `${target} has been added to your ignore list`)
          } else {
            const list = useIRCStore.getState().settings.ignoreList || []
            if (list.length > 0) {
              addSystemMessage(activeView.serverId, activeView.channelId, `Ignore list: ${list.join(", ")}`)
            } else {
              addSystemMessage(activeView.serverId, activeView.channelId, "Ignore list is empty")
            }
          }
          break
        }
        case "/unignore": {
          const target = parts[1]
          if (target) {
            unignoreUser(target)
            addSystemMessage(activeView.serverId, activeView.channelId, `${target} has been removed from your ignore list`)
          }
          break
        }
        case "/list": {
          const pattern = parts[1] || ""
          if (isLiveBuild && server) {
            const arg = pattern ? ` ${pattern}` : ""
            void sendNativeRaw(server.id, `LIST${arg}`).catch(() => {})
            addSystemMessage(activeView.serverId, activeView.channelId || "", `Requested channel list${pattern ? ` for "${pattern}"` : ""}`)
          } else {
            // Simulated list in demo mode
            const serverObj = servers.find((s) => s.id === activeView.serverId)
            if (serverObj) {
              addSystemMessage(activeView.serverId, activeView.channelId || "", "--- Channel List ---")
              const mockChannels = [
                { name: "#general", users: 342, topic: "General programming discussion" },
                { name: "#rust", users: 128, topic: "Rust programming language" },
                { name: "#javascript", users: 891, topic: "JavaScript & TypeScript" },
                { name: "#python", users: 567, topic: "Python discussion" },
                { name: "#linux", users: 445, topic: "Linux discussion" },
                { name: "#devops", users: 234, topic: "DevOps & SRE" },
                { name: "#security", users: 189, topic: "InfoSec discussion" },
                { name: "#vim", users: 156, topic: "Vim & Neovim" },
                { name: "#emacs", users: 98, topic: "GNU Emacs" },
                { name: "#haskell", users: 76, topic: "Haskell programming" },
              ].filter((ch) => !pattern || ch.name.includes(pattern))

              mockChannels.forEach((ch) => {
                addSystemMessage(activeView.serverId, activeView.channelId || "", `${ch.name} (${ch.users} users) - ${ch.topic}`)
              })
              addSystemMessage(activeView.serverId, activeView.channelId || "", `--- End of /LIST (${mockChannels.length} channels) ---`)
            }
          }
          break
        }
        case "/ctcp": {
          const target = parts[1]
          const type = parts[2]?.toUpperCase()
          if (target && type) {
            addSystemMessage(activeView.serverId, activeView.channelId, `CTCP ${type} request sent to ${target}`)
            if (isLiveBuild && server) {
              const payload = `\x01${type}${parts.slice(3).length ? " " + parts.slice(3).join(" ") : ""}\x01`
              void sendNativeRaw(server.id, `PRIVMSG ${target} :${payload}`).catch(() => {})
            } else {
              // Simulate CTCP reply in demo mode
              setTimeout(() => {
                const replies: Record<string, string> = {
                  "VERSION": `${target} VERSION Patchcord IRC Client v1.0 (Web)`,
                  "TIME": `${target} TIME ${new Date().toLocaleString()}`,
                  "PING": `${target} PING ${Date.now() - Math.floor(Math.random() * 200)}ms`,
                }
                const reply = replies[type] || `${target} ${type} (unknown CTCP)`
                addSystemMessage(activeView.serverId, activeView.channelId, `CTCP reply from ${reply}`)
              }, 500 + Math.random() * 1000)
            }
          } else {
            addSystemMessage(activeView.serverId, activeView.channelId, "Usage: /ctcp <nick> <VERSION|TIME|PING>")
          }
          break
        }
        case "/oper": {
          const operUser = parts[1]
          const operPass = parts[2]
          if (!operUser || !operPass) {
            addSystemMessage(activeView.serverId, activeView.channelId, "Usage: /oper <user> <password>")
          } else {
            if (isLiveBuild && server) {
              void sendNativeRaw(server.id, `OPER ${operUser} ${operPass}`).catch(() => {})
            }
            addSystemMessage(activeView.serverId, activeView.channelId, `OPER command sent for ${operUser}`)
          }
          break
        }
        default:
          addSystemMessage(activeView.serverId, activeView.channelId, `Unknown command: ${cmd}`)
      }
    },
    [activeView, channel, servers, joinChannel, partChannel, setChannelTopic, sendMessage, addSystemMessage, connectServer, disconnectServer, changeNick, setAway, setBack, ignoreUser, unignoreUser, kickUser, setChannelMode, openDM]
  )

  const handleSubmit = useCallback(() => {
    if (!value.trim()) return

    addToCommandHistory(value)

    if (value.startsWith("/")) {
      handleCommand(value)
    } else if (isServerConsole) {
      addServerMessage(activeView.serverId, `> ${value}`)
    } else {
      sendMessage(activeView.serverId, activeView.channelId, value)
    }

    setValue("")
    setShowCommands(false)
  }, [value, activeView, isServerConsole, sendMessage, addServerMessage, handleCommand, addToCommandHistory])

  const handleTabComplete = useCallback(() => {
    if (!channel) return
    const words = value.split(" ")
    const lastWord = words[words.length - 1].toLowerCase()
    if (!lastWord) return

    const matchingNicks = channel.users
      .map((u) => u.nickname)
      .filter((n) => n.toLowerCase().startsWith(lastWord))

    if (matchingNicks.length === 0) return

    const nextIndex = (tabCompleteIndex + 1) % matchingNicks.length
    setTabCompleteIndex(nextIndex)
    words[words.length - 1] = matchingNicks[nextIndex] + (words.length === 1 ? ": " : " ")
    setValue(words.join(" "))
  }, [value, channel, tabCompleteIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault()
      if (showCommands && filteredCommands.length > 0) {
        setValue(filteredCommands[selectedCommandIndex].cmd + " ")
        setShowCommands(false)
      } else {
        handleTabComplete()
      }
      return
    }

    if (e.key === "Enter") {
      if (showCommands && filteredCommands.length > 0) {
        setValue(filteredCommands[selectedCommandIndex].cmd + " ")
        setShowCommands(false)
      } else {
        handleSubmit()
      }
      return
    }

    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedCommandIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedCommandIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Escape") {
        setShowCommands(false)
      }
      return
    }

    if (e.key === "ArrowUp" && !value) {
      const lastCmd = commandHistory[commandHistory.length - 1]
      if (lastCmd) setValue(lastCmd)
    }

    setTabCompleteIndex(-1)
  }

  return (
    <div className="relative border-t bg-card">
      {/* Command palette */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 z-20 border-t bg-popover shadow-lg">
          <div className="max-h-52 overflow-y-auto p-1 scrollbar-thin">
            {filteredCommands.map((cmd, i) => (
              <button
                key={cmd.cmd}
                onClick={() => {
                  setValue(cmd.cmd + " ")
                  setShowCommands(false)
                  inputRef.current?.focus()
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded px-3 py-1.5 text-left",
                  i === selectedCommandIndex ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <span className="font-mono text-xs font-bold text-primary">{cmd.cmd}</span>
                <span className="flex-1 text-xs text-muted-foreground">{cmd.desc}</span>
                <span className="font-mono text-[10px] text-muted-foreground/60">{cmd.usage}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Away indicator */}
      {server?.awayMessage && (
        <div className="border-b bg-yellow-500/5 px-3 py-1 font-mono text-[10px] text-yellow-500">
          Away: {server.awayMessage} - type /back to return
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setSelectionStart(e.target.selectionStart || 0)
              setSelectionEnd(e.target.selectionEnd || 0)
            }}
            onSelect={(e) => {
              setSelectionStart(e.currentTarget.selectionStart || 0)
              setSelectionEnd(e.currentTarget.selectionEnd || 0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={isServerConsole ? `Command on ${server?.name || "server"}... (e.g. /join #channel)` : channel ? `Message ${channel.name}...` : "Select a channel"}
            disabled={!channel && !isServerConsole}
            className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
        {!isServerConsole && (
          <ColorPicker
            onInsert={(newText) => {
              setValue(newText)
              // Restore cursor position after insertion
              setTimeout(() => {
                const input = inputRef.current
                if (input) {
                  // Calculate new cursor position
                  const oldLength = value.length
                  const newLength = newText.length
                  const diff = newLength - oldLength
                  const newPos = Math.min(selectionStart + diff, newText.length)
                  input.setSelectionRange(newPos, newPos)
                  input.focus()
                  setSelectionStart(newPos)
                  setSelectionEnd(newPos)
                }
              }, 0)
            }}
            currentText={value}
            selectionStart={selectionStart}
            selectionEnd={selectionEnd}
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || (!channel && !isServerConsole)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="sr-only">Send message</span>
        </button>
      </div>
    </div>
  )
}
