# 贡献指南 · Contributing

感谢关注 **智枢 Gemini Desktop**（开源桌面版：Gemini 对话 / Nano Banana 香蕉文生图 / Veo 文生视频）。

## 开发环境

- Go 1.23+
- Node.js 18+
- [Wails v2](https://wails.io/)

```bash
git clone <本仓库地址>
cd zhishu-gemini-desktop
wails doctor   # 检查依赖
wails dev      # 热重载开发
wails build    # 打包
```

## 提交约定

1. Fork 本仓库并创建功能分支：`feature/xxx` 或 `fix/xxx`
2. 不要提交 API Key、本机 `settings.json`、构建产物（`build/bin`、`node_modules`）
3. 涉及别名（香蕉 / banana / veo）请同步更新 `internal/client/aliases.go` 与测试
4. 提交前建议：`go test ./...`
5. 发起 Pull Request / Merge Request，说明动机与验证步骤

## 行为准则

请保持友善与建设性讨论。恶意利用、滥用接口或传播他人密钥的行为不予接受。

## 安全问题

请勿在公开 Issue 中贴出真实 API Key。漏洞报告可发至：`opensource@itzyk.top`。
