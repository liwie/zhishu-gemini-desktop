package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const defaultTimeout = 180 * time.Second

type Client struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
}

func New(baseURL, apiKey string) *Client {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	return &Client{
		BaseURL: baseURL,
		APIKey:  strings.TrimSpace(apiKey),
		HTTPClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}
}

func (c *Client) ensure() error {
	if c.APIKey == "" {
		return fmt.Errorf("请先配置 API Key：在「获取 API Key」页打开 https://api.itzyk.top/ 注册并创建 Key")
	}
	if c.BaseURL == "" {
		return fmt.Errorf("Base URL 不能为空")
	}
	return nil
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string        `json:"model"`
	Messages []ChatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type ChatResponse struct {
	ID      string `json:"id"`
	Model   string `json:"model"`
	Choices []struct {
		Message ChatMessage `json:"message"`
	} `json:"choices"`
	Error *APIError `json:"error,omitempty"`
}

type APIError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

func (e *APIError) Error() string {
	if e == nil {
		return ""
	}
	if e.Type != "" {
		return e.Type + ": " + e.Message
	}
	return e.Message
}

type ImageRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	N      int    `json:"n"`
	Size   string `json:"size,omitempty"`
}

type ImageData struct {
	URL     string `json:"url"`
	B64JSON string `json:"b64_json"`
	FileID  string `json:"file_id"`
}

type ImageResponse struct {
	Created   int64       `json:"created"`
	Data      []ImageData `json:"data"`
	ImageURL  string      `json:"image_url"`
	Error     *APIError   `json:"error,omitempty"`
	Resolved  string      `json:"-"`
}

type VideoRequest struct {
	Model           string `json:"model"`
	Prompt          string `json:"prompt"`
	DurationSeconds int    `json:"duration_seconds"`
	AspectRatio     string `json:"aspect_ratio,omitempty"`
	Resolution      string `json:"resolution,omitempty"`
}

type VideoStartResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Status    string    `json:"status"`
	StatusURL string    `json:"status_url"`
	Model     string    `json:"model"`
	Error     *APIError `json:"error,omitempty"`
}

type VideoStatusResponse struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Done     bool      `json:"done"`
	Status   string    `json:"status"`
	VideoURL string    `json:"video_url"`
	Videos   []struct {
		URL    string `json:"url"`
		FileID string `json:"file_id"`
		URI    string `json:"uri"`
	} `json:"videos"`
	Error *APIError `json:"error,omitempty"`
}

const defaultChatSystem = `你是「智枢 Gemini 桌面客户端」助手。请遵守：
1. 默认用简体中文回答，语气自然。
2. 优先按中文互联网语境理解用户输入（例如「666」表示夸赞「厉害/牛」，不是要你长篇介绍数字 666 的圣经或数学含义，除非用户明确问百科）。
3. 回答先给结论，再补必要说明；避免无关的英文百科堆砌。
4. 用户若明确要求英文或其他语言，再切换。`

func (c *Client) Chat(ctx context.Context, model, userMessage string, history []ChatMessage) (*ChatResponse, error) {
	if err := c.ensure(); err != nil {
		return nil, err
	}
	model = ResolveModel(model)
	if model == "" {
		model = "gemini-3.6-flash"
	}
	msgs := make([]ChatMessage, 0, len(history)+2)
	hasSystem := false
	for _, m := range history {
		if m.Role == "system" {
			hasSystem = true
			break
		}
	}
	if !hasSystem {
		msgs = append(msgs, ChatMessage{Role: "system", Content: defaultChatSystem})
	}
	msgs = append(msgs, history...)
	msgs = append(msgs, ChatMessage{Role: "user", Content: userMessage})

	req := ChatRequest{Model: model, Messages: msgs, Stream: false}
	var out ChatResponse
	if err := c.postJSON(ctx, "/chat/completions", req, &out); err != nil {
		return nil, err
	}
	if out.Error != nil && out.Error.Message != "" {
		return nil, out.Error
	}
	if len(out.Choices) == 0 {
		return nil, fmt.Errorf("空响应：未返回 choices")
	}
	return &out, nil
}

func (c *Client) GenerateImage(ctx context.Context, model, prompt, size string, n int) (*ImageResponse, error) {
	if err := c.ensure(); err != nil {
		return nil, err
	}
	resolved := ResolveModel(model)
	if resolved == "" {
		resolved = "gemini-3.1-flash-image"
	}
	if n <= 0 {
		n = 1
	}
	req := ImageRequest{Model: resolved, Prompt: prompt, N: n, Size: size}
	var out ImageResponse
	if err := c.postJSON(ctx, "/images/generations", req, &out); err != nil {
		return nil, err
	}
	if out.Error != nil && out.Error.Message != "" {
		return nil, out.Error
	}
	out.Resolved = resolved
	if out.ImageURL == "" && len(out.Data) > 0 {
		out.ImageURL = absoluteURL(c.BaseURL, out.Data[0].URL)
	} else if out.ImageURL != "" {
		out.ImageURL = absoluteURL(c.BaseURL, out.ImageURL)
	}
	for i := range out.Data {
		out.Data[i].URL = absoluteURL(c.BaseURL, out.Data[i].URL)
	}
	return &out, nil
}

func (c *Client) GenerateVideo(ctx context.Context, model, prompt string, durationSec int) (*VideoStatusResponse, error) {
	if err := c.ensure(); err != nil {
		return nil, err
	}
	resolved := ResolveModel(model)
	if resolved == "" || resolved == "veo-3.1-lite-generate-preview" {
		resolved = "veo-3.1-fast-generate-preview"
	}
	// Veo 仅支持 4 / 6 / 8 秒
	switch durationSec {
	case 4, 6, 8:
	default:
		if durationSec <= 0 {
			durationSec = 4
		} else if durationSec < 6 {
			durationSec = 4
		} else if durationSec < 8 {
			durationSec = 6
		} else {
			durationSec = 8
		}
	}
	req := VideoRequest{Model: resolved, Prompt: prompt, DurationSeconds: durationSec}
	var start VideoStartResponse
	if err := c.postJSON(ctx, "/videos/generations", req, &start); err != nil {
		return nil, err
	}
	if start.Error != nil && start.Error.Message != "" {
		return nil, start.Error
	}

	statusPath := start.StatusURL
	if statusPath == "" && start.Name != "" {
		statusPath = "/videos/operations/" + strings.TrimPrefix(start.Name, "/")
	}
	if statusPath == "" && start.ID != "" {
		statusPath = "/videos/operations/" + strings.TrimPrefix(start.ID, "/")
	}
	if statusPath == "" {
		return nil, fmt.Errorf("视频任务已创建，但未返回 status_url")
	}

	deadline := time.Now().Add(6 * time.Minute)
	for {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		if time.Now().After(deadline) {
			return nil, fmt.Errorf("视频生成超时，请稍后用 status_url 查询：%s", statusPath)
		}
		var st VideoStatusResponse
		if err := c.getJSON(ctx, statusPath, &st); err != nil {
			return nil, err
		}
		if st.Error != nil && st.Error.Message != "" {
			return nil, st.Error
		}
		if st.Done || st.Status == "completed" || st.VideoURL != "" {
			if st.VideoURL != "" {
				st.VideoURL = absoluteURL(c.BaseURL, st.VideoURL)
			}
			return &st, nil
		}
		if st.Status == "failed" {
			return nil, fmt.Errorf("视频生成失败")
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(4 * time.Second):
		}
	}
}

func (c *Client) ListModels(ctx context.Context) (json.RawMessage, error) {
	if err := c.ensure(); err != nil {
		return nil, err
	}
	var raw json.RawMessage
	if err := c.getJSON(ctx, "/models", &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func (c *Client) postJSON(ctx context.Context, path string, body any, out any) error {
	raw, err := json.Marshal(body)
	if err != nil {
		return err
	}
	url := joinURL(c.BaseURL, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(raw))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	return c.do(req, out)
}

func (c *Client) getJSON(ctx context.Context, path string, out any) error {
	url := joinURL(c.BaseURL, path)
	// status_url may already be absolute or start with /v1
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		url = path
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	return c.do(req, out)
}

func (c *Client) do(req *http.Request, out any) error {
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("请求失败: %w", err)
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var ae struct {
			Error *APIError `json:"error"`
		}
		_ = json.Unmarshal(b, &ae)
		if ae.Error != nil && ae.Error.Message != "" {
			return fmt.Errorf("HTTP %d: %s", resp.StatusCode, ae.Error.Error())
		}
		msg := strings.TrimSpace(string(b))
		if len(msg) > 400 {
			msg = msg[:400] + "…"
		}
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, msg)
	}
	if out == nil {
		return nil
	}
	if err := json.Unmarshal(b, out); err != nil {
		return fmt.Errorf("解析响应失败: %w", err)
	}
	return nil
}

func joinURL(base, path string) string {
	path = strings.TrimSpace(path)
	if strings.HasPrefix(path, "http://") || strings.HasPrefix(path, "https://") {
		return path
	}
	base = strings.TrimRight(base, "/")
	// Accept both /videos/... and /v1/videos/...
	if strings.HasPrefix(path, "/v1/") {
		root := strings.TrimSuffix(base, "/v1")
		return root + path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return base + path
}

func absoluteURL(base, u string) string {
	u = strings.TrimSpace(u)
	if u == "" {
		return ""
	}
	if strings.HasPrefix(u, "http://") || strings.HasPrefix(u, "https://") {
		return u
	}
	return joinURL(base, u)
}
