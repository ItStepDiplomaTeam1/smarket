package service

import (
	"regexp"
	"strings"
)

// StripHTML removes all HTML tags from product descriptions and normalizes whitespace.
func StripHTML(s string) string {
	if s == "" {
		return ""
	}

	// Remove all HTML tags
	re := regexp.MustCompile(`<[^>]*>`)
	cleaned := re.ReplaceAllString(s, " ")

	// Normalize whitespace
	words := strings.Fields(cleaned)
	return strings.Join(words, " ")
}
