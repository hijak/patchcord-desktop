---
layout: default
title: Troubleshooting
nav_order: 6
---

# Troubleshooting

Common issues and their solutions.

## Connection Issues

### Cannot Connect to Server

**Symptoms:** Connection times out or fails immediately.

**Solutions:**

1. **Check server address and port**
   ```
   Common ports:
   - 6667: Standard IRC
   - 6697: SSL/TLS IRC
   - 7000: Alternative SSL
   ```

2. **Verify SSL/TLS settings**
   - Enable SSL for port 6697
   - Disable SSL for port 6667
   - Try "Allow Invalid Certs" for self-signed certificates

3. **Check firewall settings**
   - Ensure outbound connections on IRC ports are allowed
   - Try disabling firewall temporarily to test

4. **Test with different server**
   - Try connecting to `irc.libera.chat` to verify client works

### Connection Drops Frequently

**Symptoms:** Regular disconnections after successful connection.

**Solutions:**

1. **Enable Auto-Reconnect**
   - Settings → Connection → Auto-Reconnect

2. **Adjust Reconnect Delay**
   - Increase delay to 30-60 seconds
   - Prevents rate limiting

3. **Check network stability**
   - Test internet connection
   - Try different network if possible

4. **Disable SSL temporarily**
   - Test if SSL handshake is causing issues

### SASL Authentication Fails

**Symptoms:** "SASL authentication failed" error.

**Solutions:**

1. **Verify credentials**
   - Double-check username and password
   - Use app-specific password if required

2. **Check authentication mechanism**
   - Try PLAIN mechanism
   - Some servers require EXTERNAL

3. **Register with NickServ first**
   ```
   /msg NickServ IDENTIFY username password
   ```

4. **Wait before joining channels**
   - Add delay in auto-join commands

## Display Issues

### Messages Not Appearing

**Symptoms:** Can send messages but don't see them or responses.

**Solutions:**

1. **Check channel focus**
   - Ensure correct channel is selected

2. **Verify connection status**
   - Look for green indicator in sidebar
   - Reconnect if disconnected

3. **Clear message buffer**
   ```
   /clear
   ```

4. **Check ignore list**
   - Settings → Privacy → Ignore List

### Theme Not Applying

**Symptoms:** Theme selection doesn't change appearance.

**Solutions:**

1. **Restart application**
   - Close and reopen Patchcord

2. **Clear cache**
   - Delete theme cache file
   - Restart application

3. **Reset settings**
   - Settings → Advanced → Reset All Settings

4. **Check for updates**
   - Download latest version

### Font Rendering Issues

**Symptoms:** Text appears blurry or incorrectly sized.

**Solutions:**

1. **Adjust font settings**
   - Settings → Appearance → Font Size
   - Try 14px or 16px for better readability

2. **Toggle system fonts**
   - Enable/disable "Use System UI Font"
   - Enable/disable "Use System Mono Font"

3. **Check display scaling**
   - Windows: Settings → Display → Scale
   - Try 100% or 125% scaling

## Performance Issues

### High Memory Usage

**Symptoms:** Application uses excessive RAM.

**Solutions:**

1. **Clear message history**
   - Settings → Advanced → Clear History

2. **Reduce log retention**
   - Settings → Advanced → Max Log Messages

3. **Limit open channels**
   - Part unused channels
   - Close unused server connections

4. **Disable raw logging**
   - Settings → Advanced → Raw Log Panel

### Slow Response Time

**Symptoms:** Laggy interface or delayed messages.

**Solutions:**

1. **Check network latency**
   ```
   /ping
   ```

2. **Reduce visual effects**
   - Disable animations in settings
   - Use simpler theme

3. **Close unused servers**
   - Disconnect from inactive servers

4. **Update graphics drivers**
   - Ensure latest GPU drivers installed

## Notification Issues

### Notifications Not Showing

**Symptoms:** No desktop notifications on mentions.

**Solutions:**

1. **Enable notifications**
   - Settings → Notifications → Enable Notifications

2. **Check system permissions**
   - **Windows**: Settings → System → Notifications
   - **macOS**: System Preferences → Notifications
   - **Linux**: Check notification daemon

3. **Configure highlights**
   - Settings → Notifications → Highlight Keywords
   - Add your nickname

4. **Test notification**
   - Use test button in settings

### Tab Flash Not Working

**Symptoms:** Window doesn't flash on mentions.

**Solutions:**

1. **Enable tab flash**
   - Settings → Notifications → Flash Taskbar

2. **Check window focus**
   - Tab flash only works when window is inactive

3. **Restart application**
   - Close and reopen

## Desktop App Issues

### Application Won't Start

**Symptoms:** App crashes on launch or doesn't open.

**Solutions:**

1. **Check system requirements**
   - Windows 10+, macOS 11+, or modern Linux
   - 4GB RAM minimum

2. **Reinstall application**
   - Uninstall completely
   - Download fresh installer
   - Reinstall

3. **Check for conflicting software**
   - Antivirus may block
   - Add to exceptions list

4. **Run as administrator (Windows)**
   - Right-click → Run as Administrator

### Update Fails

**Symptoms:** Update download or installation fails.

**Solutions:**

1. **Manual update**
   - Download latest from GitHub Releases
   - Install manually

2. **Clear update cache**
   - Delete update folder
   - Retry update

3. **Check disk space**
   - Ensure sufficient free space
   - At least 500MB recommended

## Platform-Specific Issues

### Windows

#### App blocked by SmartScreen
**Solution:** Click "More info" → "Run anyway"

#### Taskbar icon issues
**Solution:** Right-click taskbar → Taskbar settings → Reset

### macOS

#### "App is damaged" error
**Solution:**
```bash
xattr -cr /Applications/Patchcord.app
```

#### Permission denied errors
**Solution:**
1. System Preferences → Security & Privacy
2. Grant Full Disk Access

### Linux

#### Missing dependencies
**Solution:**
```bash
# Ubuntu/Debian
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

#### AppImage won't run
**Solution:**
```bash
chmod +x Patchcord.AppImage
./Patchcord.AppImage
```

#### System tray icon missing
**Solution:**
- Install libappindicator
- Enable extensions for GNOME

## Debug Mode

Enable debug logging for troubleshooting:

1. Open settings
2. Go to Advanced
3. Enable "Debug Mode"
4. Reproduce the issue
5. Check logs in:
   - **Windows**: `%APPDATA%\dev.patchcord.desktop\logs\`
   - **macOS**: `~/Library/Logs/dev.patchcord.desktop/`
   - **Linux**: `~/.config/dev.patchcord.desktop/logs/`

## Getting Help

If your issue isn't listed here:

1. **Check existing issues**
   - [GitHub Issues](https://github.com/patchcord/patchcord/issues)

2. **Create new issue**
   - Include OS version
   - Patchcord version
   - Steps to reproduce
   - Screenshots if applicable

3. **Join IRC channel**
   - #patchcord on Libera.Chat
   - Real-time support from community

4. **Email support**
   - support@patchcord.dev

## Previous Steps

- [Commands]({% link commands.md %}) - IRC command reference
- [Configuration]({% link configuration.md %}) - Settings guide
- [Themes]({% link themes.md %}) - Theme gallery
