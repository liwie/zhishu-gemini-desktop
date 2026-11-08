package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const (
	DefaultBaseURL = "https://api.itzyk.top/v1"
	PortalURL      = "https://api.itzyk.top/"
	AppName        = "zhishu-gemini-desktop"
)

// Settings is persisted locally (API Key never leaves the machine except to api.itzyk.top).
type Settings struct {
	APIKey  string `json:"api_key"`
	BaseURL string `json:"base_url"`
}

type Store struct {
	mu   sync.RWMutex
	path string
	cur  Settings
}

func NewStore() (*Store, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		dir, err = os.UserHomeDir()
		if err != nil {
			return nil, err
		}
		dir = filepath.Join(dir, ".config")
	}
	dir = filepath.Join(dir, AppName)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	s := &Store{path: filepath.Join(dir, "settings.json")}
	_ = s.Load()
	if strings.TrimSpace(s.cur.BaseURL) == "" {
		s.cur.BaseURL = DefaultBaseURL
	}
	return s, nil
}

func (s *Store) Load() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			s.cur = Settings{BaseURL: DefaultBaseURL}
			return nil
		}
		return err
	}
	var st Settings
	if err := json.Unmarshal(b, &st); err != nil {
		return err
	}
	if strings.TrimSpace(st.BaseURL) == "" {
		st.BaseURL = DefaultBaseURL
	}
	s.cur = st
	return nil
}

func (s *Store) Save(st Settings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if strings.TrimSpace(st.BaseURL) == "" {
		st.BaseURL = DefaultBaseURL
	}
	st.APIKey = strings.TrimSpace(st.APIKey)
	st.BaseURL = strings.TrimRight(strings.TrimSpace(st.BaseURL), "/")
	b, err := json.MarshalIndent(st, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(s.path, b, 0o600); err != nil {
		return err
	}
	s.cur = st
	return nil
}

func (s *Store) Get() Settings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cur
}

func (s *Store) MaskedKey() string {
	k := strings.TrimSpace(s.Get().APIKey)
	if k == "" {
		return ""
	}
	if len(k) <= 8 {
		return "****"
	}
	return k[:4] + "…" + k[len(k)-4:]
}
