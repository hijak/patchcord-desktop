mod irc;

// Allow camelCase parameter names here so they match
// the keys sent from the frontend `invoke` calls.
#[allow(non_snake_case)]
#[tauri::command]
async fn irc_connect(
  app: tauri::AppHandle,
  serverId: String,
  host: String,
  port: u16,
  ssl: bool,
  allowInvalidCerts: bool,
  nickname: String,
  username: String,
  realName: String,
  password: Option<String>,
  autoJoinChannels: Vec<String>,
) -> Result<(), String> {
  // Map camelCase arguments from the frontend to the snake_case
  // parameters expected by the internal IRC module.
  let server_id = serverId;
  let real_name = realName;
  let auto_join_channels = autoJoinChannels;
  let allow_invalid_certs = allowInvalidCerts;

  irc::connect(
    app,
    server_id,
    host,
    port,
    ssl,
    allow_invalid_certs,
    nickname,
    username,
    real_name,
    password,
    auto_join_channels,
  )
  .await
}

#[allow(non_snake_case)]
#[tauri::command]
async fn irc_disconnect(serverId: String, reason: Option<String>) -> Result<(), String> {
  irc::disconnect(serverId, reason).await
}

#[allow(non_snake_case)]
#[tauri::command]
async fn irc_join(serverId: String, channel: String) -> Result<(), String> {
  irc::join(serverId, channel).await
}

#[allow(non_snake_case)]
#[tauri::command]
async fn irc_part(serverId: String, channel: String, reason: Option<String>) -> Result<(), String> {
  irc::part(serverId, channel, reason).await
}

#[allow(non_snake_case)]
#[tauri::command]
async fn irc_privmsg(serverId: String, target: String, message: String) -> Result<(), String> {
  irc::privmsg(serverId, target, message).await
}

#[allow(non_snake_case)]
#[tauri::command]
async fn irc_raw(serverId: String, line: String) -> Result<(), String> {
  irc::raw(serverId, line).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      irc_connect,
      irc_disconnect,
      irc_join,
      irc_part,
      irc_privmsg,
      irc_raw
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
