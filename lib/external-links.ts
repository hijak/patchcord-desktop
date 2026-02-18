import { isLiveBuild } from "./build-mode"

// Thin wrapper so we can centralize external link behavior.
export async function shellOpenExternal(url: string): Promise<void> {
  if (!isLiveBuild) {
    window.open(url, "_blank", "noopener,noreferrer")
    return
  }

  try {
    // Dynamically import Tauri shell only when available (desktop).
    const { open } = await import("@tauri-apps/api/shell")
    await open(url)
  } catch {
    // Fallback to normal browser open if shell is unavailable.
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

