// Thin wrapper so we can centralize external link behavior.
// For both web and desktop (Tauri), falling back to window.open
// is sufficient to open the user's default browser.
export async function shellOpenExternal(url: string): Promise<void> {
  if (typeof window === "undefined") return
  window.open(url, "_blank", "noopener,noreferrer")
}


