"use client"

import { useEffect, useState, useCallback } from "react"
import { Check, Copy } from "lucide-react"
import { useIRCStore } from "@/lib/store"
import { getThemeById } from "@/lib/themes"
import { hasIRCFormatting, parseIRCColors, getIRCColor, stripIRCFormatting } from "@/lib/irc-colors"

interface CodeBlockProps {
  code: string
  language: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const colorTheme = useIRCStore((s) => s.settings.colorTheme)
  const themeConfig = getThemeById(colorTheme)

  useEffect(() => {
    let cancelled = false
    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki")
        const result = await codeToHtml(code, {
          lang: language || "text",
          theme: themeConfig.shikiTheme,
        })
        if (!cancelled) setHtml(result)
      } catch {
        // Fallback if language not supported
        if (!cancelled) setHtml("")
      }
    }
    highlight()
    return () => { cancelled = true }
  }, [code, language, themeConfig.shikiTheme])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  const codeBg = themeConfig.colors.codeBackground
  const codeChrome = themeConfig.colors.codeChrome

  return (
    <div className="group relative my-1.5 overflow-hidden rounded border" style={{ backgroundColor: codeBg }}>
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1" style={{ backgroundColor: codeChrome }}>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {html ? (
        <div
          className="overflow-x-auto p-3 font-mono text-xs leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0 [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed" style={{ color: themeConfig.colors.foreground }}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

// Parse message content and return React elements with code blocks, inline code, links, and IRC colors
export function parseMessageContent(content: string, syntaxHighlighting: boolean, ircColors: boolean = true): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  
  // Split by code blocks first (```language\ncode\n```)
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index)
      elements.push(...parseInlineContent(textBefore, key, ircColors))
      key += 100
    }
    
    // Add code block
    const lang = match[1] || "text"
    const code = match[2].trim()
    if (syntaxHighlighting) {
      elements.push(<CodeBlock key={`cb-${key++}`} code={code} language={lang} />)
    } else {
      elements.push(
        <pre key={`cb-${key++}`} className="my-1.5 overflow-x-auto rounded border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      )
    }
    
    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < content.length) {
    elements.push(...parseInlineContent(content.slice(lastIndex), key, ircColors))
  }

  return elements
}

// Parse inline content within an IRC span (URLs, inline code)
function parseInlineWithinSpan(text: string, startKey: number): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const inlineRegex = /(`[^`]+`)|((https?:\/\/[^\s<>]+))/g
  let lastIdx = 0
  let m
  let key = startKey

  while ((m = inlineRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      elements.push(text.slice(lastIdx, m.index))
    }

    if (m[1]) {
      elements.push(
        <code key={`ic-${key++}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary">
          {m[1].slice(1, -1)}
        </code>
      )
    } else if (m[3]) {
      elements.push(
        <a
          key={`url-${key++}`}
          href={m[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline decoration-blue-400/30 underline-offset-2 transition-colors hover:text-blue-300 hover:decoration-blue-300/50"
          style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}
        >
          {m[3]}
        </a>
      )
    }

    lastIdx = m.index + m[0].length
  }

  if (lastIdx < text.length) {
    elements.push(text.slice(lastIdx))
  }

  return elements.length > 0 ? elements : [text]
}

function parseInlineContent(text: string, startKey: number, ircColorsEnabled: boolean = true): React.ReactNode[] {
  // If IRC colors are disabled, strip formatting codes and parse normally
  if (!ircColorsEnabled && hasIRCFormatting(text)) {
    return parseInlineWithinSpan(stripIRCFormatting(text), startKey)
  }

  // If text contains IRC formatting codes, parse those first
  if (hasIRCFormatting(text)) {
    const spans = parseIRCColors(text)
    const elements: React.ReactNode[] = []
    let key = startKey

    spans.forEach((span, i) => {
      const fg = span.reverse ? getIRCColor(span.bg) : getIRCColor(span.fg)
      const bg = span.reverse ? getIRCColor(span.fg) : getIRCColor(span.bg)

      const style: React.CSSProperties = {}
      if (fg) style.color = fg
      if (bg) {
        style.backgroundColor = bg
        style.borderRadius = '2px'
        style.padding = '0 2px'
      }

      const classes = [
        span.bold ? 'font-bold' : '',
        span.italic ? 'italic' : '',
        span.underline ? 'underline underline-offset-2' : '',
      ].filter(Boolean).join(' ')

      // Within each IRC span, parse for inline code and URLs
      const innerContent = parseInlineWithinSpan(span.text, key + i * 100)

      elements.push(
        <span
          key={`irc-${key}-${i}`}
          className={classes || undefined}
          style={Object.keys(style).length > 0 ? style : undefined}
        >
          {innerContent}
        </span>
      )
    })

    return elements
  }

  // No IRC formatting -- just parse inline code and URLs
  return parseInlineWithinSpan(text, startKey)
}
