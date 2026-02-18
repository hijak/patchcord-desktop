export type InputInsertMode = "replace" | "append"

export interface InputInsertPayload {
  text: string
  mode?: InputInsertMode
}

const EVENT_NAME = "patchcord:input-insert"

export function emitInputInsert(payload: InputInsertPayload) {
  if (typeof window === "undefined") return
  const detail: InputInsertPayload = {
    mode: payload.mode ?? "append",
    text: payload.text,
  }
  window.dispatchEvent(new CustomEvent<InputInsertPayload>(EVENT_NAME, { detail }))
}

export function subscribeInputInsert(
  handler: (payload: InputInsertPayload) => void
): () => void {
  if (typeof window === "undefined") return () => {}

  const listener = (event: Event) => {
    const custom = event as CustomEvent<InputInsertPayload>
    if (!custom.detail) return
    handler(custom.detail)
  }

  window.addEventListener(EVENT_NAME, listener as EventListener)
  return () => window.removeEventListener(EVENT_NAME, listener as EventListener)
}

