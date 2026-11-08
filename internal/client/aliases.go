package client

import "strings"

// ResolveModel maps community aliases (香蕉 / banana / Nano Banana) to real model codes.
// Open-source search keywords: 香蕉, banana, nano-banana, Nano Banana Pro.
func ResolveModel(input string) string {
	m := strings.TrimSpace(input)
	key := strings.ToLower(m)
	key = strings.ReplaceAll(key, " ", "-")
	key = strings.ReplaceAll(key, "_", "-")

	aliases := map[string]string{
		// 文生图：默认香蕉走 Flash Image（更快更稳）；Pro 显式指定
		"香蕉":                   "gemini-3.1-flash-image",
		"banana":                 "gemini-3.1-flash-image",
		"nano-banana":            "gemini-3.1-flash-image",
		"nanobanana":             "gemini-3.1-flash-image",
		"香蕉pro":                 "gemini-3-pro-image",
		"香蕉-pro":                "gemini-3-pro-image",
		"banana-pro":             "gemini-3-pro-image",
		"nano-banana-pro":        "gemini-3-pro-image",
		"nanobanana-pro":         "gemini-3-pro-image",
		"nano-banana-pro-image":  "gemini-3-pro-image",
		// 视频：Veo preview 已下线，网关会改走 gemini-omni-1.2-flash；客户端仍用原 code 便于计费模型匹配
		"veo":                           "veo-3.1-fast-generate-preview",
		"veo3":                          "veo-3.1-fast-generate-preview",
		"veo-3":                         "veo-3.1-fast-generate-preview",
		"veo-3.1":                       "veo-3.1-fast-generate-preview",
		"omni":                          "gemini-omni-1.2-flash",
		"gemini-omni":                   "gemini-omni-1.2-flash",
		"veo-lite":                      "veo-3.1-fast-generate-preview",
		"veo-3.1-lite":                  "veo-3.1-fast-generate-preview",
		"veo-3.1-lite-generate-preview": "veo-3.1-fast-generate-preview",
		// 对话
		"flash": "gemini-3.6-flash",
		"pro":   "gemini-3.1-pro-preview",
	}
	if v, ok := aliases[key]; ok {
		return v
	}
	if v, ok := aliases[m]; ok {
		return v
	}
	return m
}

// ImageAliases lists UI-facing aliases for Nano Banana / 香蕉 image models.
func ImageAliases() []string {
	return []string{
		"香蕉 → gemini-3.1-flash-image",
		"香蕉pro → gemini-3-pro-image",
		"gemini-3.1-flash-image",
		"gemini-3-pro-image",
		"gemini-2.5-flash-image",
		"banana",
		"nano-banana-pro",
	}
}
