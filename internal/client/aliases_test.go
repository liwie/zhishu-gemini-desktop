package client

import "testing"

func TestResolveModelBanana(t *testing.T) {
	cases := map[string]string{
		"香蕉":            "gemini-3.1-flash-image",
		"banana":          "gemini-3.1-flash-image",
		"Nano Banana":     "gemini-3.1-flash-image",
		"nano-banana-pro": "gemini-3-pro-image",
		"香蕉pro":          "gemini-3-pro-image",
		"veo":             "veo-3.1-fast-generate-preview",
		"veo-3.1-lite-generate-preview": "veo-3.1-fast-generate-preview",
		"flash":           "gemini-3.6-flash",
		"gemini-3.6-flash": "gemini-3.6-flash",
	}
	for in, want := range cases {
		if got := ResolveModel(in); got != want {
			t.Fatalf("ResolveModel(%q)=%q want %q", in, got, want)
		}
	}
}
