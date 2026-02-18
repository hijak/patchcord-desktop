---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started

This guide will help you get up and running with Patchcord.

## Installation

### Desktop Application

#### Windows

1. Download the `.msi` or `.exe` installer from [Releases](https://github.com/patchcord/patchcord/releases)
2. Run the installer and follow the prompts
3. Launch Patchcord from the Start Menu

#### macOS

1. Download the `.dmg` file from [Releases](https://github.com/patchcord/patchcord/releases)
2. Open the DMG and drag Patchcord to Applications
3. Launch from Applications folder

> **Note**: On first launch, you may need to right-click and select "Open" to bypass Gatekeeper.

#### Linux

**Debian/Ubuntu:**
```bash
sudo dpkg -i patchcord_*.deb
```

**Fedora/RHEL:**
```bash
sudo dnf install patchcord_*.rpm
```

**AppImage (Universal):**
```bash
chmod +x patchcord_*.AppImage
./patchcord_*.AppImage
```

## First Connection

### Adding a Server

1. Click the **+** button in the server sidebar
2. Fill in the server details:
   - **Name**: Display name for the server
   - **Host**: IRC server hostname (e.g., `irc.libera.chat`)
   - **Port**: Server port (default: 6667, SSL: 6697)
   - **SSL/TLS**: Enable for secure connection
   - **Nickname**: Your IRC nickname
   - **Username**: IRC username
   - **Real Name**: Your real name or description

3. Click **Connect**

### Auto-Join Channels

You can configure channels to automatically join when connecting:

1. In the server configuration, add channels to **Auto-Join Channels**
2. Separate multiple channels with commas (e.g., `#linux,#programming`)

## Basic Usage

### Navigating Channels

- Click on a channel in the sidebar to switch to it
- Use `Ctrl+Tab` to cycle through channels
- Use `Ctrl+K` to quickly join a channel

### Sending Messages

1. Type your message in the input area at the bottom
2. Press `Enter` to send
3. Use `/me <action>` for action messages

### User List

- View channel members in the right sidebar
- Click on a user to start a direct message
- User prefixes indicate status:
  - `@` - Operator
  - `+` - Voiced

## Settings

Access settings with `Ctrl+,` or by clicking the gear icon.

### Appearance

- **Theme**: Choose from 20+ color themes
- **Font**: Adjust UI and message fonts
- **Sidebar Width**: Resize the server sidebar
- **User List Width**: Resize the user list panel

### Notifications

- **Desktop Notifications**: Enable/disable push notifications
- **Tab Flash**: Flash window title on mentions
- **Sound**: Play sound on mentions

### Advanced

- **Raw Log**: View raw IRC protocol messages
- **Timestamp Format**: Customize message timestamps
- **Ignore List**: Manage ignored users

## Next Steps

- [Configuration Guide]({% link configuration.md %}) - Detailed settings
- [IRC Commands]({% link commands.md %}) - Available commands
- [Themes]({% link themes.md %}) - Theme gallery
