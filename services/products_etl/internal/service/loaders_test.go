package service

import (
	"encoding/json"
	"testing"
)

func TestProductsPageMetaSupportsCurrentZakazShape(t *testing.T) {
	var meta productsPageMeta
	if err := json.Unmarshal(
		[]byte(`{"count":778,"count_available":778,"results":[{"sku":"1"},{"sku":"2"}]}`),
		&meta,
	); err != nil {
		t.Fatalf("unmarshal current Zakaz response: %v", err)
	}

	if meta.Count != 778 {
		t.Fatalf("Count = %d, want 778", meta.Count)
	}
	if len(meta.Results) != 2 {
		t.Fatalf("len(Results) = %d, want 2", len(meta.Results))
	}
	if meta.Next != nil {
		t.Fatalf("Next = %v, want nil for current Zakaz response", meta.Next)
	}
}

func TestHasMoreProductPagesUsesCountWhenNextIsMissing(t *testing.T) {
	meta := &productsPageMeta{
		Count:   61,
		Results: []json.RawMessage{json.RawMessage(`{}`)},
	}

	if !hasMoreProductPages(meta, 30) {
		t.Fatal("expected another page after 30 of 61 products")
	}
	if !hasMoreProductPages(meta, 60) {
		t.Fatal("expected final page after 60 of 61 products")
	}
	if hasMoreProductPages(meta, 61) {
		t.Fatal("did not expect another page after all 61 products")
	}
}

func TestHasMoreProductPagesFallsBackToLegacyNext(t *testing.T) {
	next := "https://stores-api.zakaz.ua/next"
	meta := &productsPageMeta{
		Next:    &next,
		Results: []json.RawMessage{json.RawMessage(`{}`)},
	}

	if !hasMoreProductPages(meta, 1) {
		t.Fatal("expected legacy next link to continue pagination")
	}

	meta.Results = nil
	if hasMoreProductPages(meta, 1) {
		t.Fatal("did not expect another page after an empty result set")
	}
}
