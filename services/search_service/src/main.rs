mod handlers;

use std::env;
use std::net::SocketAddr;
use tracing::info;
use chrono::Utc;

use handlers::get_search::search_handler;
use handlers::post_index::{index_handler, delete_handler};

struct Config {
    service_port: u16,
    meilisearch_host: String,
    meilisearch_api_key: String,
}

impl Config {
    fn from_env() -> Self {
        let port = env::var("PORT")
            .unwrap_or_default()
            .parse::<u16>()
            .unwrap_or(8083);

        let meilisearch_host = env::var("MEILISEARCH_HOST").unwrap_or_else(|_| {
            eprintln!("WARNING: MEILISEARCH_HOST not set. Defaulting to http://meilisearch:7700");
            "http://meilisearch:7700".to_string()
        });

        let meilisearch_api_key = env::var("MEILISEARCH_API_KEY").unwrap_or_else(|_| {
            eprintln!("WARNING: MEILISEARCH_API_KEY not set. Defaulting to masterKey123");
            "masterKey123".to_string()
        });

        Self {
            service_port: port,
            meilisearch_host,
            meilisearch_api_key,
        }
    }
}


async fn configure_meilisearch_index(client: &meilisearch_sdk::client::Client) {
    use meilisearch_sdk::settings::{Settings, PaginationSetting};

    let settings = Settings::new()
        .with_searchable_attributes(["title", "brand", "category_name", "canonical_ean"])
        .with_filterable_attributes([
            "category_id",
            "category_slug",
            "store_id",
            "retail_chain",
            "price",
            "in_stock",
            "is_hidden",
            "main_category_id",
            "old_price",
            "created_at_ts",
        ])
        .with_sortable_attributes(["price", "title"])
        .with_displayed_attributes(["*"])
        .with_pagination(PaginationSetting {
            max_total_hits: 100000,
        });

    let index = client.index("products");

    match index.set_settings(&settings).await {
        Ok(task) => {
            info!(
                "[startup] Налаштування індексу 'products' застосовано. Task UID: {:?}",
                task.task_uid
            );
        }
        Err(e) => {
            eprintln!("WARNING: Не вдалось налаштувати Meilisearch index: {e:?}");
        }
    }
}

#[tokio::main]
async fn main() {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();

    let config = Config::from_env();

    let client = meilisearch_sdk::client::Client::new(
        config.meilisearch_host.clone(),
        Some(config.meilisearch_api_key.clone()),
    )
    .unwrap();

    info!("Meilisearch client initialized: {}", config.meilisearch_host);

    configure_meilisearch_index(&client).await;

    use axum::{routing::{get, post, delete}, Json, Router};
    use serde_json::json;

    let api_routes = Router::new()
        .route(
            "/health",
            get(|| async {
                Json(json!({
                    "status": "up",
                    "service": "search_service",
                    "current_time": Utc::now(),
                }))
            }),
        )
        .route("/search", get(search_handler))
        .route("/index", post(index_handler))
        .route("/index/:id", delete(delete_handler))
        .with_state(client);

    let app = Router::new().nest("/api/v1", api_routes);

    let addr: SocketAddr = format!("0.0.0.0:{}", config.service_port)
        .parse()
        .unwrap();

    info!("Search service starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
