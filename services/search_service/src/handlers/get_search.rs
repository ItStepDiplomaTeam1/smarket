use axum::{extract::{Query, State}, http::StatusCode, Json};
use meilisearch_sdk::client::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{error, info};

use super::post_index::ProductDocument;

fn deserialize_bool_opt<'de, D>(deserializer: D) -> Result<Option<bool>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(serde::Deserialize)]
    #[serde(untagged)]
    enum BoolOrString {
        Bool(bool),
        String(String),
    }

    let val = Option::<BoolOrString>::deserialize(deserializer)?;
    match val {
        Some(BoolOrString::Bool(b)) => Ok(Some(b)),
        Some(BoolOrString::String(s)) => match s.as_str() {
            "true" | "1" => Ok(Some(true)),
            "false" | "0" => Ok(Some(false)),
            "" => Ok(None),
            other => other.parse::<bool>().map(Some).map_err(serde::de::Error::custom),
        },
        None => Ok(None),
    }
}

#[derive(Debug)]
pub struct ProductFilters {
    pub category_id: Option<i32>,
    pub category_slug: Option<String>,
    pub store_id: Option<String>,
    pub retail_chain: Option<String>,
    pub price_min: Option<f64>,
    pub price_max: Option<f64>,
    pub in_stock: Option<bool>,
}

fn deserialize_f64_opt<'de, D>(deserializer: D) -> Result<Option<f64>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(serde::Deserialize)]
    #[serde(untagged)]
    enum F64OrString {
        Number(f64),
        String(String),
    }

    let val = Option::<F64OrString>::deserialize(deserializer)?;
    match val {
        Some(F64OrString::Number(n)) => Ok(Some(n)),
        Some(F64OrString::String(s)) => {
            if s.is_empty() {
                Ok(None)
            } else {
                s.parse::<f64>().map(Some).map_err(serde::de::Error::custom)
            }
        }
        None => Ok(None),
    }
}

fn deserialize_i32_opt<'de, D>(deserializer: D) -> Result<Option<i32>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(serde::Deserialize)]
    #[serde(untagged)]
    enum I32OrString {
        Number(i32),
        String(String),
    }

    let val = Option::<I32OrString>::deserialize(deserializer)?;
    match val {
        Some(I32OrString::Number(n)) => Ok(Some(n)),
        Some(I32OrString::String(s)) => {
            if s.is_empty() {
                Ok(None)
            } else {
                s.parse::<i32>().map(Some).map_err(serde::de::Error::custom)
            }
        }
        None => Ok(None),
    }
}

fn deserialize_usize_opt<'de, D>(deserializer: D) -> Result<Option<usize>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(serde::Deserialize)]
    #[serde(untagged)]
    enum UsizeOrString {
        Number(usize),
        String(String),
    }

    let val = Option::<UsizeOrString>::deserialize(deserializer)?;
    match val {
        Some(UsizeOrString::Number(n)) => Ok(Some(n)),
        Some(UsizeOrString::String(s)) => {
            if s.is_empty() {
                Ok(None)
            } else {
                s.parse::<usize>().map(Some).map_err(serde::de::Error::custom)
            }
        }
        None => Ok(None),
    }
}

#[derive(Deserialize, Debug)]
pub struct SearchRequest {
    pub q: Option<String>,

    pub sort: Option<String>,

    #[serde(default, deserialize_with = "deserialize_usize_opt")]
    pub limit: Option<usize>,

    #[serde(default, deserialize_with = "deserialize_usize_opt")]
    pub offset: Option<usize>,

    #[serde(default, deserialize_with = "deserialize_i32_opt")]
    pub category_id: Option<i32>,
    #[serde(default)]
    pub category_slug: Option<String>,
    #[serde(default)]
    pub store_id: Option<String>,
    #[serde(default)]
    pub retail_chain: Option<String>,
    #[serde(default, deserialize_with = "deserialize_f64_opt")]
    pub price_min: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_f64_opt")]
    pub price_max: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_bool_opt")]
    pub in_stock: Option<bool>,
}

#[derive(Serialize)]
pub struct SearchResponse {
    hits: Vec<Value>,
    total_hits: Option<usize>,
    offset: usize,
    limit: usize,
    nb_hits: usize,
    processing_time_ms: usize,
    query: String,
}

pub async fn search_handler(
    State(client): State<Client>,
    Query(payload): Query<SearchRequest>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let limit = payload.limit.unwrap_or(20).min(100);
    let offset = payload.offset.unwrap_or(0);
    let query_str = payload.q.clone().unwrap_or_default();

    info!(
        "[search] query={:?} limit={} offset={}",
        payload.q, limit, offset
    );

    let filters = ProductFilters {
        category_id: payload.category_id,
        category_slug: payload.category_slug.clone(),
        store_id: payload.store_id.clone(),
        retail_chain: payload.retail_chain.clone(),
        price_min: payload.price_min,
        price_max: payload.price_max,
        in_stock: payload.in_stock,
    };

    let mut filter_conditions: Vec<String> = Vec::new();

    if let Some(cat_id) = filters.category_id {
        filter_conditions.push(format!("category_id = {}", cat_id));
    }
    if let Some(ref cat_slug) = filters.category_slug {
        filter_conditions.push(format!("category_slug = \"{}\"", cat_slug));
    }
    if let Some(ref store) = filters.store_id {
        filter_conditions.push(format!("store_id = \"{}\"", store));
    }
    if let Some(ref chain) = filters.retail_chain {
        filter_conditions.push(format!("retail_chain = \"{}\"", chain));
    }
    if let Some(p_min) = filters.price_min {
        filter_conditions.push(format!("price >= {}", p_min));
    }
    if let Some(p_max) = filters.price_max {
        filter_conditions.push(format!("price <= {}", p_max));
    }
    if let Some(stock) = filters.in_stock {
        filter_conditions.push(format!("in_stock = {}", stock));
    }

    let meili_filter = if filter_conditions.is_empty() {
        None
    } else {
        Some(filter_conditions.join(" AND "))
    };

    let index = client.index("products");
    let mut search_builder = index.search();

    search_builder.with_query(&query_str);
    search_builder.with_limit(limit);
    search_builder.with_offset(offset);

    let filter_str: String;
    if let Some(ref f) = meili_filter {
        filter_str = f.clone();
        search_builder.with_filter(&filter_str);
    }

    let sort_query = payload.sort.as_ref().map(|s| vec![s.clone()]).unwrap_or_default();
    let sort_refs: Vec<&str> = sort_query.iter().map(|s| s.as_str()).collect();
    if !sort_refs.is_empty() {
        search_builder.with_sort(&sort_refs);
    }

    match search_builder.execute::<ProductDocument>().await {
        Ok(results) => {
            let nb_hits = results.hits.len();
            let total_hits = results.estimated_total_hits;
            let processing_time_ms = results.processing_time_ms;


            let hits: Vec<Value> = results.hits.into_iter().map(|hit| {
                let doc = hit.result;
                json!({
                    "id": doc.id,
                    "title": doc.title,
                    "brand": doc.brand,
                    "unit": doc.unit,
                    "weight": doc.weight,
                    "image_url": doc.image_url,
                    "canonical_ean": doc.canonical_ean,
                    "category_id": doc.category_id,
                    "category_slug": doc.category_slug,
                    "category_name": doc.category_name,
                    "offers": [{
                        "store": {
                            "id": doc.store_id,
                            "name": doc.store_name,
                            "retail_chain": doc.retail_chain,
                        },
                        "price": doc.price,
                        "old_price": doc.old_price,
                        "in_stock": doc.in_stock,
                    }]
                })
            }).collect();

            info!(
                "[search] Знайдено {} результатів (estimated total: {:?}), за {}мс",
                nb_hits, total_hits, processing_time_ms
            );

            Ok(Json(json!({
                "hits": hits,
                "total_hits": total_hits,
                "offset": offset,
                "limit": limit,
                "nb_hits": nb_hits,
                "processing_time_ms": processing_time_ms,
                "query": query_str,
            })))
        }
        Err(err) => {
            error!("[search] Помилка Meilisearch: {:?}", err);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Search failed", "detail": err.to_string() })),
            ))
        }
    }
}


// Force rebuild