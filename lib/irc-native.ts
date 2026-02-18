import { invoke } from "@tauri-apps/api/core"
import { listen, type UnlistenFn } from "@tauri-apps/api/event"

export interface NativeIrcEvent {
  server_id: string
  kind: string
  channel?: string
  nick?: string
  ident?: string
  content?: string
  time?: string
  msgid?: string
  users?: string[]
  raw?: string
  status?: "connected" | "connecting" | "disconnected"
}

function hasTauriInternals() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export async function listenNativeIrcEvents(
  cb: (event: NativeIrcEvent) => void
): Promise<UnlistenFn | null> {
  if (!hasTauriInternals()) return null
  return listen<NativeIrcEvent>("irc-event", (event) => cb(event.payload))
}

export async function connectNativeIrc(params: {
  serverId: string
  host: string
  port: number
  ssl: boolean
  allowInvalidCerts: boolean
  nickname: string
  username: string
  realName: string
  password?: string
  autoJoinChannels: string[]
}) {
  if (!hasTauriInternals()) return
  await invoke("irc_connect", {
    serverId: params.serverId,
    host: params.host,
    port: params.port,
    ssl: params.ssl,
    allowInvalidCerts: params.allowInvalidCerts,
    nickname: params.nickname,
    username: params.username,
    realName: params.realName,
    password: params.password || null,
    autoJoinChannels: params.autoJoinChannels,
  })
}

export async function disconnectNativeIrc(serverId: string, reason?: string) {
  if (!hasTauriInternals()) return
  await invoke("irc_disconnect", { serverId, reason: reason || "Client disconnect" })
}

export async function joinNativeIrc(serverId: string, channel: string) {
  if (!hasTauriInternals()) return
  await invoke("irc_join", { serverId, channel })
}

export async function partNativeIrc(serverId: string, channel: string, reason?: string) {
  if (!hasTauriInternals()) return
  await invoke("irc_part", { serverId, channel, reason: reason || null })
}

export async function sendNativePrivmsg(
  serverId: string,
  target: string,
  message: string
) {
  if (!hasTauriInternals()) return
  await invoke("irc_privmsg", { serverId, target, message })
}

export async function sendNativeRaw(serverId: string, line: string) {
  if (!hasTauriInternals()) return
  await invoke("irc_raw", { serverId, line })
}

export async function openExternalUrl(url: string) {
  if (!hasTauriInternals()) return
  await invoke("open_external_url", { url })
}

export async function secureSetServerSecret(
  serverId: string,
  secretName: "password" | "saslPassword",
  value: string
) {
  if (!hasTauriInternals()) return
  await invoke("secure_set_server_secret", { serverId, secretName, value })
}

export async function secureGetServerSecret(
  serverId: string,
  secretName: "password" | "saslPassword"
): Promise<string | null> {
  if (!hasTauriInternals()) return null
  const v = await invoke<string | null>("secure_get_server_secret", { serverId, secretName })
  return v ?? null
}

export async function secureDeleteServerSecret(
  serverId: string,
  secretName: "password" | "saslPassword"
) {
  if (!hasTauriInternals()) return
  await invoke("secure_delete_server_secret", { serverId, secretName })
}

