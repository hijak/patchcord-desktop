use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};
use std::time::{Duration, Instant};

use once_cell::sync::Lazy;
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::sync::{mpsc, Mutex};
use tokio_native_tls::TlsConnector;

type WriterMap = Arc<Mutex<HashMap<String, mpsc::UnboundedSender<String>>>>;

static WRITERS: Lazy<WriterMap> = Lazy::new(|| Arc::new(Mutex::new(HashMap::new())));
static PING_TIMERS: Lazy<StdMutex<HashMap<String, Instant>>> =
    Lazy::new(|| StdMutex::new(HashMap::new()));

trait AsyncReadWrite: AsyncRead + AsyncWrite {}
impl<T: AsyncRead + AsyncWrite + ?Sized> AsyncReadWrite for T {}

#[derive(Clone, Serialize)]
pub struct IrcEvent {
    pub server_id: String,
    pub kind: String,
    pub channel: Option<String>,
    pub nick: Option<String>,
    /// Full IRC prefix, e.g. "nick!user@host"
    pub ident: Option<String>,
    pub content: Option<String>,
    /// IRCv3 server-time tag, if present (RFC3339 timestamp)
    pub time: Option<String>,
    /// IRCv3 msgid tag, if present
    pub msgid: Option<String>,
    pub users: Option<Vec<String>>,
    pub raw: Option<String>,
    pub status: Option<String>,
}

impl IrcEvent {
    fn emit(self, app: &AppHandle) {
        let _ = app.emit("irc-event", self);
    }
}

pub async fn connect(
    app: AppHandle,
    server_id: String,
    host: String,
    port: u16,
    ssl: bool,
    allow_invalid_certs: bool,
    nickname: String,
    username: String,
    real_name: String,
    password: Option<String>,
    auto_join_channels: Vec<String>,
) -> Result<(), String> {
    disconnect(server_id.clone(), Some("Reconnecting".to_string())).await?;

    IrcEvent {
        server_id: server_id.clone(),
        kind: "status".to_string(),
        channel: None,
        nick: None,
        ident: None,
        content: None,
        time: None,
        msgid: None,
        users: None,
        raw: None,
        status: Some("connecting".to_string()),
    }
    .emit(&app);

    let addr = format!("{host}:{port}");
    let tcp = TcpStream::connect(&addr)
        .await
        .map_err(|e| format!("Connect failed: {e}"))?;

    let stream: Box<dyn AsyncReadWrite + Send + Unpin> = if ssl {
        let mut builder = native_tls::TlsConnector::builder();
        if allow_invalid_certs {
            builder.danger_accept_invalid_certs(true);
        }
        let connector = builder.build().map_err(|e| format!("TLS init failed: {e}"))?;
        let connector = TlsConnector::from(connector);
        let tls = connector
            .connect(&host, tcp)
            .await
            .map_err(|e| format!("TLS connect failed: {e}"))?;
        Box::new(tls)
    } else {
        Box::new(tcp)
    };

    let (reader, mut writer) = tokio::io::split(stream);
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    WRITERS.lock().await.insert(server_id.clone(), tx.clone());

    let app_writer = app.clone();
    let sid_writer = server_id.clone();
    tokio::spawn(async move {
        while let Some(line) = rx.recv().await {
            let payload = format!("{line}\r\n");
            if writer.write_all(payload.as_bytes()).await.is_err() {
                break;
            }
            IrcEvent {
                server_id: sid_writer.clone(),
                kind: "raw_out".to_string(),
                channel: None,
                nick: None,
                ident: None,
                content: None,
                time: None,
                msgid: None,
                users: None,
                raw: Some(line),
                status: None,
            }
            .emit(&app_writer);
        }
    });

    let app_reader = app.clone();
    let sid_reader = server_id.clone();
    let tx_reader = tx.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(reader);
        let mut line = String::new();

        loop {
            line.clear();
            let read = reader.read_line(&mut line).await;
            match read {
                Ok(0) => {
                    break;
                }
                Ok(_) => {
                    let raw = line.trim_end().to_string();
                    IrcEvent {
                        server_id: sid_reader.clone(),
                        kind: "raw_in".to_string(),
                        channel: None,
                        nick: None,
                        ident: None,
                        content: None,
                        time: None,
                        msgid: None,
                        users: None,
                        raw: Some(raw.clone()),
                        status: None,
                    }
                    .emit(&app_reader);
                    handle_line(&app_reader, &sid_reader, &raw, &tx_reader);
                }
                Err(_) => break,
            }
        }

        let mut writers = WRITERS.blocking_lock();
        writers.remove(&sid_reader);
        IrcEvent {
            server_id: sid_reader.clone(),
            kind: "status".to_string(),
            channel: None,
            nick: None,
            ident: None,
            content: None,
            time: None,
            msgid: None,
            users: None,
            raw: None,
            status: Some("disconnected".to_string()),
        }
        .emit(&app_reader);
    });

    // Periodic latency PING loop
    let sid_ping = server_id.clone();
    let app_ping = app.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(20));
        loop {
            interval.tick().await;

            // Stop if the connection has been removed
            {
                let writers = WRITERS.lock().await;
                if !writers.contains_key(&sid_ping) {
                    break;
                }
            }

            // Create a unique token and record send time
            let now = Instant::now();
            let token = format!(
                "pc-{}",
                now.elapsed().as_nanos() // monotonic, just to make token unique
            );
            {
                let mut timers = PING_TIMERS
                    .lock()
                    .expect("PING_TIMERS mutex poisoned");
                timers.insert(format!("{}:{}", sid_ping, token.clone()), now);
            }

            let line = format!("PING :{token}");
            if let Err(err) = send_to(&sid_ping, line).await {
                IrcEvent {
                    server_id: sid_ping.clone(),
                    kind: "server".to_string(),
                    channel: None,
                    nick: None,
                    ident: None,
                    content: Some(format!("Latency PING failed: {err}")),
                    time: None,
                    msgid: None,
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(&app_ping);
                break;
            }
        }
    });

    // Request IRCv3 capabilities supported by Libera.Chat that we understand.
    // We optimistically request them up front; the server will ACK/NAK as needed.
    send_line(&tx, "CAP LS 302");
    send_line(
        &tx,
        "CAP REQ :message-tags server-time batch invite-notify",
    );
    if let Some(pass) = password {
        send_line(&tx, &format!("PASS {pass}"));
    }
    send_line(&tx, &format!("NICK {nickname}"));
    send_line(&tx, &format!("USER {username} 0 * :{real_name}"));
    send_line(&tx, "CAP END");
    for channel in auto_join_channels {
        if !channel.trim().is_empty() {
            send_line(&tx, &format!("JOIN {channel}"));
        }
    }

    IrcEvent {
        server_id,
        kind: "status".to_string(),
        channel: None,
        nick: None,
        ident: None,
        content: None,
        time: None,
        msgid: None,
        users: None,
        raw: None,
        status: Some("connected".to_string()),
    }
    .emit(&app);

    Ok(())
}

pub async fn disconnect(server_id: String, reason: Option<String>) -> Result<(), String> {
    let mut writers = WRITERS.lock().await;
    if let Some(tx) = writers.remove(&server_id) {
        let reason = reason.unwrap_or_else(|| "Client quit".to_string());
        let _ = tx.send(format!("QUIT :{reason}"));
    }
    Ok(())
}

pub async fn join(server_id: String, channel: String) -> Result<(), String> {
    send_to(&server_id, format!("JOIN {channel}")).await
}

pub async fn part(server_id: String, channel: String, reason: Option<String>) -> Result<(), String> {
    if let Some(reason) = reason {
        send_to(&server_id, format!("PART {channel} :{reason}")).await
    } else {
        send_to(&server_id, format!("PART {channel}")).await
    }
}

pub async fn privmsg(server_id: String, target: String, message: String) -> Result<(), String> {
    send_to(&server_id, format!("PRIVMSG {target} :{message}")).await
}

pub async fn raw(server_id: String, line: String) -> Result<(), String> {
    send_to(&server_id, line).await
}

async fn send_to(server_id: &str, line: String) -> Result<(), String> {
    let writers = WRITERS.lock().await;
    let tx = writers
        .get(server_id)
        .ok_or_else(|| "Not connected".to_string())?;
    tx.send(line).map_err(|_| "Send failed".to_string())
}

fn send_line(tx: &mpsc::UnboundedSender<String>, line: &str) {
    let _ = tx.send(line.to_string());
}

fn handle_line(app: &AppHandle, server_id: &str, raw: &str, tx: &mpsc::UnboundedSender<String>) {
    let parsed = parse_irc(raw);
    let cmd = parsed.command.as_str();

    // IRCv3 message tags we currently care about
    let time_tag = parsed.tags.get("time").cloned();
    let msgid_tag = parsed.tags.get("msgid").cloned();

    if cmd == "PING" {
        if let Some(token) = parsed.trailing.as_ref().or(parsed.params.first()) {
            send_line(tx, &format!("PONG :{token}"));
        }
        return;
    }

    if cmd == "PONG" {
        if let Some(token) = parsed
            .trailing
            .as_ref()
            .or(parsed.params.first())
            .cloned()
        {
            let key = format!("{server_id}:{token}");
            let maybe_start = {
                let mut timers = PING_TIMERS
                    .lock()
                    .expect("PING_TIMERS mutex poisoned");
                timers.remove(&key)
            };

            if let Some(start) = maybe_start {
                let ms = start.elapsed().as_millis() as u64;
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "latency".to_string(),
                    channel: None,
                    nick: None,
                    ident: None,
                    content: Some(ms.to_string()),
                    time: None,
                    msgid: None,
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        return;
    }

    match cmd {
        "PRIVMSG" => {
            if let (Some(target), Some(content)) = (parsed.params.first(), parsed.trailing.clone()) {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "privmsg".to_string(),
                    channel: Some(target.clone()),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: Some(content),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "NOTICE" => {
            if let (Some(target), Some(content)) = (parsed.params.first(), parsed.trailing.clone()) {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "notice".to_string(),
                    channel: Some(target.clone()),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: Some(content),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "JOIN" => {
            let channel = parsed.trailing.clone().or_else(|| parsed.params.first().cloned());
            if let Some(channel) = channel {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "join".to_string(),
                    channel: Some(channel),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: None,
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "PART" => {
            if let Some(channel) = parsed.params.first() {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "part".to_string(),
                    channel: Some(channel.clone()),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: parsed.trailing.clone(),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "321" => {
            // LIST start
            IrcEvent {
                server_id: server_id.to_string(),
                kind: "list_start".to_string(),
                channel: None,
                nick: None,
                ident: None,
                content: None,
                time: time_tag.clone(),
                msgid: msgid_tag.clone(),
                users: None,
                raw: None,
                status: None,
            }
            .emit(app);
        }
        "322" => {
            // LIST item: params[1] = channel, params[2] = users, trailing = topic
            if parsed.params.len() > 2 {
                let channel = parsed.params[1].clone();
                let users = parsed.params[2].clone();
                let topic = parsed.trailing.clone().unwrap_or_default();
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "list_item".to_string(),
                    channel: Some(channel),
                    nick: None,
                    ident: None,
                    content: Some(format!("{users} {topic}")),
                     time: time_tag.clone(),
                     msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "323" => {
            // LIST end
            IrcEvent {
                server_id: server_id.to_string(),
                kind: "list_end".to_string(),
                channel: None,
                nick: None,
                ident: None,
                content: None,
                time: time_tag.clone(),
                msgid: msgid_tag.clone(),
                users: None,
                raw: None,
                status: None,
            }
            .emit(app);
        }
        "332" => {
            if parsed.params.len() > 1 {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "topic".to_string(),
                    channel: Some(parsed.params[1].clone()),
                    nick: None,
                    ident: None,
                    content: parsed.trailing.clone(),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "353" => {
            if parsed.params.len() > 2 {
                let mut users = Vec::new();
                let mut modes = Vec::new();

                for token in parsed
                    .trailing
                    .clone()
                    .unwrap_or_default()
                    .split_whitespace()
                {
                    let mut nick = token.to_string();
                    let mut mode_prefix = String::new();

                    while nick.starts_with(['@', '+', '%', '&', '~']) {
                        mode_prefix.push(nick.chars().next().unwrap());
                        nick.remove(0);
                    }

                    users.push(nick);
                    modes.push(mode_prefix);
                }

                // Encode modes alongside users as "prefix:nick" so the
                // frontend can reconstruct operator/voice flags.
                let encoded = users
                    .into_iter()
                    .zip(modes.into_iter())
                    .map(|(nick, prefix)| format!("{prefix}:{nick}"))
                    .collect::<Vec<_>>();

                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "names".to_string(),
                    channel: Some(parsed.params[2].clone()),
                    nick: None,
                    ident: None,
                    content: None,
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: Some(encoded),
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "TOPIC" => {
            if let Some(channel) = parsed.params.first() {
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "topic".to_string(),
                    channel: Some(channel.clone()),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: parsed.trailing.clone(),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        "MODE" => {
            // MODE #channel +o nick
            // MODE #channel -o nick
            // MODE #channel +nst (channel modes)
            if parsed.params.len() >= 2 {
                let target = &parsed.params[0];
                let mode_str = &parsed.params[1];
                
                // Check if it's a channel mode (starts with # or &)
                if target.starts_with('#') || target.starts_with('&') {
                    let channel = target.clone();
                    
                    // If there are more params, they're user mode changes (e.g., +o nick)
                    if parsed.params.len() > 2 {
                        // Parse mode string to extract individual mode changes
                        let mut current_sign = '+';
                        let mut modes_vec = Vec::new();
                        
                        for ch in mode_str.chars() {
                            match ch {
                                '+' => current_sign = '+',
                                '-' => current_sign = '-',
                                _ => {
                                    // For each mode character, emit an event if there's a corresponding nick
                                    let mode_char = ch;
                                    // Find the corresponding nick (params[2] for first mode, params[3] for second, etc.)
                                    let mode_index = modes_vec.len();
                                    if parsed.params.len() > 2 + mode_index {
                                        let nick = parsed.params[2 + mode_index].clone();
                                        let mode_change = format!("{}{}", current_sign, mode_char);
                                        IrcEvent {
                                            server_id: server_id.to_string(),
                                            kind: "mode".to_string(),
                                            channel: Some(channel.clone()),
                                            nick: Some(nick.clone()),
                                            ident: parsed.prefix.clone(),
                                            content: Some(format!("{} {}", mode_change, nick)),
                                            time: time_tag.clone(),
                                            msgid: msgid_tag.clone(),
                                            users: None,
                                            raw: None,
                                            status: None,
                                        }
                                        .emit(app);
                                        modes_vec.push((mode_change, nick));
                                    }
                                }
                            }
                        }
                    } else {
                        // Channel mode change without user params (e.g., +nst)
                        IrcEvent {
                            server_id: server_id.to_string(),
                            kind: "mode".to_string(),
                            channel: Some(channel),
                            nick: parsed.nick(),
                            ident: parsed.prefix.clone(),
                            content: Some(mode_str.clone()),
                            time: time_tag.clone(),
                            msgid: msgid_tag.clone(),
                            users: None,
                            raw: None,
                            status: None,
                        }
                        .emit(app);
                    }
                }
            }
        }
        "433" => {
            IrcEvent {
                server_id: server_id.to_string(),
                kind: "server".to_string(),
                channel: None,
                nick: None,
                ident: None,
                content: Some("Nickname already in use (433)".to_string()),
                time: None,
                msgid: None,
                users: None,
                raw: None,
                status: None,
            }
            .emit(app);
        }
        "INVITE" => {
            // INVITE <nick> <channel>
            if parsed.params.len() >= 2 {
                let target = parsed.params[0].clone();
                let channel = parsed.params[1].clone();
                IrcEvent {
                    server_id: server_id.to_string(),
                    kind: "invite".to_string(),
                    channel: Some(channel),
                    nick: parsed.nick(),
                    ident: parsed.prefix.clone(),
                    content: Some(target),
                    time: time_tag.clone(),
                    msgid: msgid_tag.clone(),
                    users: None,
                    raw: None,
                    status: None,
                }
                .emit(app);
            }
        }
        _ => {
            // Generic numeric replies (including WHOIS numerics like 311-319, 330, 671, etc.)
            // Build a readable line that includes both params and trailing text so we don't
            // lose important fields like nick/user/host.
            if cmd.chars().all(|c| c.is_ascii_digit()) {
                let mut parts = Vec::new();
                if !parsed.params.is_empty() {
                    parts.push(parsed.params.join(" "));
                }
                if let Some(trailing) = parsed.trailing.clone() {
                    parts.push(trailing);
                }
                let text = parts.join(" ");
                if !text.is_empty() {
                    IrcEvent {
                        server_id: server_id.to_string(),
                        kind: "server".to_string(),
                        channel: None,
                        nick: None,
                        ident: None,
                        content: Some(text),
                        time: time_tag.clone(),
                        msgid: msgid_tag.clone(),
                        users: None,
                        raw: None,
                        status: None,
                    }
                    .emit(app);
                }
            }
        }
    }
}

#[derive(Default)]
struct Parsed {
    prefix: Option<String>,
    command: String,
    params: Vec<String>,
    trailing: Option<String>,
    // IRCv3 message tags (key=value)
    tags: HashMap<String, String>,
}

impl Parsed {
    fn nick(&self) -> Option<String> {
        self.prefix
            .as_ref()
            .and_then(|p| p.split('!').next())
            .map(|s| s.to_string())
    }
}

fn parse_irc(raw: &str) -> Parsed {
    let mut rest = raw.trim_end().to_string();
    let mut parsed = Parsed::default();

    // Parse IRCv3 message tags
    if let Some(without_at) = rest.strip_prefix('@') {
        if let Some((tags_part, next)) = without_at.split_once(' ') {
            for tag in tags_part.split(';') {
                if tag.is_empty() {
                    continue;
                }
                let mut iter = tag.splitn(2, '=');
                let key = iter.next().unwrap().to_string();
                let value_raw = iter.next().unwrap_or("");
                // Minimal unescaping per IRCv3 spec
                let value = value_raw
                    .replace("\\:", ";")
                    .replace("\\s", " ")
                    .replace("\\\\", "\\")
                    .replace("\\r", "\r")
                    .replace("\\n", "\n");
                parsed.tags.insert(key, value);
            }
            rest = next.to_string();
        } else {
            rest = without_at.to_string();
        }
    }

    if let Some(without_colon) = rest.strip_prefix(':') {
        if let Some((prefix, next)) = without_colon.split_once(' ') {
            parsed.prefix = Some(prefix.to_string());
            rest = next.to_string();
        }
    }

    let (head, trailing) = if let Some((h, t)) = rest.split_once(" :") {
        (h.to_string(), Some(t.to_string()))
    } else {
        (rest, None)
    };

    let mut parts = head.split_whitespace();
    parsed.command = parts.next().unwrap_or_default().to_string();
    parsed.params = parts.map(|v| v.to_string()).collect();
    parsed.trailing = trailing;
    parsed
}

