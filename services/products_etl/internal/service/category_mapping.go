package service

import (
	"log"
	"regexp"
	"strings"
)

// storeChainSuffixRe matches the trailing store-chain suffix in a Zakaz.ua category slug.
// Compiled once at package init; safe for concurrent use.
var storeChainSuffixRe = regexp.MustCompile(
	`-(novus|ultramarket|zaraz|alcohub|auchan|metro|tavriav|cosmos|vostorg|kharkiv|chudomarket|biotus|epicentr|ekomarket|torba|masterzoo|megamarket|grono|winetime|ideal|onde)$`,
)

// mainCategoryMap maps a normalized (store-suffix-stripped) category slug to one of
// 10 universal main category IDs used across the Smarket frontend.
//
// ID legend:
//  1 — Products (Продукти харчування)
//  2 — Drinks (Напої)
//  3 — Snacks (Солодощі та снеки)
//  4 — Alcohol & Tobacco (Алкоголь та тютюн)
//  5 — Household (Товари для дому)
//  6 — Health & Beauty (Здоров'я та догляд)
//  7 — Pets (Зоотовари)
//  8 — Babies (Дитячі товари)
//  9 — Hobby & Rest (Хобі та відпочинок)
// 10 — Promo (Акції та промо)
var mainCategoryMap = map[string]int{
	// 1 — Products
	"fruits-and-vegetables":    1,
	"meat-fish-poultry":        1,
	"fish-and-seafood":         1,
	"fish":                     1,
	"dairy-and-eggs":           1,
	"grocery":                  1,
	"packets-cereals":          1,
	"grocery-and-sweets":       1,
	"bakery":                   1,
	"canned-food":              1,
	"tins-jars-cooking":        1,
	"sauces-and-spices":        1,
	"frozen":                   1,
	"farm-products":            1,
	"gourmet":                  1,
	"world-cuisine":            1,
	"own-production":           1,
	"food-drink":               1,
	"ready-meals":              1,
	"canned-food-oil-vinegar":  1,

	// 2 — Drinks
	"drinks":     2,
	"hot-drinks": 2,
	"minerals":   2,

	// 3 — Snacks
	"snacks-and-sweets": 3,
	"sweets-and-snacks": 3,
	"crisps-and-snacks": 3,
	"snacks":            3,

	// 4 — Alcohol & Tobacco
	"alcohol":                       4,
	"eighteen-plus":                 4,
	"hard-drinks":                   4,
	"wine":                          4,
	"beer":                          4,
	"whiskey":                       4,
	"champagne-sparkling-wine":      4,
	"liqueurs-tinctures-balsams":    4,
	"cider-and-low-alcohol-drinks":  4,
	"alcohol-gift-sets":             4,
	"tobacco-goods":                 4,

	// 5 — Household
	"chemicals":                   5,
	"household-chemicals":         5,
	"household-goods":             5,
	"household-and-cleaning":      5,
	"kitchenware":                 5,
	"interior-and-textiles":       5,
	"home-interior-and-textiles":  5,
	"home-appliances":             5,
	"household-and-pets-care":     5,

	// 6 — Health & Beauty
	"personal-hygiene":                 6,
	"care-and-hygiene":                 6,
	"cosmetics-and-care":               6,
	"health-and-lifestyle":             6,
	"bioproducts-and-diabetic-goods":   6,
	"superfud":                         6,
	"vitamins":                         6,
	"fish-oil":                         6,
	"antioxidants":                     6,
	"medicinal-mushrooms-and-herbs":    6,
	"preparations-for-digestion":       6,
	"vitamins-by-symptoms":             6,
	"face-and-body-cosmetics":          6,
	"sports-nutrition":                 6,

	// 7 — Pets
	"for-animals":    7,
	"pet-supplement": 7,
	"cats":           7,
	"dogs":           7,
	"birds":          7,
	"rodents":        7,
	"fishkeeping":    7,
	"terrarium":      7,

	// 8 — Babies
	"babies": 8,

	// 9 — Hobby & Rest
	"hobby":         9,
	"hobby-and-rest": 9,
	"stationery":    9,
	"all-stationery": 9,
	"clothes-and-shoes": 9,
	"fishki":        9,

	// 10 — Promo
	"discount-love":    10,
	"low-price":        10,
	"low-prices":       10,
	"special-offerings": 10,
	"special-offers":   10,
	"recommends":       10,
	"accoutrements":    10,
}

// ResolveMainCategoryID maps a raw Zakaz.ua category slug to one of the 10 universal
// main category IDs used across the Smarket frontend.
//
// Steps:
//  1. Lowercase the slug.
//  2. Strip any trailing store-chain suffix (e.g. "-auchan", "-metro").
//  3. Look up the normalized slug in the static map.
//  4. Fall back to 1 (Products) if no match is found.
func ResolveMainCategoryID(slug string) int {
	normalized := strings.ToLower(slug)
	normalized = storeChainSuffixRe.ReplaceAllString(normalized, "")

	if id, ok := mainCategoryMap[normalized]; ok {
		return id
	}

	log.Printf("[CategoryMapping] WARN: slug %q (normalized: %q) не знайдено в mainCategoryMap, використовуємо fallback main_category_id=1", slug, normalized)
	return 1
}
