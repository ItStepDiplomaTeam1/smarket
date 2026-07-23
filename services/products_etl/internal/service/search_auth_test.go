package service

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestPostWithRetrySendsInternalToken(t *testing.T) {
	const expectedToken = "test-internal-token"

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("X-Internal-Token"); got != expectedToken {
			t.Fatalf("X-Internal-Token = %q, want %q", got, expectedToken)
		}
		if got := r.Header.Get("Content-Type"); got != "application/json" {
			t.Fatalf("Content-Type = %q, want application/json", got)
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("read request body: %v", err)
		}
		if string(body) != `{"documents":[]}` {
			t.Fatalf("body = %q", string(body))
		}
		w.WriteHeader(http.StatusAccepted)
	}))
	defer server.Close()

	response, err := postWithRetry(
		server.URL,
		[]byte(`{"documents":[]}`),
		expectedToken,
		1,
	)
	if err != nil {
		t.Fatalf("postWithRetry returned error: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusAccepted {
		t.Fatalf("status = %d, want %d", response.StatusCode, http.StatusAccepted)
	}
}
