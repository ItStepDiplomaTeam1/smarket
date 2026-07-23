use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use meilisearch_sdk::client::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{error, info, warn};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ProductDocument {
    pub id: i64,

    pub title: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub brand: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<f64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical_ean: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<i32>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_slug: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_name: Option<String>,

    /// main_category_id — cross-store top-level category identifier (1–10).
    /// Set by products_etl, used for category browsing without store-specific slugs.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub main_category_id: Option<i32>,

    pub store_id: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub store_name: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub retail_chain: Option<String>,

    pub price: f64,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub old_price: Option<f64>,

    pub in_stock: bool,

    #[serde(default)]
    pub is_hidden: bool,

    /// created_at_ts — Unix timestamp (seconds) of product creation.
    /// Used to filter "new" products (created in last 14 days).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at_ts: Option<i64>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub discount_percent: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PartialProductDocument {
    pub id: i64,
    pub is_hidden: bool,
}

#[derive(Debug, Deserialize)]
pub struct IndexRequest {
    pub documents: Vec<ProductDocument>,
}

#[derive(Debug, Deserialize)]
pub struct PatchIndexRequest {
    pub documents: Vec<PartialProductDocument>,
}

#[derive(Serialize)]
struct IndexResponse {
    status: &'static str,
    indexed: usize,
}

pub async fn index_handler(
    State(client): State<Client>,
    Json(payload): Json<IndexRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    if payload.documents.is_empty() {
        warn!("[index] Отримано порожній батч — ігноруємо");
        return Ok(Json(json!({ "status": "ok", "indexed": 0 })));
    }

    let count = payload.documents.len();
    info!(
        "[index] Отримано батч з {} документів для індексації",
        count
    );

    let index = client.index("products");

    match index.add_or_replace(&payload.documents, Some("id")).await {
        Ok(task) => {
            info!(
                "[index] Задачу на індексацію {} документів поставлено в чергу Meilisearch. Task UID: {:?}",
                count, task.task_uid
            );
            Ok(Json(json!({
                "status": "accepted",
                "indexed": count,
                "task_uid": task.task_uid,
            })))
        }
        Err(err) => {
            error!("[index] Помилка індексації в Meilisearch: {:?}", err);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Meilisearch indexing failed", "detail": err.to_string() })),
            ))
        }
    }
}

pub async fn patch_handler(
    State(client): State<Client>,
    Json(payload): Json<PatchIndexRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    if payload.documents.is_empty() {
        warn!("[patch] Отримано порожній запит на оновлення");
        return Ok(Json(json!({ "status": "ok", "updated": 0 })));
    }

    let count = payload.documents.len();
    info!(
        "[patch] Отримано {} документів для часткового оновлення",
        count
    );

    let index = client.index("products");

    match index.add_or_update(&payload.documents, Some("id")).await {
        Ok(task) => {
            info!(
                "[patch] Запит на оновлення {} документів відправлено в Meilisearch. Task UID: {:?}",
                count, task.task_uid
            );
            Ok(Json(json!({
                "status": "accepted",
                "updated": count,
                "task_uid": task.task_uid,
            })))
        }
        Err(err) => {
            error!(
                "[patch] Помилка часткового оновлення в Meilisearch: {:?}",
                err
            );
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(
                    json!({ "error": "Meilisearch partial update failed", "detail": err.to_string() }),
                ),
            ))
        }
    }
}

pub async fn delete_handler(
    State(client): State<Client>,
    Path(id): Path<i64>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    info!("[delete] Запит на видалення документа з ID: {}", id);

    let index = client.index("products");

    match index.delete_document(id).await {
        Ok(task) => {
            info!(
                "[delete] Задачу на видалення документа {} поставлено в чергу Meilisearch. Task UID: {:?}",
                id, task.task_uid
            );
            Ok(Json(json!({
                "status": "accepted",
                "id": id,
                "task_uid": task.task_uid,
            })))
        }
        Err(err) => {
            error!(
                "[delete] Помилка при видаленні документа {} з Meilisearch: {:?}",
                id, err
            );
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Meilisearch deletion failed", "detail": err.to_string() })),
            ))
        }
    }
}
