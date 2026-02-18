# 🚀 Patchcord Desktop

> A modern, developer-focused IRC client built with Next.js and Tauri

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/hijak/patchcord-desktop/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/hijak/patchcord-desktop/release-prod.yml?branch=main)](https://github.com/hijak/patchcord-desktop/actions)

## ✨ Features

- 🛡️ **Secure Storage** - Passwords stored in system keychain (Keyring/Credentials Manager)
- 📡 **IRCv3 Support** - Modern capabilities (`message-tags`, `server-time`, `batch`, `invite-notify`, `echo-message`)
- 🎨 **Beautiful UI** - Clean, modern interface with dark/light themes
- ⚡ **Fast & Lightweight** - Built on Next.js with native desktop performance via Tauri
- 🔔 **Smart Notifications** - Tab flash and desktop notifications for mentions
- 🎯 **Developer Focused** - Keyboard shortcuts, raw IRC logging, and command palette
- 🌈 **Customizable Themes** - 20+ terminal-inspired color themes
- 📱 **Responsive Design** - Works on desktop and mobile browsers
- 🔌 **Native Desktop App** - Cross-platform desktop builds for Windows, macOS, and Linux
- 📜 **Message History** - Persistent log history across sessions
- 👥 **User List** - Real-time channel member tracking with status indicators
- 🔍 **Search** - Quick channel and message search functionality

## 📦 Installation

### Desktop Application

Download the latest release for your platform from the [Releases page](https://github.com/hijak/patchcord-desktop/releases):

| Platform | Package |
|----------|---------|
| Windows | `.msi` or `.exe` |
| macOS | `.dmg` or `.app` |
| Linux | `.deb`, `.rpm`, or `.AppImage` |

### From Source

```bash
# Clone the repository
git clone https://github.com/hijak/patchcord-desktop.git
cd patchcord-desktop

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Build and run desktop app
pnpm tauri:dev    # Development
pnpm tauri:build  # Production build
```

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 8+
- [Rust](https://www.rust-lang.org/tools/install) (for desktop builds)

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle sidebar |
| `Alt+U` | Toggle user list |
| `Ctrl+F` | Open search |
| `Ctrl+,` | Open settings |
| `Escape` | Close modals/panels |

## 🎨 Available Themes

Patchcord includes 20+ terminal-inspired color themes:

- **Classic Terminal**: Monokai, Dracula, Nord, Gruvbox, One Dark
- **Light Themes**: GitHub Light, Solarized Light
- **Dark Themes**: GitHub Dark, Tokyo Night, Catppuccin, Everforest
- **Retro**: Amber, Green, CGA, IBM PC

Configure your theme in Settings → Appearance.

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── irc/              # IRC-specific components
│   │   ├── irc-client.tsx
│   │   ├── server-sidebar.tsx
│   │   ├── channel-header.tsx
│   │   ├── message-area.tsx
│   │   ├── message-input.tsx
│   │   └── user-list.tsx
│   ├── ui/               # Reusable UI components
│   └── theme-provider.tsx
├── lib/                  # Utilities and stores
│   ├── store.ts          # Zustand state management
│   ├── irc-native.ts     # Native IRC bridge
│   └── themes.ts         # Color themes
├── hooks/                # Custom React hooks
├── src-tauri/            # Tauri desktop app
│   ├── src/
│   │   └── main.rs
│   ├── icons/
│   └── Cargo.toml
└── public/               # Static assets
```

## 🛠️ Technology Stack

- **Frontend Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Desktop Runtime**: [Tauri v2](https://tauri.app/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Code Highlighting**: [Shiki](https://shiki.style/)

## 📖 Documentation

Full documentation is available at [patchcord.github.io](https://patchcord.github.io)

- [Getting Started](docs/getting-started.md)
- [Configuration](docs/configuration.md)
- [IRC Commands](docs/commands.md)
- [Themes](docs/themes.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Tauri](https://tauri.app/) for the amazing desktop framework
- [Next.js](https://nextjs.org/) team for the excellent framework
- All IRC protocol contributors and RFC authors

## 📞 Support

- 📧 Email: support@patchcord.dev
- 💬 IRC: #patchcord on Libera.Chat
- 🐛 Issues: [GitHub Issues](https://github.com/hijak/patchcord-desktop/issues)

---

<p align="center">
  <strong>Built with ❤️ for the IRC community</strong>
</p>
