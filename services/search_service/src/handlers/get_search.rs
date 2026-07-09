use axum::{extract::{Query, State}, http::StatusCode, Json};
use meilisearch_sdk::client::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::{SystemTime, UNIX_EPOCH};
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
    /// Multiple retail chains — combined with OR logic in Meilisearch filter.
    pub retail_chains: Vec<String>,
    pub price_min: Option<f64>,
    pub price_max: Option<f64>,
    pub in_stock: Option<bool>,
    /// offer types: "promo", "save", "new" — OR-combined.
    pub offer_types: Vec<String>,
    /// Cross-store top-level category filter (main_category_id integer).
    pub main_category_id: Option<i32>,
    /// Subcategory slugs (multi-value) to filter.
    pub subcategory_slugs: Vec<String>,
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

fn deserialize_string_vec<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    // Axum passes repeated query params as a single string joined by commas internally.
    // This deserializer handles both Vec<String> (repeated keys) and a single comma-separated value.
    let raw = Option::<serde_json::Value>::deserialize(deserializer)?;
    match raw {
        None => Ok(vec![]),
        Some(serde_json::Value::Array(arr)) => Ok(
            arr.into_iter()
                .filter_map(|v| v.as_str().map(|s| s.to_owned()))
                .filter(|s| !s.is_empty())
                .collect()
        ),
        Some(serde_json::Value::String(s)) => Ok(
            s.split(',')
                .map(|p| p.trim().to_owned())
                .filter(|s| !s.is_empty())
                .collect()
        ),
        Some(_) => Ok(vec![]),
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
    /// Multi-value: ?retail_chain=atb&retail_chain=silpo — OR logic across chains.
    #[serde(default, deserialize_with = "deserialize_string_vec")]
    pub retail_chain: Vec<String>,
    #[serde(default, deserialize_with = "deserialize_f64_opt")]
    pub price_min: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_f64_opt")]
    pub price_max: Option<f64>,
    #[serde(default, deserialize_with = "deserialize_bool_opt")]
    pub in_stock: Option<bool>,
    /// offer_type: "promo", "save", "new" — OR logic across types.
    #[serde(default, deserialize_with = "deserialize_string_vec")]
    pub offer_type: Vec<String>,
    /// Cross-store top-level category filter.
    #[serde(default, deserialize_with = "deserialize_i32_opt")]
    pub main_category_id: Option<i32>,
    /// subcategory_slug: "molochni-produkty" etc. — OR logic across types.
    #[serde(default, deserialize_with = "deserialize_string_vec")]
    pub subcategory_slug: Vec<String>,
    
    #[serde(default, deserialize_with = "deserialize_string_vec")]
    pub discount_range: Vec<String>,
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
        retail_chains: payload.retail_chain.clone(),
        price_min: payload.price_min,
        price_max: payload.price_max,
        in_stock: payload.in_stock,
        offer_types: payload.offer_type.clone(),
        main_category_id: payload.main_category_id,
        subcategory_slugs: payload.subcategory_slug.clone(),
    };

    let mut filter_conditions: Vec<String> = vec!["is_hidden = false".to_string()];

    if let Some(cat_id) = filters.category_id {
        filter_conditions.push(format!("category_id = {}", cat_id));
    }

    // Map category_slug to main_category_id for frontend top-level categories
    let mut mapped_main_category_id = filters.main_category_id;
    let mut use_category_slug_filter = true;

    if let Some(ref cat_slug) = filters.category_slug {
        match cat_slug.as_str() {
            "drinks" => {
                mapped_main_category_id = Some(2);
                use_category_slug_filter = false;
            }
            "baby" => {
                mapped_main_category_id = Some(8);
                use_category_slug_filter = false;
            }
            "chemistry" => {
                mapped_main_category_id = Some(9);
                use_category_slug_filter = false;
            }
            "beauty" => {
                mapped_main_category_id = Some(6);
                use_category_slug_filter = false;
            }
            "home" => {
                mapped_main_category_id = Some(5);
                use_category_slug_filter = false;
            }
            "zoo" => {
                mapped_main_category_id = Some(7);
                use_category_slug_filter = false;
            }
            "products" => {
                // "products" is the default/all category sentinel on the frontend
                use_category_slug_filter = false;
            }
            _ => {}
        }
    }

    if use_category_slug_filter {
        if let Some(ref cat_slug) = filters.category_slug {
            filter_conditions.push(format!("category_slug = \"{}\"", cat_slug));
        }
    }

    if let Some(ref store) = filters.store_id {
        filter_conditions.push(format!("store_id = \"{}\"", store));
    }

    // Multi-store filter: retail_chain IN ["atb", "silpo"]
    if !filters.retail_chains.is_empty() {
        if filters.retail_chains.len() == 1 {
            filter_conditions.push(format!("retail_chain = \"{}\"", filters.retail_chains[0]));
        } else {
            let in_clause = filters.retail_chains.iter()
                .map(|c| format!("\"{}\"", c))
                .collect::<Vec<_>>()
                .join(", ");
            filter_conditions.push(format!("retail_chain IN [{}]", in_clause));
        }
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

    // offer_type filter: promo/save => old_price IS NOT NULL; new => created_at_ts >= 14d ago
    if !filters.offer_types.is_empty() {
        let mut offer_parts: Vec<String> = Vec::new();
        let has_promo = filters.offer_types.iter().any(|t| t == "promo" || t == "save");
        let has_new   = filters.offer_types.iter().any(|t| t == "new");

        if has_promo {
            offer_parts.push("old_price IS NOT NULL".to_string());
        }
        if has_new {
            let fourteen_days_secs: i64 = 14 * 24 * 60 * 60;
            let now_unix = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            let cutoff = now_unix - fourteen_days_secs;
            offer_parts.push(format!("created_at_ts >= {}", cutoff));
        }

        if offer_parts.len() == 1 {
            filter_conditions.push(offer_parts[0].clone());
        } else if offer_parts.len() > 1 {
            filter_conditions.push(format!("({})", offer_parts.join(" OR ")));
        }
    }

    // discount_range filter: "10" => <= 10, "10-20", "20-30", "30+" => >= 30
    if !payload.discount_range.is_empty() {
        let mut discount_parts: Vec<String> = Vec::new();
        for dr in &payload.discount_range {
            match dr.as_str() {
                "10" => discount_parts.push("discount_percent <= 10".to_string()),
                "10-20" => discount_parts.push("(discount_percent >= 10 AND discount_percent <= 20)".to_string()),
                "20-30" => discount_parts.push("(discount_percent >= 20 AND discount_percent <= 30)".to_string()),
                "30+" => discount_parts.push("discount_percent >= 30".to_string()),
                _ => {}
            }
        }
        if discount_parts.len() == 1 {
            filter_conditions.push(discount_parts[0].clone());
        } else if discount_parts.len() > 1 {
            filter_conditions.push(format!("({})", discount_parts.join(" OR ")));
        }
    }

    // Cross-store top-level category filter
    if let Some(main_cat) = mapped_main_category_id {
        filter_conditions.push(format!("main_category_id = {}", main_cat));
    }

    // Subcategory prefix expansion and filter condition using IN operator
    if !filters.subcategory_slugs.is_empty() {
        let suffixes = [
            "",
            "-silpo",
            "-novus",
            "-eko-market",
            "-ekomarket",
            "-metro",
            "-chudomarket",
            "-megamarket",
            "-ultramarket",
            "-tavriav",
            "-cosmos",
            "-vostorg",
            "-kharkiv",
            "-epicentr",
            "-zaraz",
            "-torba",
            "-grono",
            "-winetime",
            "-ideal",
            "-onde",
        ];

        let get_subcategory_prefixes = |sub: &str| -> Vec<String> {
            match sub {
                "molochni-produkty" => vec![
                    "dairy-and-eggs".to_string(),
                    "molochni-produkty".to_string(),
                    "milk-cheese-eggs".to_string(),
                ],
                "myaso-ta-ptytsya" => vec![
                    "meat-fish-poultry".to_string(),
                    "meat-and-sausages".to_string(),
                    "myaso-ta-ptytsya".to_string(),
                ],
                "hlib-ta-vypichka" => vec!["bakery".to_string()],
                "vegetables" => vec![
                    "fruits-and-vegetables".to_string(),
                    "vegetables-and-fruits".to_string(),
                ],
                "fish" => vec!["fish-and-seafood".to_string()],
                "grains" => vec![
                    "grocery".to_string(),
                    "grocery-and-sweets".to_string(),
                    "packets-cereals".to_string(),
                    "pulses-and-grain".to_string(),
                    "pasta".to_string(),
                ],
                "frozen" => vec![
                    "frozen".to_string(),
                    "frozen-food".to_string(),
                ],
                "cans" => vec![
                    "canned-food".to_string(),
                    "tins-jars-cooking".to_string(),
                    "canned-food-oil-vinegar".to_string(),
                ],
                other => vec![other.to_string()],
            }
        };

        let mut expanded_slugs: Vec<String> = Vec::new();
        for sub_slug in &filters.subcategory_slugs {
            let prefixes = get_subcategory_prefixes(sub_slug);
            for prefix in &prefixes {
                for suffix in &suffixes {
                    expanded_slugs.push(format!("{}{}", prefix, suffix));
                }
            }
        }

        if !expanded_slugs.is_empty() {
            let formatted_slugs: Vec<String> = expanded_slugs.into_iter()
                .map(|s| format!("\"{}\"", s))
                .collect();
            filter_conditions.push(format!("category_slug IN [{}]", formatted_slugs.join(", ")));
        }
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

    search_builder.with_facets(&[
        "main_category_id",
        "retail_chain",
        "category_slug",
        "discount_percent",
    ]);

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
                    "main_category_id": doc.main_category_id,
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
                "facets": results.facet_distribution,
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