const defaultColors = [
  '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd',
  '#56b6c2', '#d19a66', '#be5046', '#7ec699', '#f7ecb5',
  '#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe', '#fd79a8',
  '#00cec9', '#fab1a0', '#74b9ff', '#55efc4', '#ffeaa7',
]

const pastelColors = [
  '#ffb3ba', '#baffc9', '#bae1ff', '#ffffba', '#e8baff',
  '#ffdfba', '#c9baff', '#baffee', '#ffc9ba', '#c4ffba',
  '#ffd1dc', '#c1e1c1', '#c1d4e8', '#fceabb', '#d4c1e8',
  '#f0d4ba', '#bac1ff', '#baffe8', '#f7c1ba', '#d4ffba',
]

const vividColors = [
  '#ff0066', '#00ff88', '#0088ff', '#ffaa00', '#aa00ff',
  '#00ffff', '#ff4400', '#00ff00', '#4400ff', '#ff00aa',
  '#ff3355', '#33ff77', '#3377ff', '#ff9922', '#9933ff',
  '#22ffdd', '#ff5500', '#33ff33', '#5533ff', '#ff33aa',
]

function hashNick(nick: string): number {
  let hash = 0
  for (let i = 0; i < nick.length; i++) {
    const char = nick.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

export function getNickColor(nick: string, scheme: 'default' | 'pastel' | 'vivid' = 'default'): string {
  const colors = scheme === 'pastel' ? pastelColors : scheme === 'vivid' ? vividColors : defaultColors
  return colors[hashNick(nick) % colors.length]
}
