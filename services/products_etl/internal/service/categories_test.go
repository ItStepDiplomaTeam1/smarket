package service

import "testing"

func TestResolveMainCategoryID(t *testing.T) {
	cases := []struct {
		name string
		slug string
		want int
	}{
		// Known slugs — exact matches from mainCategoryMap.
		{"dairy-and-eggs -> 1", "dairy-and-eggs", 1},
		{"grocery -> 1", "grocery", 1},
		{"drinks -> 2", "drinks", 2},
		{"snacks -> 3", "snacks", 3},
		{"alcohol -> 4", "alcohol", 4},
		{"chemicals -> 5", "chemicals", 5},
		{"cosmetics-and-care -> 6", "cosmetics-and-care", 6},
		{"for-animals -> 7", "for-animals", 7},
		{"babies -> 8", "babies", 8},
		{"hobby -> 9", "hobby", 9},
		{"special-offers -> 10", "special-offers", 10},

		// Store-chain suffix is stripped before lookup (suffixes recognised by storeChainSuffixRe).
		{"dairy-and-eggs-novus strips suffix -> 1", "dairy-and-eggs-novus", 1},
		{"drinks-auchan strips suffix -> 2", "drinks-auchan", 2},
		{"alcohol-metro strips suffix -> 4", "alcohol-metro", 4},
		{"snacks-epicentr strips suffix -> 3", "snacks-epicentr", 3},
		// NOTE: "silpo" is intentionally NOT in storeChainSuffixRe (only novus/auchan/metro/etc.),
		// so "snacks-silpo" is treated as an unknown slug and falls back to 1.
		{"snacks-silpo -> 1 (silpo not a recognised suffix)", "snacks-silpo", 1},

		// Case is normalized (lowercased) before lookup.
		{"uppercase DRINKS -> 2", "DRINKS", 2},
		{"mixed case Drinks -> 2", "Drinks", 2},

		// Unknown slug — deterministic fallback (1 = Products).
		{"unknown slug -> 1 (fallback)", "unknown-mystery-slug", 1},
		{"empty slug -> 1 (fallback)", "", 1},

		// Unknown slug WITH store suffix — suffix stripped, then fallback still 1.
		{"unknown-slug-novus -> 1 (fallback after suffix strip)", "unknown-slug-novus", 1},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := ResolveMainCategoryID(tc.slug)
			if got != tc.want {
				t.Errorf("ResolveMainCategoryID(%q) = %d, want %d", tc.slug, got, tc.want)
			}
		})
	}
}
