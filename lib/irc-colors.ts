// mIRC color code parser
// Handles: \x03 (color), \x02 (bold), \x1D (italic), \x1F (underline), \x16 (reverse), \x0F (reset)

// Standard mIRC 16-color palette
export const IRC_COLORS: Record<number, string> = {
  0: '#ffffff',  // white
  1: '#000000',  // black
  2: '#00007f',  // navy
  3: '#009300',  // green
  4: '#ff0000',  // red
  5: '#7f0000',  // brown/maroon
  6: '#9c009c',  // purple
  7: '#fc7f00',  // orange
  8: '#ffff00',  // yellow
  9: '#00fc00',  // light green
  10: '#009393', // teal/cyan
  11: '#00ffff', // aqua/light cyan
  12: '#0000fc', // blue
  13: '#ff00ff', // pink/magenta
  14: '#7f7f7f', // grey
  15: '#d2d2d2', // light grey/silver
  // Extended 16-98 colors (common mIRC extended palette)
  16: '#470000', 17: '#472100', 18: '#474700', 19: '#324700',
  20: '#004700', 21: '#00472c', 22: '#004747', 23: '#002747',
  24: '#000047', 25: '#2e0047', 26: '#470047', 27: '#47002a',
  28: '#740000', 29: '#743a00', 30: '#747400', 31: '#517400',
  32: '#007400', 33: '#007449', 34: '#007474', 35: '#004074',
  36: '#000074', 37: '#4b0074', 38: '#740074', 39: '#740045',
  40: '#b50000', 41: '#b56300', 42: '#b5b500', 43: '#7db500',
  44: '#00b500', 45: '#00b571', 46: '#00b5b5', 47: '#0063b5',
  48: '#0000b5', 49: '#7500b5', 50: '#b500b5', 51: '#b5006b',
  52: '#ff0000', 53: '#ff8c00', 54: '#ffff00', 55: '#b2ff00',
  56: '#00ff00', 57: '#00ffa0', 58: '#00ffff', 59: '#008cff',
  60: '#0000ff', 61: '#a500ff', 62: '#ff00ff', 63: '#ff0098',
  64: '#ff5959', 65: '#ffb459', 66: '#ffff71', 67: '#cfff60',
  68: '#6fff6f', 69: '#65ffc9', 70: '#6dffff', 71: '#59b4ff',
  72: '#5959ff', 73: '#c459ff', 74: '#ff66ff', 75: '#ff59bc',
  76: '#ff9c9c', 77: '#ffd39c', 78: '#ffff9c', 79: '#e2ff9c',
  80: '#9cff9c', 81: '#9cffdb', 82: '#9cffff', 83: '#9cd3ff',
  84: '#9c9cff', 85: '#dc9cff', 86: '#ff9cff', 87: '#ff94d3',
  88: '#000000', 89: '#131313', 90: '#282828', 91: '#363636',
  92: '#4d4d4d', 93: '#656565', 94: '#818181', 95: '#9f9f9f',
  96: '#bcbcbc', 97: '#e2e2e2', 98: '#ffffff',
}

export interface IRCFormattedSpan {
  text: string
  bold: boolean
  italic: boolean
  underline: boolean
  fg: number | null
  bg: number | null
  reverse: boolean
}

// Control character codes
const CTRL_COLOR = '\x03'
const CTRL_BOLD = '\x02'
const CTRL_ITALIC = '\x1D'
const CTRL_UNDERLINE = '\x1F'
const CTRL_REVERSE = '\x16'
const CTRL_RESET = '\x0F'

const CONTROL_CHARS = new Set([
  CTRL_COLOR, CTRL_BOLD, CTRL_ITALIC, CTRL_UNDERLINE, CTRL_REVERSE, CTRL_RESET
])

/**
 * Check if a string contains any IRC formatting control codes
 */
export function hasIRCFormatting(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (CONTROL_CHARS.has(text[i])) return true
  }
  return false
}

/**
 * Strip all IRC formatting codes from a string, returning plain text
 */
export function stripIRCFormatting(text: string): string {
  let result = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (ch === CTRL_COLOR) {
      i++
      // Skip color digits: up to 2 digits, optional comma + up to 2 digits
      if (i < text.length && text[i] >= '0' && text[i] <= '9') {
        i++
        if (i < text.length && text[i] >= '0' && text[i] <= '9') i++
        if (i < text.length && text[i] === ',') {
          i++
          if (i < text.length && text[i] >= '0' && text[i] <= '9') {
            i++
            if (i < text.length && text[i] >= '0' && text[i] <= '9') i++
          }
        }
      }
    } else if (CONTROL_CHARS.has(ch)) {
      i++
    } else {
      result += ch
      i++
    }
  }
  return result
}

/**
 * Parse a string with IRC formatting codes into an array of styled spans
 */
export function parseIRCColors(text: string): IRCFormattedSpan[] {
  const spans: IRCFormattedSpan[] = []
  let bold = false
  let italic = false
  let underline = false
  let fg: number | null = null
  let bg: number | null = null
  let reverse = false
  let currentText = ''
  let i = 0

  function flush() {
    if (currentText.length > 0) {
      spans.push({ text: currentText, bold, italic, underline, fg, bg, reverse })
      currentText = ''
    }
  }

  while (i < text.length) {
    const ch = text[i]

    if (ch === CTRL_BOLD) {
      flush()
      bold = !bold
      i++
    } else if (ch === CTRL_ITALIC) {
      flush()
      italic = !italic
      i++
    } else if (ch === CTRL_UNDERLINE) {
      flush()
      underline = !underline
      i++
    } else if (ch === CTRL_REVERSE) {
      flush()
      reverse = !reverse
      i++
    } else if (ch === CTRL_RESET) {
      flush()
      bold = false
      italic = false
      underline = false
      fg = null
      bg = null
      reverse = false
      i++
    } else if (ch === CTRL_COLOR) {
      flush()
      i++
      // Parse foreground color (up to 2 digits)
      let fgStr = ''
      if (i < text.length && text[i] >= '0' && text[i] <= '9') {
        fgStr += text[i]; i++
        if (i < text.length && text[i] >= '0' && text[i] <= '9') {
          fgStr += text[i]; i++
        }
      }

      if (fgStr.length > 0) {
        fg = parseInt(fgStr, 10)
      } else {
        // Bare \x03 with no digits resets color
        fg = null
        bg = null
      }

      // Parse optional background color
      if (i < text.length && text[i] === ',') {
        i++
        let bgStr = ''
        if (i < text.length && text[i] >= '0' && text[i] <= '9') {
          bgStr += text[i]; i++
          if (i < text.length && text[i] >= '0' && text[i] <= '9') {
            bgStr += text[i]; i++
          }
        }
        if (bgStr.length > 0) {
          bg = parseInt(bgStr, 10)
        }
      }
    } else {
      currentText += ch
      i++
    }
  }

  flush()
  return spans
}

/**
 * Get the CSS color string for an IRC color number
 */
export function getIRCColor(colorNum: number | null): string | undefined {
  if (colorNum === null) return undefined
  return IRC_COLORS[colorNum] ?? undefined
}
