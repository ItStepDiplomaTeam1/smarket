use axum::{extract::{Query, State}, http::StatusCode, Json};
use meilisearch_sdk::client::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{error, info};

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

#[derive(Deserialize, Debug)]
pub struct ProductFilters {
    #[serde(default)]
    pub category_id: Option<i32>,
    #[serde(default)]
    pub category_slug: Option<String>,
    #[serde(default)]
    pub store_id: Option<String>,
    #[serde(default)]
    pub retail_chain: Option<String>,
    #[serde(default)]
    pub price_min: Option<f64>,
    #[serde(default)]
    pub price_max: Option<f64>,
    
    #[serde(default, deserialize_with = "deserialize_bool_opt")]
    pub in_stock: Option<bool>,
}

#[derive(Deserialize, Debug)]
pub struct SearchRequest {
    pub q: Option<String>,

    pub sort: Option<String>,

    pub limit: Option<usize>,

    pub offset: Option<usize>,

    #[serde(flatten)]
    pub filters: ProductFilters,
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

    let mut filter_conditions: Vec<String> = Vec::new();
    let filters = &payload.filters;

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

    search_builder.with_hits_per_page(limit);

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

    match search_builder.execute::<Value>().await {
        Ok(results) => {
            let nb_hits = results.hits.len();
            let total_hits = results.estimated_total_hits;
            let processing_time_ms = results.processing_time_ms;


            let hits: Vec<Value> = results.hits.into_iter().map(|hit| hit.result).collect();

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

