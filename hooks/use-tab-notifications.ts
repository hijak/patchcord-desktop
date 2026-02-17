"use client"

import { useEffect, useRef } from "react"
import { useIRCStore } from "@/lib/store"

const BASE_TITLE = "Patchcord"

export function useTabNotifications() {
  const servers = useIRCStore((s) => s.servers)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const defaultFaviconRef = useRef<string>("")

  useEffect(() => {
    // Save default favicon
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) {
      defaultFaviconRef.current = link.href
    }

    // Create canvas for badge rendering
    canvasRef.current = document.createElement("canvas")
    canvasRef.current.width = 32
    canvasRef.current.height = 32
  }, [])

  useEffect(() => {
    // Calculate total unread counts
    let totalUnread = 0
    let totalMentions = 0

    servers.forEach((server) => {
      server.channels.forEach((channel) => {
        totalUnread += channel.unreadCount
        totalMentions += channel.mentionCount
      })
    })

    // Update document title
    if (totalMentions > 0) {
      document.title = `(${totalMentions}) ${BASE_TITLE}`
    } else if (totalUnread > 0) {
      document.title = `[${totalUnread}] ${BASE_TITLE}`
    } else {
      document.title = BASE_TITLE
    }

    // Update favicon with badge
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw base favicon
    const img = new Image()
    img.crossOrigin = "anonymous"

    const drawBadge = () => {
      ctx.clearRect(0, 0, 32, 32)

      // Draw base P icon
      ctx.fillStyle = "#22c55e"
      ctx.beginPath()
      ctx.roundRect(0, 0, 32, 32, 6)
      ctx.fill()

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 20px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("P", 16, 17)

      if (totalMentions > 0 || totalUnread > 0) {
        // Draw notification badge
        const count = totalMentions || totalUnread
        const badgeColor = totalMentions > 0 ? "#ef4444" : "#f59e0b"
        const text = count > 99 ? "99+" : String(count)

        ctx.fillStyle = badgeColor
        const badgeWidth = text.length > 2 ? 20 : text.length > 1 ? 16 : 12
        ctx.beginPath()
        ctx.arc(32 - badgeWidth / 2, badgeWidth / 2, badgeWidth / 2 + 1, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#ffffff"
        ctx.font = `bold ${text.length > 2 ? 8 : 10}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(text, 32 - badgeWidth / 2, badgeWidth / 2 + 1)
      }

      // Apply to favicon
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (link) {
        link.href = canvas.toDataURL("image/png")
      } else {
        const newLink = document.createElement("link")
        newLink.rel = "icon"
        newLink.href = canvas.toDataURL("image/png")
        document.head.appendChild(newLink)
      }
    }

    drawBadge()
  }, [servers])
}
