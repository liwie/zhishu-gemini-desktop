package main

import (
	"context"
	"fmt"
	"strings"
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

func (a *App) GetPortalURL() string {
	return config.PortalURL
}

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

func (a *App) OpenPortal() error {
	runtime.BrowserOpenURL(a.ctx, config.PortalURL)
	return nil
}

func (a *App) OpenURL(url string) error {
	if url == "" {
		return fmt.Errorf("url 为空")
	}
	runtime.BrowserOpenURL(a.ctx, url)
	return nil
}

type ChatResult struct {
	Model   string `json:"model"`
	Content string `json:"content"`
}

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

type ImageItem struct {
	URL     string `json:"url"`
	B64JSON string `json:"b64_json"`
	Mime    string `json:"mime"`
}

type ImageResult struct {
	Model    string      `json:"model"`
	ImageURL string      `json:"image_url"`
	URLs     []string    `json:"urls"`
	B64JSON  string      `json:"b64_json"`
	Images   []ImageItem `json:"images"`
}

// GenerateImage n 为生成张数（1–5）。
func (a *App) GenerateImage(model, prompt, size string, n int) (*ImageResult, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	if n < 1 {
		n = 1
	}
	if n > 5 {
		n = 5
	}
	// Gemini 文生图单次通常 1 张；多张时循环请求以稳定拿到 b64
	urls := make([]string, 0, n)
	images := make([]ImageItem, 0, n)
	b64 := ""
	resolved := ""
	for i := 0; i < n; i++ {
		resp, err := c.GenerateImage(a.ctx, model, prompt, size, 1)
		if err != nil {
			if len(images) == 0 {
				return nil, err
			}
			break
		}
		resolved = resp.Resolved
		for _, d := range resp.Data {
			if d.URL != "" {
				urls = append(urls, d.URL)
			}
			images = append(images, ImageItem{URL: d.URL, B64JSON: d.B64JSON, Mime: "image/png"})
			if d.B64JSON != "" && b64 == "" {
				b64 = d.B64JSON
			}
		}
	}
	imgURL := ""
	if len(urls) > 0 {
		imgURL = urls[0]
	}
	return &ImageResult{
		Model:    resolved,
		ImageURL: imgURL,
		URLs:     urls,
		B64JSON:  b64,
		Images:   images,
	}, nil
}

type VideoResult struct {
	Status      string `json:"status"`
	VideoURL    string `json:"video_url"`
	VideoDataURL string `json:"video_data_url"`
	ID          string `json:"id"`
}

func (a *App) GenerateVideo(model, prompt string, durationSeconds int) (*VideoResult, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	resp, err := c.GenerateVideo(a.ctx, model, prompt, durationSeconds)
	if err != nil {
		return nil, err
	}
	out := &VideoResult{
		Status:   resp.Status,
		VideoURL: resp.VideoURL,
		ID:       resp.ID,
	}
	// 视频文件接口需 Bearer，<video src> 无法带鉴权 → 拉取为 data URL 以便内嵌播放
	if resp.VideoURL != "" {
		if dataURL, ferr := c.FetchMediaDataURL(a.ctx, resp.VideoURL); ferr == nil && dataURL != "" {
			out.VideoDataURL = dataURL
		}
	}
	return out, nil
}

// TestVideoAPI 探测视频相关能力是否可用：只调 /v1/models，不触发生成、不计视频算力。
func (a *App) TestVideoAPI() (map[string]string, error) {
	c, err := a.apiClient()
	if err != nil {
		return nil, err
	}
	raw, err := c.ListModels(a.ctx)
	if err != nil {
		return map[string]string{
			"ok":      "false",
			"message": err.Error(),
		}, nil
	}
	s := string(raw)
	hasVideo := strings.Contains(s, "veo") || strings.Contains(s, "omni") || strings.Contains(s, `"type":"video"`) || strings.Contains(s, `"model_type":"video"`)
	msg := "API Key 有效，/v1/models 调用成功"
	if hasVideo {
		msg += "（列表中含视频相关模型）"
	} else {
		msg += "（未在列表文案中识别到 veo/omni，但鉴权与网关连通正常）"
	}
	return map[string]string{
		"ok":      "true",
		"message": msg,
	}, nil
}

func (a *App) ResolveModel(input string) string {
	return client.ResolveModel(input)
}

func (a *App) ImageAliasHints() []string {
	return client.ImageAliases()
}
