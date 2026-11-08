package main

import (
	"context"
	"fmt"
	"zhishu-gemini-desktop/internal/client"
	"zhishu-gemini-desktop/internal/config"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the Wails-bound application API.
type App struct {
	ctx   context.Context
	store *config.Store
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	store, err := config.NewStore()
	if err != nil {
		runtime.LogError(ctx, "config store: "+err.Error())
		return
	}
	a.store = store
}

func (a *App) apiClient() (*client.Client, error) {
	if a.store == nil {
		return nil, fmt.Errorf("配置未初始化")
	}
	st := a.store.Get()
	return client.New(st.BaseURL, st.APIKey), nil
}

// GetPortalURL returns the ZhiShu registration / console site.
func (a *App) GetPortalURL() string {
	return config.PortalURL
}

// GetSettings returns current settings (API key masked).
func (a *App) GetSettings() map[string]string {
	if a.store == nil {
		return map[string]string{
			"base_url":   config.DefaultBaseURL,
			"api_key":    "",
			"masked_key": "",
			"portal_url": config.PortalURL,
		}
	}
	st := a.store.Get()
	return map[string]string{
		"base_url":   st.BaseURL,
		"api_key":    st.APIKey,
		"masked_key": a.store.MaskedKey(),
		"portal_url": config.PortalURL,
	}
}

// SaveSettings persists API Key and Base URL locally.
func (a *App) SaveSettings(apiKey, baseURL string) (string, error) {
	if a.store == nil {
		return "", fmt.Errorf("配置未初始化")
	}
	st := config.Settings{APIKey: apiKey, BaseURL: baseURL}
	if err := a.store.Save(st); err != nil {
		return "", err
	}
	return "已保存", nil
}

// OpenPortal opens https://api.itzyk.top/ in the system browser (fallback when iframe is blocked).
func (a *App) OpenPortal() error {
	runtime.BrowserOpenURL(a.ctx, config.PortalURL)
	return nil
}

// OpenURL opens an arbitrary https URL in the system browser.
func (a *App) OpenURL(url string) error {
	if url == "" {
		return fmt.Errorf("url 为空")
	}
	runtime.BrowserOpenURL(a.ctx, url)
	return nil
}

// ChatResult is returned to the frontend.
type ChatResult struct {
	Model   string `json:"model"`
	Content string `json:"content"`
}

// Chat calls POST /v1/chat/completions.
func (a *App) Chat(model, message string, history []client.ChatMessage) (*ChatResult, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	if history == nil {
		history = []client.ChatMessage{}
	}
	resp, err := c.Chat(a.ctx, model, message, history)
	if err != nil {
		return nil, err
	}
	return &ChatResult{
		Model:   resp.Model,
		Content: resp.Choices[0].Message.Content,
	}, nil
}

// ImageResult is returned to the frontend.
type ImageResult struct {
	Model    string   `json:"model"`
	ImageURL string   `json:"image_url"`
	URLs     []string `json:"urls"`
	B64JSON  string   `json:"b64_json"`
}

// GenerateImage calls POST /v1/images/generations.
// model 支持别名：香蕉 / banana / nano-banana / Nano Banana Pro → gemini-3-pro-image
func (a *App) GenerateImage(model, prompt, size string) (*ImageResult, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	resp, err := c.GenerateImage(a.ctx, model, prompt, size, 1)
	if err != nil {
		return nil, err
	}
	urls := make([]string, 0, len(resp.Data))
	b64 := ""
	for _, d := range resp.Data {
		if d.URL != "" {
			urls = append(urls, d.URL)
		}
		if b64 == "" && d.B64JSON != "" {
			b64 = d.B64JSON
		}
	}
	return &ImageResult{
		Model:    resp.Resolved,
		ImageURL: resp.ImageURL,
		URLs:     urls,
		B64JSON:  b64,
	}, nil
}

// VideoResult is returned to the frontend after polling completes.
type VideoResult struct {
	Status   string `json:"status"`
	VideoURL string `json:"video_url"`
	ID       string `json:"id"`
}

// GenerateVideo calls POST /v1/videos/generations and polls until done.
func (a *App) GenerateVideo(model, prompt string, durationSeconds int) (*VideoResult, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	resp, err := c.GenerateVideo(a.ctx, model, prompt, durationSeconds)
	if err != nil {
		return nil, err
	}
	return &VideoResult{
		Status:   resp.Status,
		VideoURL: resp.VideoURL,
		ID:       resp.ID,
	}, nil
}

// ResolveModel exposes alias resolution to the UI (香蕉 → gemini-3-pro-image).
func (a *App) ResolveModel(input string) string {
	return client.ResolveModel(input)
}

// ImageAliasHints returns searchable alias labels for Nano Banana / 香蕉.
func (a *App) ImageAliasHints() []string {
	return client.ImageAliases()
}
