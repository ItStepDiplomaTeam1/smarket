package service

import "testing"

func TestIsValidEAN13(t *testing.T) {
	cases := []struct {
		name string
		ean  string
		want bool
	}{
		// Valid EAN-13 barcodes (checksum digit precomputed).
		{"valid 4820000000017", "4820000000017", true},
		{"valid 4006381333931", "4006381333931", true},
		{"valid 0000000000017", "0000000000017", true},

		// Wrong-length barcodes.
		{"too short 12 digits", "482000000001", false},
		{"too long 14 digits", "48200000000171", false},
		{"empty", "", false},

		// Non-digit characters.
		{"contains letters", "48200000000A7", false},
		{"contains space", "48200000 0017", false},

		// 13 digits but invalid checksum.
		{"valid length bad checksum", "4820000000018", false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := isValidEAN13(tc.ean)
			if got != tc.want {
				t.Errorf("isValidEAN13(%q) = %v, want %v", tc.ean, got, tc.want)
			}
		})
	}
}

func TestCleanEAN(t *testing.T) {
	cases := []struct {
		name string
		ean  string
		want string
	}{
		{"GTIN-14 strips leading zero", "04820000000017", "4820000000017"},
		{"already 13 digits unchanged", "4820000000017", "4820000000017"},
		{"14 digits but no leading zero unchanged", "14820000000017", "14820000000017"},
		{"empty stays empty", "", ""},
		{"short barcode unchanged", "123", "123"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := cleanEAN(tc.ean)
			if got != tc.want {
				t.Errorf("cleanEAN(%q) = %q, want %q", tc.ean, got, tc.want)
			}
		})
	}
}
