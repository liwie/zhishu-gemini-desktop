package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "智枢 Gemini Desktop · Nano Banana 香蕉",
		Width:  1280,
		Height: 860,
		MinWidth:  960,
		MinHeight: 640,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 12, G: 16, B: 22, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			About: &mac.AboutInfo{
				Title:   "智枢 Gemini Desktop",
				Message: "开源桌面客户端：AI 对话 · Nano Banana 香蕉文生图 · Veo 文生视频\nAPI: https://api.itzyk.top/",
			},
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}
