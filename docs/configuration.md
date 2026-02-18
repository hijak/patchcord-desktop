---
layout: default
title: Configuration
nav_order: 3
---

# Configuration

Customize Patchcord to match your workflow.

## Accessing Settings

Open settings using one of these methods:
- Press `Ctrl+,` (or `Cmd+,` on macOS)
- Click the gear icon in the bottom-left corner

## Appearance Settings

### Color Theme

Choose from 20+ terminal-inspired themes:

#### Dark Themes
| Theme | Description |
|-------|-------------|
| Monokai | Classic vibrant theme |
| Dracula | Dark purple tones |
| Nord | Arctic blue palette |
| Gruvbox | Retro terminal colors |
| One Dark | Atom editor default |
| GitHub Dark | GitHub's dark theme |
| Tokyo Night | Modern purple-blue |
| Catppuccin | Pastel purple theme |
| Everforest | Nature-inspired greens |

#### Light Themes
| Theme | Description |
|-------|-------------|
| GitHub Light | GitHub's light theme |
| Solarized Light | Classic light palette |
| One Light | Bright Atom theme |

#### Retro Themes
| Theme | Description |
|-------|-------------|
| Amber | Monochrome amber terminal |
| Green | Classic phosphor green |
| CGA | 4-color CGA palette |
| IBM PC | Original PC colors |

### Fonts

Configure font preferences:

- **UI Font**: Use system UI font or default
- **Mono Font**: Use system monospace font for code
- **Font Size**: Adjust text size (12px - 20px)

### Layout

- **Sidebar Position**: Left or right
- **Sidebar Width**: 200px - 400px
- **User List Width**: 150px - 300px
- **Compact Mode**: Reduce padding for more content

## Connection Settings

### Server Configuration

Edit server settings:

1. Right-click server in sidebar
2. Select **Edit Server**
3. Modify connection parameters

> **Note**: Server passwords and SASL credentials are stored securely in your operating system's keychain, not in plain text configuration files.

#### Advanced Server Options

| Option | Description |
|--------|-------------|
| **SSL/TLS** | Enable encrypted connection |
| **Allow Invalid Certs** | Accept self-signed certificates |
| **Auto-Reconnect** | Automatically reconnect on disconnect |
| **Reconnect Delay** | Seconds between reconnection attempts |

### SASL Authentication

Configure SASL for authenticated connections:

1. Enable **SASL Authentication**
2. Enter your SASL username
3. Enter your SASL password (or app password)
4. Select authentication mechanism (PLAIN recommended)

### Proxy Settings

Configure proxy for connections:

- **Type**: SOCKS5, HTTP, or HTTPS
- **Host**: Proxy server hostname
- **Port**: Proxy server port
- **Username/Password**: Optional authentication

## Notification Settings

### Desktop Notifications

- **Enable Notifications**: Show desktop notifications
- **Show in Taskbar**: Flash taskbar icon
- **Notification Sound**: Play sound on mention
- **Preview Message**: Show message preview

### Highlight Settings

Configure what triggers notifications:

- **Nickname**: Your current nickname
- **Custom Keywords**: Comma-separated list
- **Direct Messages**: Always notify on DMs
- **All Messages**: Notify on every message

## Privacy Settings

### Visibility

- **Away Messages**: Send away messages when idle
- **Idle Timeout**: Minutes before marking as away
- **Custom Away Message**: Your away status text

### Ignore List

Manage ignored users:

1. Go to Settings → Privacy
2. Add nicknames to ignore list
3. Ignored users' messages won't be displayed

## Advanced Settings

### Raw Logging

Enable raw IRC protocol logging:

- Toggle **Raw Log Panel** in settings
- View with `Ctrl+L` or Settings → Raw Log
- Useful for debugging connection issues

### Timestamp Format

Customize message timestamps:

- **Format**: Choose date/time format
- **Show Seconds**: Include seconds in timestamps
- **24-Hour Format**: Use 24-hour time

### Message Display

- **Show Join/Part Messages**: Display user join/part events
- **Show Nick Changes**: Display nickname changes
- **Compact Nicknames**: Show nicknames in brackets
- **Timestamp Alignment**: Left or right aligned

### Message Context Menu

Right-click on any message to access quick actions:

- **Copy selection**: Copy the currently highlighted text
- **Copy entire message**: Copy the full message content
- **Quote user**: Insert `@username` into the input box
- **Quote text**: Insert `> username: message` into the input box
- **Whois user**: Perform a `/whois` on the user
- **DM user**: Open a direct message query with the user

> **Note**: In the Server Console, context menu options are optimized for debugging (Copy/Paste only).

## Keyboard Shortcuts

Customize keyboard shortcuts:

| Action | Default |
|--------|---------|
| Toggle Sidebar | `Ctrl+B` |
| Toggle User List | `Alt+U` |
| Open Search | `Ctrl+F` |
| Open Settings | `Ctrl+,` |
| Close Panel | `Escape` |
| Send Message | `Enter` |
| New Line | `Shift+Enter` |

## Reset Settings

Reset all settings to defaults:

1. Go to Settings → Advanced
2. Click **Reset All Settings**
3. Confirm the action

> **Warning**: This will erase all customizations and server configurations.

## Configuration Files

Settings are stored in:

- **Windows**: `%APPDATA%\dev.patchcord.desktop\settings.json`
- **macOS**: `~/Library/Application Support/dev.patchcord.desktop/settings.json`
- **Linux**: `~/.config/dev.patchcord.desktop/settings.json`

## Next Steps

- [IRC Commands]({% link commands.md %}) - Available IRC commands
- [Themes]({% link themes.md %}) - Theme gallery and customization
- [Troubleshooting]({% link troubleshooting.md %}) - Common issues
