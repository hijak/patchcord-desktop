---
layout: default
title: IRC Commands
nav_order: 4
---

# IRC Commands

Complete reference for IRC commands available in Patchcord.

## Basic Commands

### Messaging

#### `/msg` - Send Private Message
```
/msg <nickname> <message>
```
Send a private message to a user.

**Example:**
```
/msg john Hello there!
```

#### `/me` - Send Action Message
```
/me <action>
```
Send an action/emote message.

**Example:**
```
/me waves hello
```
Displays as: `* username waves hello`

#### `/notice` - Send Notice
```
/notice <target> <message>
```
Send a notice message (non-automatically replied).

**Example:**
```
/notice #channel Server maintenance in 10 minutes
```

### Channel Management

#### `/join` - Join Channel
```
/join <#channel> [key]
```
Join a channel on the current server.

**Example:**
```
/join #linux
/join #secret secretkey
```

#### `/part` - Leave Channel
```
/part [<#channel>] [reason]
```
Leave a channel with an optional reason.

**Example:**
```
/part #linux
/part #general "Back later"
```

#### `/topic` - Set Channel Topic
```
/topic [<#channel>] <topic>
```
Set or view the channel topic.

**Example:**
```
/topic Welcome to #linux - Ask your questions here!
/topic
```

#### `/kick` - Kick User
```
/kick <nickname> [reason]
```
Kick a user from the current channel.

**Example:**
```
/kick spammer Spamming is not allowed
```

#### `/ban` - Ban User
```
/ban <nickname>
```
Ban a user from the current channel.

**Example:**
```
/ban troublemaker
```

#### `/unban` - Remove Ban
```
/unban <nick|mask>
```
Remove a ban.

**Example:**
```
/unban troublemaker
/unban *!*@badhost.com
```

## User Commands

### `/nick` - Change Nickname
```
/nick <newnickname>
```
Change your nickname.

**Example:**
```
/nick CoolDev
```

### `/away` - Set Away Status
```
/away [message]
```
Set yourself as away with an optional message.

**Example:**
```
/away Lunch break, back in 30
/away
```

### `/whois` - User Information
```
/whois <nickname>
```
Get information about a user.

**Example:**
```
/whois john
```

### `/who` - Channel Users
```
/who [<#channel>]
```
List users in a channel or on the server.

**Example:**
```
/who #linux
/who
```

### `/ignore` - Ignore User
```
/ignore <nickname>
```
Ignore messages from a user.

**Example:**
```
/ignore spammer
```

### `/unignore` - Stop Ignoring
```
/unignore <nickname>
```
Stop ignoring a user.

**Example:**
```
/unignore spammer
```

## Server Commands

### `/connect` - Connect to Server
```
/connect <server> [port]
```
Connect to an IRC server.

**Example:**
```
/connect irc.libera.chat 6697
```

### `/disconnect` - Disconnect from Server
```
/disconnect [server]
```
Disconnect from the current or specified server.

**Example:**
```
/disconnect
```

### `/reconnect` - Reconnect
```
/reconnect [server]
```
Reconnect to the current or specified server.

**Example:**
```
/reconnect
```

### `/server` - Server Information
```
/server
```
Display current server information.

### `/motd` - Message of the Day
```
/motd [server]
```
Display the server's message of the day.

**Example:**
```
/motd
```

### `/list` - List Channels
```
/list [<#channel>] [max_users]
```
List channels on the server.

**Example:**
```
/list
/list #linux
/list 100
```

## Mode Commands

### `/mode` - Set Channel/User Modes
```
/mode [<target>] <modes> [parameters]
```
Set channel or user modes.

**Channel Mode Examples:**
```
/mode #channel +i          # Invite-only
/mode #channel +m          # Moderated
/mode #channel +n          # No external messages
/mode #channel +t          # Topic locked
/mode #channel +k secret   # Set channel key
/mode #channel +l 50       # Set user limit
/mode #channel -m          # Remove moderated mode
```

**User Mode Examples:**
```
/mode username +i          # Invisible
/mode username +w          # Receive wallops
/mode username -i          # Remove invisible
```

### Common Channel Modes

| Mode | Description |
|------|-------------|
| `+i` | Invite-only channel |
| `+m` | Moderated channel |
| `+n` | No external messages |
| `+t` | Topic locked to operators |
| `+k` | Channel key required |
| `+l` | User limit |
| `+s` | Secret channel |
| `+v` | Voice user |
| `+o` | Operator user |
| `+h` | Half-operator |

## Query Commands

### `/query` - Start Private Chat
```
/query <nickname>
```
Open a private chat window with a user.

**Example:**
```
/query john
```

### `/queryclose` - Close Private Chat
```
/queryclose <nickname>
```
Close a private chat window.

**Example:**
```
/queryclose john
```

## Utility Commands

### `/clear` - Clear Buffer
```
/clear [<#channel>]
```
Clear the message buffer for a channel.

**Example:**
```
/clear
/clear #linux
```

### `/help` - Show Help
```
/help [command]
```
Show help information.

**Example:**
```
/help
/help join
```

### `/version` - Client Version
```
/version
```
Display Patchcord version information.

### `/raw` - Send Raw IRC Command
```
/raw <command>
```
Send a raw IRC protocol command.

**Example:**
```
/raw PING :irc.libera.chat
/raw WHOIS john
```

> **Note**: Enable Raw Log Panel in settings to see responses.

## Patchcord-Specific Commands

### `/theme` - Change Theme
```
/theme <theme-name>
```
Change the color theme.

**Example:**
```
/theme monokai
/theme dracula
```

### `/settings` - Open Settings
```
/settings
```
Open the settings panel.

### `/log` - Toggle Log Viewer
```
/log
```
Open or close the log viewer.

### `/rawlog` - Toggle Raw Log
```
/rawlog
```
Toggle the raw IRC protocol log panel.

## Keyboard Shortcuts for Commands

| Shortcut | Command |
|----------|---------|
| `Enter` | Send message/command |
| `Shift+Enter` | New line in message |
| `Up Arrow` | Edit last message |
| `Tab` | Auto-complete nickname |
| `Ctrl+Up` | Previous message in history |
| `Ctrl+Down` | Next message in history |

## Command History

Access previous commands:
- Press `Up Arrow` to cycle through sent commands
- Press `Down Arrow` to go forward in history
- Type partial command then press `Up` to filter history

## Next Steps

- [Configuration]({% link docs/configuration.md %}) - Customize settings
- [Themes]({% link docs/themes.md %}) - Available themes
- [Troubleshooting]({% link docs/troubleshooting.md %}) - Common issues
