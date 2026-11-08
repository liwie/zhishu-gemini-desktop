# 智枢 Gemini Desktop

**开源桌面版 · Gemini API · 香蕉 Nano Banana 文生图 · Veo 文生视频 · 下载运行直接使用**

[![Go](https://img.shields.io/badge/Go-1.23+-00ADD8?logo=go)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v2-red)](https://wails.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Gemini API](https://img.shields.io/badge/Gemini-API-4285F4)](https://api.itzyk.top/)
[![Nano Banana](https://img.shields.io/badge/Nano%20Banana-香蕉-f0b429)](https://api.itzyk.top/)

> 关键词：`开源项目` `桌面版` `Gemini API` `生成视频` `Gemini 香蕉` `Nano Banana` `文生图` `Veo` `下载即用` `Wails` `Golang`

跨平台开源桌面客户端（**Go + Wails**），对接 OpenAI 兼容的 Gemini 网关，开箱即用：

| 能力 | 说明 | 搜索友好关键词 |
|------|------|----------------|
| AI 对话 | `POST /v1/chat/completions` | Gemini Flash / Pro |
| 文生图 | `POST /v1/images/generations` | **Nano Banana** / **香蕉** / banana / `gemini-3-pro-image` |
| 文生视频 | `POST /v1/videos/generations` + 轮询 | Veo 3.1 / Gemini 生成视频 |
| 获取 API Key | 客户端内打开门户 | [api.itzyk.top](https://api.itzyk.top/) 注册 → 创建 `sk-` Key |

默认 Base URL：`https://api.itzyk.top/v1`（智枢 ZhiShu 网关）。

---

## 仓库地址

- GitHub：<https://github.com/liwie/zhishu-gemini-desktop>
- Gitee（码云）：<https://gitee.com/lihaohuai/zhishu-gemini-desktop>

> 若上方链接暂未生效，请以发布后实际地址为准；欢迎 Star / Fork / Issue / PR。

---

## 为什么做这个项目

很多开发者想快速验证 **Gemini 对话、香蕉文生图、Veo 视频**，却卡在环境、SDK 与鉴权上。本客户端把调用封装成桌面应用：**下载 → 配置 Key → 直接用**，同时源码完全开源，便于学习 OpenAI 兼容协议与桌面壳集成。

---

## 快速开始

### 方式 A：从源码运行（推荐开发者）

```bash
# GitHub
git clone https://github.com/liwie/zhishu-gemini-desktop.git
# 或 Gitee
# git clone https://gitee.com/lihaohuai/zhishu-gemini-desktop.git

cd zhishu-gemini-desktop

# 依赖：Go 1.23+、Node.js 18+、Wails v2
go install github.com/wailsapp/wails/v2/cmd/wails@latest
wails doctor
wails dev      # 开发热重载
wails build    # 打包到 build/bin/
```

### 方式 B：使用流程（最终用户）

1. 打开应用 → **「获取 API Key」**（内嵌 https://api.itzyk.top/ ）
2. 注册 / 登录 → 控制台创建 API Key → 粘贴 `sk-…` 并保存  
3. 在 **AI 对话** / **文生图·香蕉** / **文生视频** 页直接调用  
4. 需要清空本机 Key：点「清除」，或删除用户配置目录下的 `settings.json`

若网站禁止 iframe，点「系统浏览器打开」即可，Key 仍粘贴回客户端。

---

## 环境要求

- Go 1.23+
- Node.js 18+（前端 Vite）
- [Wails v2](https://wails.io/)
- macOS / Windows / Linux 桌面开发依赖（见 [Wails 安装指引](https://wails.io/docs/gettingstarted/installation)）

---

## 模型与别名（开源搜索友好）

文生图常用别名会解析为真实 model code：

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
│   └── config/            # 本机 API Key 持久化（不入库）
├── frontend/              # Vanilla + Vite UI
├── LICENSE                # MIT
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md
```

API Key 仅保存在本机用户配置目录（权限 `0600`），**不会写入仓库**。

---

## 开源协议

[MIT License](LICENSE) — Copyright (c) 2026 ZhiShu Community / 智枢开源社区

欢迎 Star、Fork、提 Issue / PR。一起把 Gemini API（含 **Nano Banana 香蕉** 文生图与 Veo 视频）推向更多开发者。

### 建议 Topics / 标签

`gemini` `gemini-api` `nano-banana` `香蕉` `banana` `veo` `text-to-image` `text-to-video` `wails` `golang` `desktop` `openai-compatible` `智枢` `开源桌面`

---

## 相关链接

- 智枢门户与注册：https://api.itzyk.top/
- API Base URL：`https://api.itzyk.top/v1`
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全说明：[SECURITY.md](SECURITY.md)
