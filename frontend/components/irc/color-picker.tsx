"use client"

import { useState, useRef, useEffect } from "react"
import React from "react"
import { Palette, Sparkles, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { IRC_COLORS } from "@/lib/irc-colors"
import { cn } from "@/lib/utils"

// IRC control codes
const CTRL_COLOR = '\x03'
const CTRL_BOLD = '\x02'
const CTRL_RESET = '\x0F'

// Standard 16 IRC colors (0-15)
const STANDARD_COLORS = Array.from({ length: 16 }, (_, i) => i)

interface GradientPreset {
  name: string
  colors: number[]
}

const GRADIENT_PRESETS: GradientPreset[] = [
  { name: "Rainbow",     colors: [4, 7, 8, 3, 11, 6, 13] },
  { name: "Fire",         colors: [4, 7, 8, 7, 4] },
  { name: "Ocean",        colors: [2, 12, 11, 10, 9] },
  { name: "Sunset",       colors: [13, 7, 8, 7, 4] },
  { name: "Forest",       colors: [3, 9, 3, 9] },
  { name: "Neon",         colors: [13, 6, 11, 9, 11, 6, 13] },
  { name: "Pastel",       colors: [13, 6, 12, 11, 9, 3] },
  { name: "Monochrome",   colors: [15, 14, 1, 14, 15] },
]

function generateGradientCodes(text: string, colors: number[]): string {
  const chars = text.split('')
  if (chars.length === 0) return ''
  return chars.map((char, i) => {
    const ci = Math.floor((i / chars.length) * colors.length)
    const color = colors[Math.min(ci, colors.length - 1)]
    return CTRL_COLOR + color.toString() + char + CTRL_RESET
  }).join('')
}

function GradientPreview({ text, colors }: { text: string; colors: number[] }) {
  const display = text || "type something…"
  const chars = display.split('')
  return (
    <span className="font-mono text-sm font-bold">
      {chars.map((char, i) => {
        const ci = Math.floor((i / chars.length) * colors.length)
        const color = colors[Math.min(ci, colors.length - 1)]
        return (
          <span key={i} style={{ color: IRC_COLORS[color] }}>
            {char}
          </span>
        )
      })}
    </span>
  )
}

interface ColorPickerProps {
  onInsert: (text: string) => void
  currentText: string
  selectionStart?: number
  selectionEnd?: number
}

export function ColorPicker({ onInsert, currentText, selectionStart = 0, selectionEnd = 0 }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'colors' | 'gradients'>('colors')
  const [gradientText, setGradientText] = useState("")
  const [activePreset, setActivePreset] = useState<GradientPreset>(GRADIENT_PRESETS[0])
  const gradientInputRef = useRef<HTMLInputElement>(null)

  // Seed the gradient text field from the main input selection when switching to gradients
  useEffect(() => {
    if (tab === 'gradients' && open) {
      const sel = currentText.slice(selectionStart, selectionEnd)
      if (sel) setGradientText(sel)
      setTimeout(() => gradientInputRef.current?.focus(), 50)
    }
  }, [tab, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const insertColorCode = (fg: number | null, bg: number | null = null) => {
    let code = CTRL_COLOR
    if (fg !== null) {
      code += fg.toString()
      if (bg !== null) code += ',' + bg.toString()
    }

    const selectedText = currentText.slice(selectionStart, selectionEnd)
    if (selectedText) {
      const before = currentText.slice(0, selectionStart)
      const after = currentText.slice(selectionEnd)
      onInsert(before + code + selectedText + CTRL_RESET + after)
    } else {
      const before = currentText.slice(0, selectionStart)
      const after = currentText.slice(selectionStart)
      onInsert(before + code + after)
    }
    setOpen(false)
  }

  const insertBold = () => {
    const selectedText = currentText.slice(selectionStart, selectionEnd)
    if (selectedText) {
      const before = currentText.slice(0, selectionStart)
      const after = currentText.slice(selectionEnd)
      onInsert(before + CTRL_BOLD + selectedText + CTRL_BOLD + after)
    } else {
      const before = currentText.slice(0, selectionStart)
      const after = currentText.slice(selectionStart)
      onInsert(before + CTRL_BOLD + after)
    }
    setOpen(false)
  }

  const applyGradient = () => {
    if (!gradientText.trim()) return
    const coded = generateGradientCodes(gradientText, activePreset.colors)
    const before = currentText.slice(0, selectionStart)
    const after = currentText.slice(selectionEnd)
    onInsert(before + coded + after)
    setGradientText("")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Color picker"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Color picker</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="top" align="end">
        <div className="flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 font-mono text-xs", tab === 'colors' && "bg-muted")}
              onClick={() => setTab('colors')}
            >
              <Palette className="h-3 w-3 mr-1" />
              Colors
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2 font-mono text-xs", tab === 'gradients' && "bg-muted")}
              onClick={() => setTab('gradients')}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Gradients
            </Button>
          </div>

          {/* Colors tab */}
          {tab === 'colors' && (
            <div className="space-y-3 p-3">
              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">Formatting</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 flex-1 font-mono text-xs" onClick={insertBold}>
                    Bold
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 flex-1 font-mono text-xs" onClick={() => insertColorCode(null)}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">Foreground Color</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {STANDARD_COLORS.map((n) => (
                    <button
                      key={n}
                      onClick={() => insertColorCode(n)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-border/50 transition-all hover:scale-110"
                      style={{ backgroundColor: IRC_COLORS[n] }}
                      title={`Color ${n}`}
                    >
                      <span className={cn("font-mono text-[10px] font-bold", n === 1 ? "text-white" : "text-black")}>
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">With Background</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[4, 3, 12, 8].map((fg) => (
                    <button
                      key={fg}
                      onClick={() => insertColorCode(fg, 1)}
                      className="flex h-8 items-center justify-center rounded border border-border transition-all hover:scale-105"
                      style={{ backgroundColor: IRC_COLORS[1], color: IRC_COLORS[fg] }}
                      title={`FG ${fg} on BG 1`}
                    >
                      <span className="font-mono text-xs font-bold">FG {fg}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gradients tab */}
          {tab === 'gradients' && (
            <div className="flex flex-col gap-3 p-3">
              {/* Text input */}
              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">Type your text</p>
                <div className="flex gap-1.5">
                  <input
                    ref={gradientInputRef}
                    type="text"
                    value={gradientText}
                    onChange={(e) => setGradientText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyGradient() } }}
                    placeholder="Hello world!"
                    className="flex-1 rounded border bg-background px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    disabled={!gradientText.trim()}
                    onClick={applyGradient}
                    title="Insert gradient text"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Live preview */}
              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">Preview</p>
                <div className="flex min-h-[2rem] items-center rounded border bg-background/50 px-2 py-1.5">
                  <GradientPreview text={gradientText} colors={activePreset.colors} />
                </div>
              </div>

              {/* Preset grid */}
              <div className="space-y-1.5">
                <p className="font-mono text-xs text-muted-foreground">Style</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setActivePreset(preset)}
                      className={cn(
                        "flex flex-col gap-1 rounded border p-2 text-left transition-colors",
                        activePreset.name === preset.name
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold">{preset.name}</span>
                        <div className="flex gap-0.5">
                          {preset.colors.map((c, i) => (
                            <div key={i} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: IRC_COLORS[c] }} />
                          ))}
                        </div>
                      </div>
                      <div className="font-mono text-[11px]">
                        <GradientPreview text={preset.name} colors={preset.colors} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
