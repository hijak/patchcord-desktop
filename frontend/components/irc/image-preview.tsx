"use client"

import { useState } from "react"
import { X, ExternalLink, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImagePreviewProps {
  url: string
}

export function ImagePreview({ url }: ImagePreviewProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const [expanded, setExpanded] = useState(false)

  if (errored) return null

  return (
    <>
      <span className="inline-flex flex-col gap-1">
        <span className="relative inline-block max-w-xs overflow-hidden rounded border bg-muted/30">
          {!loaded && (
            <span className="flex h-16 w-32 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </span>
          )}
          <img
            src={url}
            alt="Linked image"
            crossOrigin="anonymous"
            className={cn(
              "max-h-40 max-w-xs cursor-pointer rounded object-contain transition-opacity",
              loaded ? "opacity-100" : "h-0 opacity-0"
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            onClick={() => setExpanded(true)}
          />
          {loaded && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 [div:hover>&]:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
      </span>

      {/* Lightbox */}
      {expanded && (
        <span
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close preview</span>
          </button>
          <img
            src={url}
            alt="Expanded image"
            crossOrigin="anonymous"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </span>
      )}
    </>
  )
}
