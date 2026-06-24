use std::env;
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tracing::{info, log};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use chrono::{Utc, Local};

struct Config {
    service_port:u16,
    meilisearch_host: String,
    meilisearch_api_key: String,
    log_level: String
}

impl Config {
    fn from_env() -> Result<Self, env::VarError> {
        let port = env::var("PORT")
            .unwrap_or_default()
            .parse::<u16>()
            .unwrap_or(3000);

        Ok(Self {
            service_port: port,
            meilisearch_host: env::var("MEILISEARCH_HOST")?,
            meilisearch_api_key: env::var("MEILISEARCH_API_KEY")?,
            log_level: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        })
    }
}


#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();

    let config = Config::from_env().expect("Failed to load config from env file.");

    let _client = meilisearch_sdk::client::Client::new(
        config.meilisearch_host.clone(),
        Some(config.meilisearch_api_key.clone()),
    ).unwrap();
    info!("Meilisearch client initialized successfully.");

    use axum::{routing::get, Json, Router};
    use serde_json::{json, Value};

    let app = Router::new().route("/health", get(|| async {
        Json(json!({ "status": "up", "current_time":  Utc::now() }))
    }));
}

