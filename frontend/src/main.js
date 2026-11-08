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
  TestVideoAPI,
} from '../wailsjs/go/main/App'
import { ClipboardSetText } from '../wailsjs/runtime/runtime'

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
        <p>注册账号 →「API Keys」页创建 / 复制 Key（sk-…）→ 粘贴到下方保存。若内嵌页提示剪贴板失败，用「系统浏览器打开」复制，或按弹窗手动全选。</p>
      </div>
      <div class="toolbar">
        <button class="btn" id="btn-reload-portal">刷新网页</button>
        <button class="btn ghost" id="btn-open-portal">系统浏览器打开</button>
        <span class="status-line" id="portal-status">正在加载 https://api.itzyk.top/ …</span>
      </div>
      <div class="portal-frame-wrap">
        <iframe
          id="portal-frame"
          title="智枢 ZhiShu"
          src="https://api.itzyk.top/keys"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
        <div class="portal-fallback" id="portal-fallback">
          <div>
            <p>若内嵌页无法复制 Key（剪贴板权限），请用系统浏览器打开后复制，再粘贴到下方保存。</p>
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
          默认「香蕉」→ <code>gemini-3.1-flash-image</code>；「香蕉pro」→ <code>gemini-3-pro-image</code>（Nano Banana Pro）。
        </p>
      </div>
      <div class="toolbar">
        <div class="field grow">
          <label>模型 / 别名</label>
          <input id="image-model" list="image-aliases" value="香蕉" placeholder="香蕉 / 香蕉pro / gemini-3.1-flash-image"/>
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
        <div class="field">
          <label>张数</label>
          <select id="image-count">
            <option value="1" selected>1 张</option>
            <option value="2">2 张</option>
            <option value="3">3 张</option>
            <option value="4">4 张</option>
            <option value="5">5 张</option>
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
        <h2>Gemini 文生视频</h2>
        <p>Veo preview 已下线，网关自动改走 <code>gemini-omni-1.2-flash</code>。先点「测试视频 API」验证连通（只调 /v1/models，不消耗生成算力）。</p>
      </div>
      <div class="toolbar">
        <div class="field grow">
          <label>模型</label>
          <select id="video-model">
            <option value="veo-3.1-fast-generate-preview" selected>veo-3.1-fast → Omni（推荐）</option>
            <option value="veo-3.1-generate-preview">veo-3.1-generate → Omni</option>
            <option value="gemini-omni-1.2-flash">gemini-omni-1.2-flash</option>
          </select>
        </div>
        <div class="field">
          <label>时长（秒）</label>
          <select id="video-duration">
            <option value="4">4</option>
            <option value="5" selected>5（默认）</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="10">10</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>提示词</label>
        <textarea id="video-prompt" rows="3" placeholder="航拍镜头：清晨雪山云海缓缓流动，金色阳光洒在雪峰上…"></textarea>
      </div>
      <div class="toolbar">
        <button class="btn ghost" id="btn-video-test">测试视频 API</button>
        <button class="btn" id="btn-video">生成视频</button>
        <span class="status-line" id="video-status"></span>
      </div>
      <div class="media-result" id="video-result">
        <div class="placeholder">生成成功后可在此直接播放。</div>
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
  frame.src = 'https://api.itzyk.top/keys'
  setStatus($('portal-status'), '已刷新')
})

/**
 * 根因：Wails(WKWebView) 内跨域 iframe 无法使用系统剪贴板（权限被拒，不是简单 UI bug）。
 * 站点 Keys 页会 postMessage({ type:'zhishu-api-key', key })，此处接收后：
 * 1) 填入输入框  2) 用 Wails ClipboardSetText 写入系统剪贴板  3) 可一键保存
 */
window.addEventListener('message', async (ev) => {
  const allowed = ev.origin === 'https://api.itzyk.top' || ev.origin === 'http://localhost:5173' || ev.origin === 'http://127.0.0.1:5173'
  if (!allowed) return
  const data = ev.data
  if (!data || data.type !== 'zhishu-api-key' || data.source !== 'zhishu-keys') return
  const key = String(data.key || '').trim()
  if (!key.startsWith('sk-')) return

  $('portal-key').value = key
  $('portal-key').type = 'text'
  try {
    await ClipboardSetText(key)
    setStatus($('portal-key-status'), '已从内嵌网页接收 Key，并写入系统剪贴板。请点「保存 Key」。', 'ok')
  } catch (_) {
    setStatus($('portal-key-status'), '已从内嵌网页接收 Key。请点「保存 Key」。', 'ok')
  }
})

setTimeout(() => {
  setStatus($('portal-status'), '内嵌页点「复制」会回传 Key 到下方（iframe 本身无剪贴板权限）', 'ok')
}, 1500)

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

function toDataImageSrc(b64, mime) {
  if (!b64) return ''
  const m = mime || 'image/png'
  if (b64.startsWith('data:')) return b64
  return `data:${m};base64,${b64}`
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
  const n = parseInt($('image-count').value, 10) || 1
  setBusy(true)
  setStatus($('image-status'), '生成中…')
  try {
    const resolved = await ResolveModel(model)
    setStatus($('image-status'), `使用模型 ${resolved}，生成 ${n} 张…`)
    const res = await GenerateImage(model, prompt, size, n)
    const box = $('image-result')
    const items = Array.isArray(res.images) && res.images.length ? res.images : []
    const htmlParts = []
    if (items.length) {
      for (const it of items) {
        const src = toDataImageSrc(it.b64_json, it.mime) || it.url
        if (src) htmlParts.push(`<img src="${src}" alt="Nano Banana 香蕉 生成图" style="max-width:100%;margin:8px 0;border-radius:10px"/>`)
      }
    } else if (res.b64_json) {
      htmlParts.push(`<img src="${toDataImageSrc(res.b64_json)}" alt="Nano Banana 香蕉 生成图"/>`)
    } else if (res.image_url || (res.urls && res.urls[0])) {
      // URL 需鉴权，通常无法直接 <img>；尽量不用
      htmlParts.push(`<div class="placeholder">已返回下载 URL，但需鉴权无法直接预览。请重试或检查网关是否返回 b64_json。</div>`)
    }
    if (!htmlParts.length) {
      box.innerHTML = '<div class="placeholder">未返回可显示的图片数据</div>'
    } else {
      box.innerHTML = htmlParts.join('') + `<p class="placeholder" style="margin-top:10px">模型：${escapeHtml(res.model || resolved)} · ${htmlParts.length} 张</p>`
    }
    setStatus($('image-status'), '完成 · ' + (res.model || resolved), 'ok')
  } catch (e) {
    setStatus($('image-status'), String(e), 'error')
  } finally {
    setBusy(false)
  }
})

$('btn-video-test').addEventListener('click', async () => {
  if (state.busy) return
  setBusy(true)
  setStatus($('video-status'), '正在测试 /v1/models（不计视频算力）…')
  try {
    const res = await TestVideoAPI()
    const ok = res && res.ok === 'true'
    setStatus($('video-status'), res.message || (ok ? '测试成功' : '测试失败'), ok ? 'ok' : 'error')
    $('video-result').innerHTML = `<div class="placeholder">${escapeHtml(res.message || '')}</div>`
  } catch (e) {
    setStatus($('video-status'), String(e), 'error')
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
  setStatus($('video-status'), '生成中（Omni，可能需数十秒到数分钟）…')
  $('video-result').innerHTML = '<div class="placeholder">生成中，请勿关闭…</div>'
  try {
    const res = await GenerateVideo(model, prompt, duration)
    const box = $('video-result')
    const playSrc = res.video_data_url || ''
    if (playSrc) {
      box.innerHTML = `<video controls src="${playSrc}" style="max-width:100%;max-height:100%;border-radius:10px"></video>
        <p class="placeholder" style="margin-top:10px">可直接播放 · id=${escapeHtml(res.id || '')}</p>`
      setStatus($('video-status'), '完成 · ' + (res.status || 'completed'), 'ok')
    } else if (res.video_url) {
      box.innerHTML = `<div class="placeholder">已生成，但内嵌播放需要鉴权下载失败。<br/>
        <a href="#" id="open-video">在系统浏览器打开（仍可能需登录态）</a></div>`
      $('open-video')?.addEventListener('click', (e) => {
        e.preventDefault()
        OpenURL(res.video_url)
      })
      setStatus($('video-status'), '完成但未能内嵌播放', 'error')
    } else {
      box.innerHTML = `<div class="placeholder">任务结束但无视频数据<br/>id=${escapeHtml(res.id || '')}</div>`
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
