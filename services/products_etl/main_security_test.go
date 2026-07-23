package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestValidAdminKey(t *testing.T) {
	t.Parallel()

	if !validAdminKey("correct-secret", "correct-secret") {
		t.Fatal("matching admin keys must be accepted")
	}
	if validAdminKey("wrong-secret", "correct-secret") {
		t.Fatal("different admin keys must be rejected")
	}
	if validAdminKey("", "correct-secret") {
		t.Fatal("empty admin key must be rejected")
	}
}

func TestBackfillRequiresAdminKey(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodPost, "/backfill", nil)
	response := httptest.NewRecorder()

	backfillHandler(nil, "http://search", "search-token", "admin-secret").
		ServeHTTP(response, request)

	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected status %d, got %d", http.StatusUnauthorized, response.Code)
	}
}
