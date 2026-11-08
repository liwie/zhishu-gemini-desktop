# 智枢 Gemini Desktop · Nano Banana 香蕉

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v2-red)](https://wails.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Gemini API](https://img.shields.io/badge/Gemini-API-4285F4)](https://api.itzyk.top/)
[![Nano Banana](https://img.shields.io/badge/Nano%20Banana-香蕉-f0b429)](https://api.itzyk.top/)

开源桌面客户端（**Go + Wails**），用于体验与推广 **Gemini API** 调用：

| 能力 | 说明 | 关键词 |
|------|------|--------|
| AI 对话 | `POST /v1/chat/completions` | Gemini Flash / Pro |
| 文生图 | `POST /v1/images/generations` | **Nano Banana** / **香蕉** / banana / `gemini-3-pro-image` |
| 文生视频 | `POST /v1/videos/generations` + 轮询 | Veo 3.1 |
| 获取 API Key | 客户端内打开 [api.itzyk.top](https://api.itzyk.top/) | 注册 → 创建 `sk-` Key |

> 本项目面向开源社区（GitHub / 码云 Gitee 等），帮助开发者快速跑通 Gemini 对话、**香蕉（Nano Banana）** 文生图与 Veo 视频，Base URL 默认指向智枢网关 **https://api.itzyk.top/v1**。

---

## 截图级流程

1. 打开应用 → **「获取 API Key」** 标签（内嵌 https://api.itzyk.top/ ）
2. 注册 / 登录 → 控制台创建 API Key → 粘贴 `sk-…` 并保存  
3. **AI 对话** / **文生图·香蕉** / **文生视频** 三页直接调用

若网站禁止 iframe 嵌入，点「系统浏览器打开」即可，Key 仍粘贴回客户端。

---

## 环境要求

- Go 1.23+
- Node.js 18+（前端 Vite）
- [Wails v2](https://wails.io/)：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- macOS / Windows / Linux 桌面开发依赖（见 [Wails 平台指引](https://wails.io/docs/gettingstarted/installation)）

---

## 快速开始

```bash
git clone https://github.com/<your-org>/zhishu-gemini-desktop.git
cd zhishu-gemini-desktop

# 开发模式（热重载）
wails dev

# 打包桌面应用
wails build
```

产物在 `build/bin/`。

---

## 模型与别名（开源搜索友好）

文生图支持社区常用别名，输入后会解析为真实 model code：

| 你输入 | 实际模型 |
|--------|----------|
| `香蕉` / `香蕉pro` | `gemini-3-pro-image` |
| `banana` / `banana-pro` | `gemini-3-pro-image` |
| `nano-banana` / `nano-banana-pro` | `gemini-3-pro-image` |
| `gemini-3-pro-image` | 原样 |

对话别名：`flash` → `gemini-3.6-flash`，`pro` → `gemini-3.1-pro-preview`  
视频别名：`veo` / `veo3` → `veo-3.1-generate-preview`

### curl 对照

```bash
export ZHISHU_BASE=https://api.itzyk.top/v1
export ZHISHU_API_KEY=sk-xxxxxxxx

# 对话
curl "$ZHISHU_BASE/chat/completions" \
  -H "Authorization: Bearer $ZHISHU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3.6-flash","messages":[{"role":"user","content":"你好"}]}'

# 香蕉 / Nano Banana 文生图
curl "$ZHISHU_BASE/images/generations" \
  -H "Authorization: Bearer $ZHISHU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3-pro-image","prompt":"一只香蕉宇航服漂浮在太空","n":1}'

# 文生视频（异步）
curl "$ZHISHU_BASE/videos/generations" \
  -H "Authorization: Bearer $ZHISHU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"veo-3.1-lite-generate-preview","prompt":"海边日落延时","duration_seconds":5}'
```

---

## 项目结构

```text
zhishu-gemini-desktop/
├── app.go                 # Wails 绑定：Chat / GenerateImage / GenerateVideo / 设置
├── main.go
├── internal/
│   ├── client/            # OpenAI 兼容 HTTP 客户端 + 香蕉别名
│   └── config/            # 本机 API Key 持久化
├── frontend/              # Vanilla + Vite UI
└── README.md
```

API Key 保存在本机用户配置目录（权限 `0600`），不会写入仓库。

---

## 开源发布（GitHub + 码云）

本目录是**独立 Git 仓库**，可同时推送到：

```bash
# GitHub
git remote add github git@github.com:<your-org>/zhishu-gemini-desktop.git
git push -u github main

# 码云 Gitee
git remote add gitee git@gitee.com:<your-org>/zhishu-gemini-desktop.git
git push -u gitee main
```

建议 README Topics / 标签：`gemini` `gemini-api` `nano-banana` `香蕉` `banana` `veo` `wails` `golang` `openai-compatible` `智枢`

---

## 相关链接

- 智枢门户与注册：https://api.itzyk.top/
- API Base URL：`https://api.itzyk.top/v1`
- 文档与价格：见门户站内「文档 / 价格 / 服务」

---

## License

MIT — 欢迎 Star、Fork、提 Issue / PR，一起把 Gemini API（含 **Nano Banana 香蕉** 文生图）推向更多开发者。
