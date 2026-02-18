mod irc;
use std::process::Command;
use keyring::Entry;

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

#[allow(non_snake_case)]
#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
  if !(url.starts_with("http://") || url.starts_with("https://")) {
    return Err("Only http(s) URLs are allowed".to_string());
  }

  #[cfg(target_os = "windows")]
  {
    Command::new("cmd")
      .args(["/C", "start", "", &url])
      .spawn()
      .map_err(|e| format!("Failed to open URL: {e}"))?;
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
      .arg(&url)
      .spawn()
      .map_err(|e| format!("Failed to open URL: {e}"))?;
  }

  #[cfg(all(unix, not(target_os = "macos")))]
  {
    Command::new("xdg-open")
      .arg(&url)
      .spawn()
      .map_err(|e| format!("Failed to open URL: {e}"))?;
  }

  Ok(())
}

fn secret_entry(app: &tauri::AppHandle, server_id: &str, secret_name: &str) -> Result<Entry, String> {
  let service = app.config().identifier.clone();
  let account = format!("patchcord:{server_id}:{secret_name}");
  Entry::new(&service, &account).map_err(|e| format!("Secure storage init failed: {e}"))
}

#[allow(non_snake_case)]
#[tauri::command]
async fn secure_set_server_secret(
  app: tauri::AppHandle,
  serverId: String,
  secretName: String,
  value: String,
) -> Result<(), String> {
  let entry = secret_entry(&app, &serverId, &secretName)?;
  entry
    .set_password(&value)
    .map_err(|e| format!("Secure storage write failed: {e}"))
}

#[allow(non_snake_case)]
#[tauri::command]
async fn secure_get_server_secret(
  app: tauri::AppHandle,
  serverId: String,
  secretName: String,
) -> Result<Option<String>, String> {
  let entry = secret_entry(&app, &serverId, &secretName)?;
  match entry.get_password() {
    Ok(v) => Ok(Some(v)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(e) => Err(format!("Secure storage read failed: {e}")),
  }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn secure_delete_server_secret(
  app: tauri::AppHandle,
  serverId: String,
  secretName: String,
) -> Result<(), String> {
  let entry = secret_entry(&app, &serverId, &secretName)?;
  match entry.delete_credential() {
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(e) => Err(format!("Secure storage delete failed: {e}")),
  }
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
      irc_raw,
      open_external_url,
      secure_set_server_secret,
      secure_get_server_secret,
      secure_delete_server_secret
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
