"use client"

import { useState, useEffect, useCallback } from "react"
import { useIRCStore } from "@/lib/store"
import { ServerSidebar } from "./server-sidebar"
import { CollapsedSidebar } from "./collapsed-sidebar"
import { ChannelHeader } from "./channel-header"
import { MessageArea } from "./message-area"
import { MessageInput } from "./message-input"
import { UserList } from "./user-list"
import { CollapsedUserList } from "./collapsed-user-list"
import { SettingsPanel } from "./settings-panel"
import { ServerModal } from "./add-server-modal"
import { RawLogPanel } from "./raw-log-panel"
import { LogViewer } from "./log-viewer"
import { ResizeHandle } from "./resize-handle"
import { applyColorTheme, applyFontPreferences } from "@/lib/store"
import { useTabNotifications } from "@/hooks/use-tab-notifications"
import { cn } from "@/lib/utils"

const SIDEBAR_COLLAPSED_WIDTH = 48
const USERLIST_COLLAPSED_WIDTH = 40

export function IRCClient() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useTabNotifications()

  const sidebarOpen = useIRCStore((s) => s.sidebarOpen)
  const setSidebarOpen = useIRCStore((s) => s.setSidebarOpen)
  const sidebarWidth = useIRCStore((s) => s.sidebarWidth)
  const setSidebarWidth = useIRCStore((s) => s.setSidebarWidth)
  const sidebarCollapsed = useIRCStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useIRCStore((s) => s.setSidebarCollapsed)
  const userListOpen = useIRCStore((s) => s.userListOpen)
  const setUserListOpen = useIRCStore((s) => s.setUserListOpen)
  const userListWidth = useIRCStore((s) => s.userListWidth)
  const setUserListWidth = useIRCStore((s) => s.setUserListWidth)
  const userListCollapsed = useIRCStore((s) => s.userListCollapsed)
  const setUserListCollapsed = useIRCStore((s) => s.setUserListCollapsed)
  const setSearchOpen = useIRCStore((s) => s.setSearchOpen)
  const setSettingsOpen = useIRCStore((s) => s.setSettingsOpen)
  const rawLogOpen = useIRCStore((s) => s.rawLogOpen)
  const colorTheme = useIRCStore((s) => s.settings.colorTheme)
  const settings = useIRCStore((s) => s.settings)
  const initNativeBridge = useIRCStore((s) => s.initNativeBridge)

  const servers = useIRCStore((s) => s.servers)
  const connectServer = useIRCStore((s) => s.connectServer)
  const [serverModalOpen, setServerModalOpen] = useState(false)
  const [editingServerId, setEditingServerId] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const editingServer = editingServerId ? servers.find((s) => s.id === editingServerId) || null : null
  const activeView = useIRCStore((s) => s.activeView)
  const isServerConsole = !activeView.channelId

  const handleAddServer = () => {
    setEditingServerId(null)
    setServerModalOpen(true)
  }

  const handleEditServer = (serverId: string) => {
    setEditingServerId(serverId)
    setServerModalOpen(true)
  }

  const handleServerModalClose = (open: boolean) => {
    setServerModalOpen(open)
    if (!open) setEditingServerId(null)
  }

  const handleSidebarResize = useCallback(
    (delta: number) => {
      setSidebarWidth(sidebarWidth + delta)
    },
    [sidebarWidth, setSidebarWidth]
  )

  const handleSidebarDoubleClick = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed)
  }, [sidebarCollapsed, setSidebarCollapsed])

  const handleUserListResize = useCallback(
    (delta: number) => {
      setUserListWidth(userListWidth + delta)
    },
    [userListWidth, setUserListWidth]
  )

  const handleUserListDoubleClick = useCallback(() => {
    setUserListCollapsed(!userListCollapsed)
  }, [userListCollapsed, setUserListCollapsed])

  // Apply color theme on mount and when theme changes
  useEffect(() => {
    applyColorTheme(colorTheme)
  }, [colorTheme])

  // Apply font preferences on mount (updateSettings already handles changes)
  useEffect(() => {
    if (mounted) {
      applyFontPreferences(settings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]) // Only run once when mounted

  useEffect(() => {
    initNativeBridge()
  }, [initNativeBridge])

  // Auto-connect servers that have autoConnect enabled on startup
  useEffect(() => {
    if (!mounted) return
    const serversToConnect = servers.filter(
      (s) => s.autoConnect && s.status === 'disconnected'
    )
    serversToConnect.forEach((s) => connectServer(s.id))
    // Only run once when the component first mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  useEffect(() => {
    let wasMobile = window.innerWidth < 768
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-hide sidebars when entering mobile (or on first load at mobile width)
      if (mobile && !wasMobile) {
        setSidebarOpen(false)
        setUserListOpen(false)
      }
      if (mobile) {
        setSidebarCollapsed(false)
        setUserListCollapsed(false)
      }
      wasMobile = mobile
    }
    // On first load: also close if already mobile
    if (wasMobile) {
      setSidebarOpen(false)
      setUserListOpen(false)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [setSidebarOpen, setUserListOpen, setSidebarCollapsed, setUserListCollapsed])

  // Keyboard shortcuts
  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl+B - Toggle sidebar
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault()
        if (isMobile) {
          setSidebarOpen(!sidebarOpen)
        } else {
          // Cycle: full -> collapsed -> hidden -> full
          if (sidebarOpen && !sidebarCollapsed) {
            setSidebarCollapsed(true)
          } else if (sidebarOpen && sidebarCollapsed) {
            setSidebarOpen(false)
            setSidebarCollapsed(false)
          } else {
            setSidebarOpen(true)
            setSidebarCollapsed(false)
          }
        }
      }
      // Alt+U - Toggle user list
      if (e.altKey && e.key === "u") {
        e.preventDefault()
        if (userListOpen && !userListCollapsed) {
          setUserListCollapsed(true)
        } else if (userListOpen && userListCollapsed) {
          setUserListOpen(false)
          setUserListCollapsed(false)
        } else {
          setUserListOpen(true)
          setUserListCollapsed(false)
        }
      }
      // Ctrl+F - Toggle search
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault()
        setSearchOpen(true)
      }
      // Ctrl+, - Open settings
      if (e.ctrlKey && e.key === ",") {
        e.preventDefault()
        setSettingsOpen(true)
      }
      // Escape - close settings/search
      if (e.key === "Escape") {
        setSettingsOpen(false)
        setSearchOpen(false)
      }
    },
    [sidebarOpen, sidebarCollapsed, userListOpen, userListCollapsed, isMobile,
     setSidebarOpen, setSidebarCollapsed, setUserListOpen, setUserListCollapsed, setSearchOpen, setSettingsOpen]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [handleKeyboard])

  // Prevent hydration mismatch - store reads from localStorage on client
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="font-mono text-lg font-bold text-primary-foreground">P</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground animate-pulse">Loading Patchcord...</p>
        </div>
      </div>
    )
  }

  // Compute actual sidebar width for desktop
  const effectiveSidebarWidth = !sidebarOpen
    ? 0
    : sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : sidebarWidth

  const effectiveUserListWidth = !userListOpen
    ? 0
    : userListCollapsed
    ? USERLIST_COLLAPSED_WIDTH
    : userListWidth

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Server Sidebar */}
      {isMobile ? (
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 flex h-full w-60 shrink-0 flex-col border-r transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ServerSidebar onAddServer={handleAddServer} onEditServer={handleEditServer} />
        </aside>
      ) : sidebarOpen ? (
        <>
          <aside
            className="z-20 flex h-full shrink-0 flex-col border-r"
            style={{ width: effectiveSidebarWidth }}
          >
            {sidebarCollapsed ? (
              <CollapsedSidebar onAddServer={handleAddServer} />
            ) : (
              <ServerSidebar onAddServer={handleAddServer} onEditServer={handleEditServer} />
            )}
          </aside>
          {!sidebarCollapsed && (
            <ResizeHandle
              side="left"
              onResize={handleSidebarResize}
              onDoubleClick={handleSidebarDoubleClick}
            />
          )}
        </>
      ) : null}

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ChannelHeader />

        <div className="flex min-h-0 flex-1">
          {/* Message area */}
          <div className="flex min-w-0 flex-1 flex-col">
            <MessageArea />
            {rawLogOpen && <RawLogPanel />}
            <MessageInput />
          </div>

          {/* User list - desktop inline, hidden in server console mode */}
          {userListOpen && !isMobile && !isServerConsole && (
            <>
              {!userListCollapsed && (
                <ResizeHandle
                  side="right"
                  onResize={handleUserListResize}
                  onDoubleClick={handleUserListDoubleClick}
                />
              )}
              <aside
                className="shrink-0 border-l"
                style={{ width: effectiveUserListWidth }}
              >
                {userListCollapsed ? (
                  <CollapsedUserList />
                ) : (
                  <UserList />
                )}
              </aside>
            </>
          )}
        </div>
      </div>

      {/* Mobile user list overlay */}
      {userListOpen && isMobile && !isServerConsole && (
        <>
          <div
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setUserListOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z-40 flex h-full w-64 flex-col border-l bg-card md:hidden"
          >
            <UserList />
          </aside>
        </>
      )}

      {/* Settings overlay */}
      <SettingsPanel onEditServer={handleEditServer} />

      {/* Server modal (add/edit) */}
      <ServerModal open={serverModalOpen} onOpenChange={handleServerModalClose} editServer={editingServer} />

      {/* Log viewer */}
      <LogViewer />
    </div>
  )
}
