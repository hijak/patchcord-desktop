"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ResizeHandleProps {
  side: "left" | "right"
  onResize: (delta: number) => void
  onDoubleClick?: () => void
}

export function ResizeHandle({ side, onResize, onDoubleClick }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startX.current = e.clientX
    },
    []
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current
      startX.current = e.clientX
      // If handle is on the right edge of a left panel, positive delta = wider
      // If handle is on the left edge of a right panel, positive delta = narrower
      onResize(side === "left" ? delta : -delta)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging, onResize, side])

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} panel`}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          onResize(side === "left" ? -10 : 10)
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          onResize(side === "left" ? 10 : -10)
        }
      }}
      className={cn(
        "group relative z-10 flex w-1 shrink-0 cursor-col-resize items-center justify-center transition-colors",
        "hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:outline-none",
        isDragging && "bg-primary/30"
      )}
    >
      {/* Visible drag indicator on hover */}
      <div
        className={cn(
          "absolute h-8 w-1 rounded-full bg-muted-foreground/0 transition-colors",
          "group-hover:bg-muted-foreground/30",
          isDragging && "bg-primary/50"
        )}
      />
    </div>
  )
}
