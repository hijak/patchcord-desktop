import { openExternalUrl } from "./irc-native"

// Thin wrapper so we can centralize external link behavior.
export async function shellOpenExternal(url: string): Promise<void> {
  if (typeof window === "undefined") return
  if ("__TAURI_INTERNALS__" in window) {
    await openExternalUrl(url)
    return
  }
  window.open(url, "_blank", "noopener,noreferrer")
}
