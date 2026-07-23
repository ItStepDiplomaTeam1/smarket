mod handlers;

use axum::{
    body::Body,
    extract::State,
    http::{header::HeaderName, Request, StatusCode},
    middleware::Next,
    response::Response,
};
use chrono::Utc;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use subtle::ConstantTimeEq;
use tracing::info;

use handlers::get_search::search_handler;
use handlers::post_index::{delete_handler, index_handler, patch_handler};

struct Config {
    service_port: u16,
    meilisearch_host: String,
    meilisearch_api_key: String,
    internal_api_token: Arc<str>,
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

        let meilisearch_api_key = env::var("MEILISEARCH_API_KEY")
            .unwrap_or_else(|_| panic!("MEILISEARCH_API_KEY must be configured"));
        let internal_api_token: Arc<str> = env::var("SEARCH_INTERNAL_API_TOKEN")
            .expect("SEARCH_INTERNAL_API_TOKEN must be configured")
            .into();
        assert!(
            internal_api_token.len() >= 32,
            "SEARCH_INTERNAL_API_TOKEN must contain at least 32 characters"
        );

        Self {
            service_port: port,
            meilisearch_host,
            meilisearch_api_key,
            internal_api_token,
        }
    }
}

static INTERNAL_TOKEN_HEADER: HeaderName = HeaderName::from_static("x-internal-token");

fn token_matches(expected: &str, supplied: &str) -> bool {
    expected.len() == supplied.len() && bool::from(expected.as_bytes().ct_eq(supplied.as_bytes()))
}

async fn require_internal_token(
    State(expected_token): State<Arc<str>>,
    request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let supplied_token = request
        .headers()
        .get(&INTERNAL_TOKEN_HEADER)
        .and_then(|value| value.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !token_matches(&expected_token, supplied_token) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(request).await)
}

async fn configure_meilisearch_index(client: &meilisearch_sdk::client::Client) {
    use meilisearch_sdk::settings::{PaginationSetting, Settings};

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
            "discount_percent",
        ])
        .with_sortable_attributes(["price", "title", "discount_percent"])
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

    info!(
        "Meilisearch client initialized: {}",
        config.meilisearch_host
    );

    configure_meilisearch_index(&client).await;

    use axum::{
        middleware,
        routing::{delete, get, patch, post},
        Json, Router,
    };
    use serde_json::json;

    let public_routes = Router::new()
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
        .route("/search", get(search_handler));

    let internal_routes = Router::new()
        .route("/index", post(index_handler).patch(patch_handler))
        .route("/index/:id", delete(delete_handler))
        .route_layer(middleware::from_fn_with_state(
            config.internal_api_token.clone(),
            require_internal_token,
        ));

    let api_routes = public_routes.merge(internal_routes).with_state(client);

    let app = Router::new().nest("/api/v1", api_routes);

    let addr: SocketAddr = format!("0.0.0.0:{}", config.service_port).parse().unwrap();

    info!("Search service starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[cfg(test)]
mod tests {
    use super::token_matches;

    #[test]
    fn internal_token_comparison_rejects_missing_or_changed_bytes() {
        assert!(token_matches("correct-token", "correct-token"));
        assert!(!token_matches("correct-token", "wrong-token"));
        assert!(!token_matches("correct-token", "correct-token-extra"));
    }
}
