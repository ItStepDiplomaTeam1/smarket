## 1. search_service — Add subcategory_slug parameter and deserializer (Rust)

- [x] 1.1 Add `subcategory_slug: Vec<String>` to `SearchRequest` in `services/search_service/src/handlers/get_search.rs`
- [x] 1.2 Add `subcategory_slugs: Vec<String>` to `ProductFilters` in `services/search_service/src/handlers/get_search.rs`

## 2. search_service — Implement category_slug mapping (Rust)

- [x] 2.1 Add lookup mapping in `search_handler` from frontend `category_slug` values (`drinks` -> 2, `baby` -> 8, `chemistry` -> 5, `home` -> 5, `beauty` -> 6, `zoo` -> 7) to `main_category_id`
- [x] 2.2 If the incoming `category_slug` matches one of the mapped categories, add `main_category_id = N` to Meilisearch filter conditions instead of `category_slug = "..."`

## 3. search_service — Implement subcategory_slug expansion (Rust)

- [x] 3.1 Define the list of active store suffixes in Rust (`-silpo`, `-novus`, `-eko-market`, `-ekomarket`, `-metro`, `-chudomarket`, `-megamarket`, `-ultramarket`, `-tavriav`, `-cosmos`, `-vostorg`, `-kharkiv`, `-epicentr`, `-zaraz`, `-torba`, `-grono`, `-winetime`, `-ideal`, `-onde`)
- [x] 3.3 Add mapping from frontend subcategory slugs (`molochni-produkty`, `myaso-ta-ptytsya`, `hlib-ta-vypichka`, `vegetables`, `fish`, `grains`, `frozen`, `cans`) to their database prefix lists (e.g. `hlib-ta-vypichka` -> `["bakery"]`, `grains` -> `["grocery", "packets-cereals", "pulses-and-grain", "pasta"]` etc.)
- [x] 3.4 In `search_handler`, for each value in `subcategory_slugs`, resolve the prefix list, suffix each prefix with all store suffixes (including empty string), and collect them into a flat list of category slugs
- [x] 3.5 Construct the Meilisearch filter condition using the `IN` operator (e.g., `category_slug IN ["molochni-produkty", "molochni-produkty-silpo", ...]`) and push it to `filter_conditions`

## 4. Verification & Testing

- [ ] 4.1 Test category filtering via category_slug: `curl "http://localhost:8083/search?category_slug=drinks&limit=5"` -> should return only drinks
- [ ] 4.2 Test subcategory filtering via subcategory_slug: `curl "http://localhost:8083/search?subcategory_slug=molochni-produkty&limit=5"` -> should return only dairy products
- [ ] 4.3 Test multiple subcategories: `curl "http://localhost:8083/search?subcategory_slug=molochni-produkty&subcategory_slug=frozen&limit=5"` -> should return dairy and frozen products
