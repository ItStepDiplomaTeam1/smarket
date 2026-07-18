package service

import "testing"

func TestPriceKopecksToUAH(t *testing.T) {
	cases := []struct {
		name     string
		kopecks  float64
		want     float64
	}{
		{"integer kopecks convert to decimal hryvnias", 4150, 41.50},
		{"zero kopecks convert to zero hryvnias", 0, 0.0},
		{"exact hryvnia", 10000, 100.0},
		{"single kopeck", 1, 0.01},
		{"fractional-safe: 10890 kopecks", 10890, 108.90},
		{"large value 999999 kopecks", 999999, 9999.99},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := priceKopecksToUAH(tc.kopecks)
			
			const epsilon = 1e-9
			diff := got - tc.want
			if diff < 0 {
				diff = -diff
			}
			if diff > epsilon {
				t.Errorf("priceKopecksToUAH(%v) = %v, want %v (diff %v > epsilon %v)",
					tc.kopecks, got, tc.want, diff, epsilon)
			}
		})
	}
}
