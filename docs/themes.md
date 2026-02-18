---
layout: default
title: Themes
nav_order: 5
---

# Themes

Patchcord includes 20+ terminal-inspired color themes to customize your experience.

## Available Themes

### Dark Themes

#### Monokai
A vibrant, colorful theme inspired by the Sublime Text default.

![Monokai Preview](assets/themes/monokai.png)

**Colors:**
- Background: `#272822`
- Foreground: `#F8F8F2`
- Primary: `#A6E22E`
- Secondary: `#66D9EF`

---

#### Dracula
A dark theme with purple tones, easy on the eyes.

**Colors:**
- Background: `#282A36`
- Foreground: `#F8F8F2`
- Primary: `#FF79C6`
- Secondary: `#8BE9FD`

---

#### Nord
An arctic, north-bluish clean and elegant theme.

**Colors:**
- Background: `#2E3440`
- Foreground: `#D8DEE9`
- Primary: `#88C0D0`
- Secondary: `#81A1C1`

---

#### Gruvbox Dark
A retro groove theme with warm colors.

**Colors:**
- Background: `#282828`
- Foreground: `#EBDBB2`
- Primary: `#98971A`
- Secondary: `#D79921`

---

#### One Dark
The default theme from the Atom editor.

**Colors:**
- Background: `#282C34`
- Foreground: `#ABB2BF`
- Primary: `#61AFEF`
- Secondary: `#C678DD`

---

#### GitHub Dark
GitHub's official dark theme.

**Colors:**
- Background: `#0D1117`
- Foreground: `#C9D1D9`
- Primary: `#58A6FF`
- Secondary: `#BC8CFF`

---

#### Tokyo Night
A clean, dark theme with purple-blue tones.

**Colors:**
- Background: `#1A1B26`
- Foreground: `#A9B1D6`
- Primary: `#7AA2F7`
- Secondary: `#BB9AF7`

---

#### Catppuccin
A pastel purple theme from the Catppuccin project.

**Colors:**
- Background: `#1E1E2E`
- Foreground: `#CDD6F4`
- Primary: `#89B4FA`
- Secondary: `#CBA6F7`

---

#### Everforest
A nature-inspired theme with warm greens.

**Colors:**
- Background: `#2D353B`
- Foreground: `#D3C6AA`
- Primary: `#A7C080`
- Secondary: `#DBBC7F`

---

#### Material Dark
Google's Material Design dark theme.

**Colors:**
- Background: `#263238`
- Foreground: `#EEFFFF`
- Primary: `#82AAFF`
- Secondary: `#C792EA`

---

### Light Themes

#### GitHub Light
GitHub's official light theme.

**Colors:**
- Background: `#FFFFFF`
- Foreground: `#24292F`
- Primary: `#0969DA`
- Secondary: `#8250DF`

---

#### Solarized Light
A carefully tuned light palette.

**Colors:**
- Background: `#FDF6E3`
- Foreground: `#657B83`
- Primary: `#268BD2`
- Secondary: `#6C71C4`

---

#### One Light
The light variant of the One theme.

**Colors:**
- Background: `#FAFAFA`
- Foreground: `#383A42`
- Primary: `#4078F2`
- Secondary: `#A626A4`

---

#### Gruvbox Light
The light variant of Gruvbox.

**Colors:**
- Background: `#FBF1C7`
- Foreground: `#3C3836`
- Primary: `#98971A`
- Secondary: `#D79921`

---

### Retro Themes

#### Amber
Classic monochrome amber terminal.

**Colors:**
- Background: `#1A1005`
- Foreground: `#FFB000`

---

#### Green
Classic phosphor green terminal.

**Colors:**
- Background: `#0A1A0A`
- Foreground: `#00FF00`

---

#### CGA
4-color CGA palette.

**Colors:**
- Background: `#000000`
- Foreground: `#FF5555`, `#55FF55`, `#FFFF55`, `#5555FF`

---

#### IBM PC
Original IBM PC colors.

**Colors:**
- Background: `#0000AA`
- Foreground: `#AAAAAA`

---

## Changing Themes

### Via Settings Panel

1. Press `Ctrl+,` to open settings
2. Navigate to **Appearance**
3. Select a theme from the dropdown
4. Preview updates instantly

### Via Command

Use the `/theme` command:

```
/theme monokai
/theme dracula
/theme nord
```

### Via Keyboard Shortcut

Cycle through themes with a custom shortcut (configure in settings).

## Custom Themes

Create custom themes by modifying the theme configuration file:

**Location:**
- **Windows**: `%APPDATA%\dev.patchcord.desktop\themes\custom.json`
- **macOS**: `~/Library/Application Support/dev.patchcord.desktop/themes/custom.json`
- **Linux**: `~/.config/dev.patchcord.desktop/themes/custom.json`

**Example Custom Theme:**
```json
{
  "id": "my-custom-theme",
  "name": "My Custom Theme",
  "isDark": true,
  "colors": {
    "background": "#1A1A2E",
    "foreground": "#EAEAEA",
    "primary": "#E94560",
    "secondary": "#0F3460",
    "muted": "#888888",
    "accent": "#E94560",
    "border": "#333333"
  }
}
```

## Theme Recommendations

### For Daytime Use
- GitHub Light
- Solarized Light
- One Light

### For Nighttime Use
- Nord
- Dracula
- Catppuccin
- Tokyo Night

### For Low Light
- Gruvbox Dark
- Everforest
- Material Dark

### For Retro Feel
- Amber
- Green
- IBM PC

## Accessibility

### High Contrast
For better visibility, try:
- GitHub Dark (high contrast)
- Solarized Light
- Monokai

### Color Blindness Friendly
- Nord (blue-yellow friendly)
- Gruvbox (red-green friendly)
- One Dark (general friendly)

## Next Steps

- [Configuration]({% link configuration.md %}) - More appearance settings
- [Commands]({% link commands.md %}) - IRC commands
- [Troubleshooting]({% link troubleshooting.md %}) - Common issues
