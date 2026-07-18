package service

import "testing"

func TestStripHTML(t *testing.T) {
	cases := []struct {
		name string
		html string
		want string
	}{
		{"nested tags removed", "<p>Text <b>with</b> tags</p>", "Text with tags"},
		{"nested tags 2", "<div>Hello <span>world</span>!</div>", "Hello world !"},
		{"empty stays empty", "", ""},
		{"whitespace normalized", "  hello    world  ", "hello world"},
		{"only html tags", "<div><span></span></div>", ""},
		{"plain text unchanged", "Hello world", "Hello world"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := StripHTML(tc.html)
			if got != tc.want {
				t.Errorf("StripHTML(%q) = %q, want %q", tc.html, got, tc.want)
			}
		})
	}
}
