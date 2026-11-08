import './style.css'

import {
  Chat,
  GenerateImage,
  GenerateVideo,
  GetPortalURL,
  GetSettings,
  ImageAliasHints,
  OpenPortal,
  OpenURL,
  ResolveModel,
  SaveSettings,
} from '../wailsjs/go/main/App'

const state = {
  tab: 'portal',
  chatHistory: [],
  busy: false,
}

document.querySelector('#app').innerHTML = `
  <aside class="sidebar">
    <div class="brand">
      <h1>智枢 Gemini</h1>
      <p>Desktop · 对话 / 香蕉生图 / Veo 视频<br/>API via api.itzyk.top</p>
    </div>
    <nav class="nav">
      <button data-tab="portal" class="active">① 获取 API Key</button>
      <button data-tab="chat">② AI 对话</button>
      <button data-tab="image">③ 文生图 · 香蕉</button>
      <button data-tab="video">④ 文生视频</button>
      <button data-tab="settings">⑤ 设置</button>
    </nav>
    <div class="side-foot">
      开源推广关键词：Gemini API、<b>Nano Banana</b>、<b>香蕉</b>、banana、Veo<br/>
      <a href="#" id="open-site">https://api.itzyk.top/</a>
    </div>
  </aside>
  <main class="main">
    <section class="panel active" id="panel-portal">
      <div class="panel-head">
        <h2>在客户端内打开智枢网站</h2>
        <p>注册账号 → 控制台创建 API Key（sk-…）→ 粘贴到下方保存，即可调用 Gemini 对话 / Nano Banana 香蕉生图 / Veo 视频。</p>
      </div>
      <div class="toolbar">
        <button class="btn" id="btn-reload-portal">刷新网页</button>
        <button class="btn ghost" id="btn-open-portal">系统浏览器打开</button>
        <span class="status-line" id="portal-status">正在加载 https://api.itzyk.top/ …</span>
      </div>
      <div class="portal-frame-wrap">
        <iframe id="portal-frame" title="智枢 ZhiShu" src="https://api.itzyk.top/" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"></iframe>
        <div class="portal-fallback" id="portal-fallback">
          <div>
            <p>若网站禁止被嵌入（X-Frame-Options），请点击下方按钮用系统浏览器打开，注册并创建 Key 后回到本页粘贴。</p>
            <button class="btn" id="btn-open-portal-2">打开 https://api.itzyk.top/</button>
          </div>
        </div>
      </div>
      <div class="settings-card" style="max-width:none">
        <div class="toolbar">
          <div class="field grow">
            <label>从网站复制的 API Key</label>
            <input id="portal-key" type="password" placeholder="sk-xxxxxxxx" autocomplete="off"/>
          </div>
          <button class="btn warn" id="btn-save-portal-key" style="align-self:flex-end">保存 Key</button>
        </div>
        <div class="status-line" id="portal-key-status"></div>
      </div>
    </section>

    <section class="panel" id="panel-chat">
      <div class="panel-head">
        <h2>AI 对话</h2>
        <p>OpenAI 兼容 <code>POST /v1/chat/completions</code>，默认 <code>gemini-3.6-flash</code>。</p>
      </div>
      <div class="toolbar">
        <div class="field">
          <label>模型</label>
          <select id="chat-model">
            <option value="gemini-3.6-flash">gemini-3.6-flash（最快）</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview（最强）</option>
            <option value="flash">flash（别名）</option>
            <option value="pro">pro（别名）</option>
          </select>
        </div>
        <button class="btn ghost" id="btn-clear-chat">清空会话</button>
      </div>
      <div class="chat-box" id="chat-box">
        <div class="placeholder">输入消息开始对话。需先在「获取 API Key」保存 sk- Key。</div>
      </div>
      <div class="chat-compose">
        <textarea id="chat-input" placeholder="问点什么…"></textarea>
        <button class="btn" id="btn-chat">发送</button>
      </div>
      <div class="status-line" id="chat-status"></div>
    </section>

    <section class="panel" id="panel-image">
      <div class="panel-head">
        <h2>Gemini 文生图 · Nano Banana / 香蕉</h2>
        <p>
          <span class="tag">香蕉</span><span class="tag">banana</span><span class="tag">nano-banana</span>
          社区别名会解析为 <code>gemini-3-pro-image</code>（Nano Banana Pro）。
        </p>
      </div>
      <div class="toolbar">
        <div class="field grow">
          <label>模型 / 别名</label>
          <input id="image-model" list="image-aliases" value="香蕉" placeholder="香蕉 / banana / gemini-3-pro-image"/>
          <datalist id="image-aliases"></datalist>
        </div>
        <div class="field">
          <label>尺寸</label>
          <select id="image-size">
            <option value="1024x1024">1024×1024 (1:1)</option>
            <option value="1792x1024">1792×1024 (16:9)</option>
            <option value="1024x1792">1024×1792 (9:16)</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>提示词</label>
        <textarea id="image-prompt" rows="3" placeholder="一杯冒着热气的黑咖啡，暖色调，电影感布光…"></textarea>
      </div>
      <div class="toolbar">
        <button class="btn" id="btn-image">生成图片</button>
        <span class="status-line" id="image-status"></span>
      </div>
      <div class="media-result" id="image-result">
        <div class="placeholder">生成结果将显示在这里。<br/>关键词：Nano Banana、香蕉、banana、gemini-3-pro-image</div>
      </div>
    </section>

    <section class="panel" id="panel-video">
      <div class="panel-head">
        <h2>Gemini 文生视频（Veo）</h2>
        <p>异步任务：<code>POST /v1/videos/generations</code> → 轮询 <code>/v1/videos/operations/…</code>。按秒计费，建议先用短时长联调。</p>
      </div>
      <div class="toolbar">
        <div class="field grow">
          <label>模型</label>
          <select id="video-model">
            <option value="veo-3.1-lite-generate-preview">veo-3.1-lite（便宜试跑）</option>
            <option value="veo-3.1-fast-generate-preview">veo-3.1-fast</option>
            <option value="veo-3.1-generate-preview">veo-3.1-generate（最强）</option>
            <option value="veo">veo（别名 → generate）</option>
          </select>
        </div>
        <div class="field">
          <label>时长（秒）</label>
          <input id="video-duration" type="number" min="4" max="8" value="5"/>
        </div>
      </div>
      <div class="field">
        <label>提示词</label>
        <textarea id="video-prompt" rows="3" placeholder="航拍镜头：清晨雪山云海缓缓流动，金色阳光洒在雪峰上…"></textarea>
      </div>
      <div class="toolbar">
        <button class="btn" id="btn-video">生成视频</button>
        <span class="status-line" id="video-status"></span>
      </div>
      <div class="media-result" id="video-result">
        <div class="placeholder">视频生成通常需要 1～3 分钟，请耐心等待。</div>
      </div>
    </section>

    <section class="panel" id="panel-settings">
      <div class="panel-head">
        <h2>设置</h2>
        <p>Key 仅保存在本机用户配置目录，请求只发往你配置的 Base URL（默认智枢网关）。</p>
      </div>
      <div class="settings-card">
        <div class="field">
          <label>Base URL</label>
          <input id="set-base" value="https://api.itzyk.top/v1"/>
        </div>
        <div class="field">
          <label>API Key</label>
          <input id="set-key" type="password" placeholder="sk-…" autocomplete="off"/>
        </div>
        <div class="toolbar">
          <button class="btn" id="btn-save-settings">保存</button>
          <button class="btn ghost" id="btn-reveal">显示/隐藏 Key</button>
        </div>
        <div class="status-line" id="settings-status"></div>
        <ol class="hint-list">
          <li>打开 <a href="#" id="hint-portal">https://api.itzyk.top/</a> 注册并登录</li>
          <li>控制台创建 API Key，复制 <code>sk-</code> 开头的密钥</li>
          <li>粘贴到本页保存，即可对话 / 香蕉生图 / 视频</li>
        </ol>
      </div>
    </section>
  </main>
`

function $(id) { return document.getElementById(id) }
function setStatus(el, msg, kind) {
  el.textContent = msg || ''
  el.className = 'status-line' + (kind ? ' ' + kind : '')
}
function setBusy(v) { state.busy = v }

function switchTab(tab) {
  state.tab = tab
  document.querySelectorAll('.nav button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab)
  })
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.id === 'panel-' + tab)
  })
}

document.querySelectorAll('.nav button').forEach((b) => {
  b.addEventListener('click', () => switchTab(b.dataset.tab))
})

$('open-site').addEventListener('click', (e) => {
  e.preventDefault()
  OpenPortal()
})
$('hint-portal').addEventListener('click', (e) => {
  e.preventDefault()
  OpenPortal()
})
$('btn-open-portal').addEventListener('click', () => OpenPortal())
$('btn-open-portal-2').addEventListener('click', () => OpenPortal())
$('btn-reload-portal').addEventListener('click', () => {
  const frame = $('portal-frame')
  frame.src = 'https://api.itzyk.top/'
  setStatus($('portal-status'), '已刷新')
})

// Detect iframe block after a short wait (cross-origin often looks "empty")
setTimeout(() => {
  const frame = $('portal-frame')
  try {
    // Accessing cross-origin contentDocument throws; that means it likely loaded.
    void frame.contentDocument
  } catch (_) {
    setStatus($('portal-status'), '已加载外站（跨域正常）', 'ok')
    return
  }
  // Same-origin unexpected; or blank — show fallback hint softly
  setStatus($('portal-status'), '若白屏，请用「系统浏览器打开」', '')
}, 2500)

async function loadSettings() {
  const s = await GetSettings()
  $('set-base').value = s.base_url || 'https://api.itzyk.top/v1'
  $('set-key').value = s.api_key || ''
  $('portal-key').value = s.api_key || ''
  if (s.masked_key) {
    setStatus($('portal-key-status'), '当前 Key：' + s.masked_key, 'ok')
  }
}

$('btn-save-portal-key').addEventListener('click', async () => {
  try {
    const msg = await SaveSettings($('portal-key').value, $('set-base').value || 'https://api.itzyk.top/v1')
    setStatus($('portal-key-status'), msg, 'ok')
    await loadSettings()
  } catch (e) {
    setStatus($('portal-key-status'), String(e), 'error')
  }
})

$('btn-save-settings').addEventListener('click', async () => {
  try {
    const msg = await SaveSettings($('set-key').value, $('set-base').value)
    setStatus($('settings-status'), msg, 'ok')
    await loadSettings()
  } catch (e) {
    setStatus($('settings-status'), String(e), 'error')
  }
})

$('btn-reveal').addEventListener('click', () => {
  const el = $('set-key')
  el.type = el.type === 'password' ? 'text' : 'password'
})

function renderChat() {
  const box = $('chat-box')
  if (!state.chatHistory.length) {
    box.innerHTML = '<div class="placeholder">输入消息开始对话。</div>'
    return
  }
  box.innerHTML = state.chatHistory.map((m) =>
    `<div class="bubble ${m.role === 'user' ? 'user' : 'assistant'}">${escapeHtml(m.content)}</div>`
  ).join('')
  box.scrollTop = box.scrollHeight
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

$('btn-clear-chat').addEventListener('click', () => {
  state.chatHistory = []
  renderChat()
})

$('btn-chat').addEventListener('click', sendChat)
$('chat-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendChat()
})

async function sendChat() {
  if (state.busy) return
  const message = $('chat-input').value.trim()
  if (!message) return
  const model = $('chat-model').value
  state.chatHistory.push({ role: 'user', content: message })
  $('chat-input').value = ''
  renderChat()
  setBusy(true)
  setStatus($('chat-status'), '请求中…')
  try {
    const history = state.chatHistory.slice(0, -1)
    const res = await Chat(model, message, history)
    state.chatHistory.push({ role: 'assistant', content: res.content })
    renderChat()
    setStatus($('chat-status'), '模型：' + (res.model || model), 'ok')
  } catch (e) {
    state.chatHistory.pop()
    renderChat()
    setStatus($('chat-status'), String(e), 'error')
  } finally {
    setBusy(false)
  }
}

$('btn-image').addEventListener('click', async () => {
  if (state.busy) return
  const prompt = $('image-prompt').value.trim()
  if (!prompt) {
    setStatus($('image-status'), '请填写提示词', 'error')
    return
  }
  const model = $('image-model').value.trim() || '香蕉'
  const size = $('image-size').value
  setBusy(true)
  setStatus($('image-status'), '解析别名并生成中…（香蕉 → Nano Banana Pro）')
  try {
    const resolved = await ResolveModel(model)
    setStatus($('image-status'), `使用模型 ${resolved}，生成中…`)
    const res = await GenerateImage(model, prompt, size)
    const url = res.image_url || (res.urls && res.urls[0]) || ''
    const box = $('image-result')
    if (url) {
      box.innerHTML = `<img src="${url}" alt="Nano Banana 香蕉 生成图"/><p class="placeholder" style="margin-top:10px">模型：${escapeHtml(res.model || resolved)}</p>`
    } else if (res.b64_json) {
      box.innerHTML = `<img src="data:image/png;base64,${res.b64_json}" alt="Nano Banana 香蕉 生成图"/>`
    } else {
      box.innerHTML = '<div class="placeholder">未返回图片 URL</div>'
    }
    setStatus($('image-status'), '完成 · ' + (res.model || resolved), 'ok')
  } catch (e) {
    setStatus($('image-status'), String(e), 'error')
  } finally {
    setBusy(false)
  }
})

$('btn-video').addEventListener('click', async () => {
  if (state.busy) return
  const prompt = $('video-prompt').value.trim()
  if (!prompt) {
    setStatus($('video-status'), '请填写提示词', 'error')
    return
  }
  const model = $('video-model').value
  const duration = parseInt($('video-duration').value, 10) || 5
  setBusy(true)
  setStatus($('video-status'), '已提交任务，轮询中（可能需 1～3 分钟）…')
  $('video-result').innerHTML = '<div class="placeholder">生成中，请勿关闭…</div>'
  try {
    const res = await GenerateVideo(model, prompt, duration)
    const box = $('video-result')
    if (res.video_url) {
      box.innerHTML = `<video controls src="${res.video_url}"></video>
        <p class="placeholder" style="margin-top:10px"><a href="#" id="open-video">在浏览器打开视频</a></p>`
      $('open-video')?.addEventListener('click', (e) => {
        e.preventDefault()
        OpenURL(res.video_url)
      })
      setStatus($('video-status'), '完成 · ' + (res.status || 'completed'), 'ok')
    } else {
      box.innerHTML = `<div class="placeholder">任务结束但无 video_url<br/>id=${escapeHtml(res.id || '')}</div>`
      setStatus($('video-status'), '无视频地址', 'error')
    }
  } catch (e) {
    setStatus($('video-status'), String(e), 'error')
    $('video-result').innerHTML = `<div class="placeholder">${escapeHtml(String(e))}</div>`
  } finally {
    setBusy(false)
  }
})

async function boot() {
  try {
    const portal = await GetPortalURL()
    setStatus($('portal-status'), '门户：' + portal)
    const aliases = await ImageAliasHints()
    const dl = $('image-aliases')
    dl.innerHTML = aliases.map((a) => `<option value="${escapeHtml(a.split(' ')[0])}">${escapeHtml(a)}</option>`).join('')
  } catch (_) { /* running outside wails bindings */ }
  await loadSettings().catch(() => {})
}

boot()
