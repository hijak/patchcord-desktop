# Roadmap: Add Matrix Client Support to Patchcord

## Context

Patchcord is currently a fully-functional IRC desktop client built with Next.js + Tauri. This roadmap outlines adding **Matrix** client support alongside IRC, with full feature parity including reactions, edits, encryption, and spaces.

## Difficulty: **Moderate to Hard** | **Estimated: 4-7 weeks**

---

## Why It's Doable

- Solid existing architecture for chat client functionality
- Event system can be reused for Matrix events
- UI components (messages, channels, user lists) are mostly protocol-agnostic
- Rust has excellent Matrix SDK (`matrix-sdk` crate)

## Why It's Complex

- **Protocol differences**: IRC is TCP/text-based; Matrix is HTTP/JSON-based with long-polling sync
- **Different data models**: IRC has simple channels; Matrix has rooms, events, state events, encryption
- **Message history**: Matrix stores all history server-side; requires sync tokens and pagination
- **Authentication**: Matrix uses access tokens with refresh flow
- **Richer UI features**: Reactions, edits, threading, encryption indicators, spaces

---

## Implementation Plan

### Phase 1: Backend (Rust) - 1-2 weeks

#### 1.1 Add Matrix SDK Dependency
**File**: `src-tauri/Cargo.toml`

```toml
matrix-sdk = { version = "0.7", features = ["rustls-tls", "markdown", "image-proc"] }
matrix-sdk-indexeddb = "0.7"  # For cross-platform storage
```

#### 1.2 Create Matrix Module
**File**: `src-tauri/src/matrix.rs` (NEW)

Key functions:
- `matrix_login` - Login with homeserver URL, username, password
- `matrix_logout` - Logout and clear tokens
- `matrix_sync` - Long-polling sync loop with incremental updates
- `matrix_join_room` - Join a room
- `matrix_leave_room` - Leave a room
- `matrix_send_message` - Send text/markdown message
- `matrix_send_reaction` - React to a message
- `matrix_edit_message` - Edit a sent message
- `matrix_redact_message` - Delete a message
- `matrix_get_rooms` - List all rooms
- `matrix_get_room_messages` - Paginated message history
- `matrix_upload_file` - Upload attachments
- `matrix_search_rooms` - Search/join public rooms

#### 1.3 Register Tauri Commands
**File**: `src-tauri/src/lib.rs`

Add commands for each Matrix function (parallel to existing IRC commands).

#### 1.4 Connection & State Management
- Reuse the existing `HashMap<String, Connection>` pattern
- Add separate HashMap for Matrix clients
- Implement secure token storage (access tokens, device IDs, sync tokens)

---

### Phase 2: Event System - 2-3 days

Extend the existing event system for Matrix:

**Existing IRC events**:
- `irc-event` with types: status, privmsg, join, part, notice, names, etc.

**Add Matrix events**:
- `matrix-event` with types:
  - `status` - Connection status updates
  - `message` - New messages (text, image, file)
  - `reaction` - Emoji reactions to messages
  - `redaction` - Message deletions
  - `membership` - Join/leave/invite events
  - `typing` - User typing indicators
  - `receipt` - Read receipts
  - `notification` - Mention/notification events
  - `room_state` - Topic changes, avatar changes

The frontend can listen to both event streams and dispatch to shared UI components.

---

### Phase 3: Frontend Data Model - 3-5 days

#### 3.1 Extend State Management
**Files**: Locate Zustand stores (likely `src/lib/store.ts` or similar)

Add Matrix state alongside IRC:
```typescript
// Matrix-specific state
matrixHomeservers: Map<string, MatrixHomeserver>
matrixRooms: Map<string, MatrixRoom>
matrixMessages: Map<string, MatrixMessage[]>
matrixSyncTokens: Map<string, string>
```

#### 3.2 Protocol-Agnostic Abstraction

Create unified interfaces to support both protocols:

```typescript
type ChatProtocol = 'irc' | 'matrix'

interface ChatServer {
  id: string
  protocol: ChatProtocol
  name: string
  connected: boolean
  // IRC: server address
  // Matrix: homeserver URL
}

interface ChatChannel {
  id: string
  serverId: string
  protocol: ChatProtocol
  name: string
  topic?: string
  unread: number
  // Matrix-specific
  encrypted?: boolean
  directMessage?: boolean
}

interface ChatMessage {
  id: string
  channel: string
  protocol: ChatProtocol
  sender: string
  senderAvatar?: string  // Matrix only
  content: string
  timestamp: Date
  // Matrix-specific
  eventType?: 'm.room.message' | 'm.reaction' | 'm.room.redaction'
  relatesTo?: string  // For reactions/replies
  edits?: string[]  // Edit history
  encrypted?: boolean
}
```

This allows UI components to work with both IRC and Matrix.

---

### Phase 4: UI Components - 2-3 weeks

#### 4.1 Server List
**Files**: `src/components/server-list.tsx` or similar

Current: Shows IRC servers
Add:
- Show both IRC servers and Matrix homeservers
- Different icons/indicators for protocol types
- Matrix-specific actions: explore rooms, spaces browser
- Connection status with latency

#### 4.2 Channel/Room List
**Files**: `src/components/channel-list.tsx` or similar

IRC channels are simple. Matrix rooms need:
- Direct messages vs regular rooms (separate sections)
- Spaces (grouped rooms with hierarchy)
- Invite status badges
- Encryption indicators (lock icon)
- Unread message counts and highlights
- Room avatars
- Room topics

#### 4.3 Message Rendering
**Files**: `src/components/message.tsx` or similar

Matrix messages are richer than IRC:

**Message types to support**:
- Text with markdown formatting
- Code blocks with syntax highlighting
- Image thumbnails (click to expand)
- File attachments with download
- Replies (show original message)
- Reactions (emoji pills below message)
- Edit indicators ("edited" badge, show edit history)
- Redactions (show "message deleted" or remove)
- Verification badges for verified users
- Sender avatars
- Read receipts (who has read)

**IRC vs Matrix differences**:
- IRC: Simple text, colors, bold/italic
- Matrix: Structured event types, rich content, edits, reactions

#### 4.4 Message Composer
**Files**: `src/components/composer.tsx` or similar

IRC: Simple text input
Matrix needs:
- Markdown support (live preview)
- Emoji picker (for reactions and messages)
- File upload button
- Reply to message (show quoted message)
- Edit message mode
- Formatting toolbar (bold, italic, code, link)
- Attachment preview before sending

#### 4.5 Settings - Matrix Configuration
**Files**: `src/app/settings.tsx` or similar

Add Matrix settings section:
- Add/edit Matrix homeservers
- Homeserver URL (default: matrix.org)
- Login credentials (username/password)
- Room settings (default rooms to join)
- Notification preferences
- Encryption settings (verify devices, cross-signing)
- Sync settings (full sync vs lazy loading)
- Theme/customization per-homeserver

#### 4.6 Spaces Browser (Matrix-specific)
**New component**: `src/components/spaces-browser.tsx`

- Explore public rooms on homeserver
- Join spaces (room groups)
- Space hierarchy view
- Room directory with search/filter

---

### Phase 5: Authentication Flow - 1 week

#### 5.1 Matrix Login UI
**Files**: `src/components/add-server-dialog.tsx` or similar

Add Matrix-specific login:
- Homeserver URL input (with common presets)
- Username/password inputs
- Social login buttons (Google, Apple, GitHub - if homeserver supports)
- 2FA/OTP input if enabled
- Device name (for session management)

#### 5.2 Token & Session Storage
Matrix requires:
- Access token (long-lived)
- Refresh token (if using OIDC)
- Device ID
- Sync token (for incremental sync)
- Encryption keys (cross-signing keys)

Use Tauri's secure store or system keychain for storage.

#### 5.3 Device Verification
**New component**: `src/components/device-verification.tsx`

- Show other devices logged into account
- Verify/unverify devices
- Cross-signing setup
- Recovery key setup

---

### Phase 6: Encryption - 1 week

**Matrix supports end-to-end encryption** - this is complex but important.

**Backend** (`matrix.rs`):
- Enable encryption features in matrix-sdk
- Handle encrypted message sending/receiving
- Megolm key management
- Device verification flows

**Frontend**:
- Encryption indicators in room list and message composer
- Lock icons for encrypted rooms
- "Unverified device" warnings
- Shield icon for verified messages
- Setup encryption on first login

---

### Phase 7: Testing & Polish - 1-2 weeks

1. **Testing Checklist**:
   - Login to matrix.org and other homeservers
   - Join rooms, send/receive messages
   - Test reactions, edits, deletions
   - File uploads (images, documents)
   - Encryption setup and encrypted rooms
   - Spaces and room directory
   - Notifications and mentions
   - Cross-platform testing (Windows, macOS, Linux)

2. **Edge Cases**:
   - Network reconnection handling
   - Sync token corruption recovery
   - Large room handling (thousands of messages)
   - Slow connections
   - Homeserver timeouts and errors

3. **Performance**:
   - Lazy loading for room history
   - Virtual scrolling for large message lists
   - Optimized sync intervals

---

## Critical Files to Modify

### Backend (Rust)
| File | Action |
|------|--------|
| `src-tauri/Cargo.toml` | Add matrix-sdk dependency |
| `src-tauri/src/matrix.rs` | **NEW** - Matrix client implementation |
| `src-tauri/src/lib.rs` | Register Matrix Tauri commands |
| `src-tauri/capabilities/default.json` | Add Matrix command permissions |

### Frontend (TypeScript/React)
| File/Pattern | Action |
|--------------|--------|
| `src/lib/store.ts` | Add Matrix state management |
| `src/components/server-list.tsx` | Show both IRC and Matrix servers |
| `src/components/channel-list.tsx` | Handle Matrix rooms, spaces |
| `src/components/message.tsx` | Render Matrix messages (rich format) |
| `src/components/composer.tsx` | Markdown, edits, reactions |
| `src/components/spaces-browser.tsx` | **NEW** - Matrix spaces UI |
| `src/components/device-verification.tsx` | **NEW** - Encryption UI |
| `src/app/settings.tsx` | Add Matrix configuration |

---

## Implementation Order (Recommended)

1. **Week 1-2**: Backend Matrix module (login, sync, basic messaging)
2. **Week 2**: Event system integration
3. **Week 2-3**: Frontend state refactoring (protocol-agnostic)
4. **Week 3-4**: Basic UI (servers, rooms, text messages)
5. **Week 4-5**: Rich features (reactions, edits, uploads)
6. **Week 5-6**: Encryption and device verification
7. **Week 6-7**: Spaces, testing, polish

---

## Verification Steps

### Basic Functionality
- [ ] Login to matrix.org test server
- [ ] Join a room (e.g., #test:matrix.org)
- [ ] Send/receive text messages
- [ ] Message history persists across restarts

### Rich Features
- [ ] React to messages with emoji
- [ ] Edit sent messages
- [ ] Delete/redact messages
- [ ] Upload and view images
- [ ] Reply to messages
- [ ] See typing indicators

### Encryption
- [ ] Create encrypted room
- [ ] Verify another device
- [ ] Send/receive encrypted messages
- [ ] See encryption indicators

### Multi-protocol
- [ ] Use IRC and Matrix simultaneously
- [ ] Switch between IRC channels and Matrix rooms
- [ ] Notifications from both protocols

### Cross-platform
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Test on Linux

---

## Dependencies & Resources

### Rust Crates
- `matrix-sdk` - Official Matrix SDK for Rust
- `matrix-sdk-crypto` - End-to-end encryption
- `matrix-sdk-indexeddb` - Cross-platform storage

### Documentation
- [Matrix Client-Server API](https://spec.matrix.org/v1.11/client-server-api/)
- [matrix-sdk Rust docs](https://docs.rs/matrix-sdk/)
- [Matrix Spec](https://spec.matrix.org/)

### Test Homeservers
- matrix.org - Official public server
- envs.net - Privacy-focused server
- libera.chat - IRC network with Matrix bridge

---

## Alternative (Simpler) Approach: Bridge

If full Matrix integration is too much work, consider an **IRC-Matrix bridge**:

- Run a bridge service (e.g., matrix-appservice-irc)
- Patchcord connects only to IRC
- Matrix rooms appear as IRC channels via the bridge

**Pros**: Much simpler (~1 week setup), no Matrix protocol code needed
**Cons**: No Matrix-specific features (reactions, edits, encryption, etc.), depends on bridge service

---

## Summary

This is a significant feature addition that will transform Patchcord into a multi-protocol chat client. The work is substantial but the existing architecture provides a solid foundation.

**Estimated effort: 4-7 weeks** for a polished, feature-complete Matrix integration.

The result will be a modern desktop chat client supporting both IRC (the classic developer chat protocol) and Matrix (the modern, encrypted, federated messaging protocol).
