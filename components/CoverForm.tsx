import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  getApiKey,
  setApiKey,
  saveHistory,
  getHistory,
  HistoryItem,
  canUseFree,
  recordUsage,
  setProEmail,
  getProEmail,
  getHistory as fetchHistory,
} from '../utils/storage'

type GenState = 'idle' | 'generating' | 'done' | 'error'

function buildPrompt(jobDesc: string, bullets: string[]) {
  return `You are a professional cover-letter writer. Given the job post/description and the candidate's experience bullets, write a concise, tailored cover letter for applying to this position (approx 200-350 words). Use a friendly professional tone. Include 2 short specific lines showing how the candidate's experience matches the role. Job description:\n\n${jobDesc}\n\nExperience bullets:\n${bullets.map((b, i) => `${i+1}. ${b}`).join('\n')}\n\nOutput only the cover letter (no intros about yourself).`
}

export default function CoverForm() {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [bulletsText, setBulletsText] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [genState, setGenState] = useState<GenState>('idle')
  const [output, setOutput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const key = getApiKey()
    if (key) setApiKeyInput(key)
    const pro = getProEmail()
    if (pro) {
      setEmailInput(pro)
      setIsPro(true)
    }
    setHistory(fetchHistory())
  }, [])

  function saveKey() {
    setApiKey(apiKeyInput.trim())
    setApiKeyInput(apiKeyInput.trim())
    localStorage.setItem('ai_cl_api_key', apiKeyInput.trim())
    alert('API key 已保存到本地（localStorage）。注意：请勿在公共设备使用。')
  }

  function markPro() {
    const email = emailInput.trim()
    if (!email) return alert('请输入邮箱来激活 Pro（仅标记，不收费）。')
    setProEmail(email)
    setIsPro(true)
    alert('已标记为 Pro（本地保存），现在将不再受每日免费次数限制。')
  }

  async function generate() {
    setErrorMsg('')
    setOutput('')
    // validate api key
    const key = localStorage.getItem('ai_cl_api_key')
    if (!key) return setErrorMsg('请先输入并保存你的 OpenAI API Key（BYOK）。')
    // check usage
    const proEmail = localStorage.getItem('ai_cl_pro_email')
    const pro = Boolean(proEmail)
    if (!pro && !canUseFree()) {
      return setErrorMsg('免费版每天限一次。若想无限使用，请在 Pro 区域输入邮箱标记为 Pro（不收费）。')
    }

    if (!jobDesc.trim() && !jobTitle.trim()) {
      setErrorMsg('请填写职位描述或职位名称。')
      return
    }

    // build bullets array
    const bullets = bulletsText.split('\n').map(b => b.trim()).filter(Boolean)
    const prompt = buildPrompt(`${jobTitle ? jobTitle + ' @ ' + company : ''}\n\n${jobDesc}`, bullets)

    setGenState('generating')
    try {
      // client-side fetch to OpenAI
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a professional assistant that writes cover letters.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 600,
          temperature: 0.2,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setGenState('error')
        setErrorMsg(`OpenAI error: ${res.status} ${res.statusText} - ${text}`)
        return
      }

      const json = await res.json()
      // Extract assistant content
      const content = (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) || ''
      setOutput(content.trim())
      setGenState('done')

      // record usage & history
      if (!pro) recordUsage()
      const item: HistoryItem = {
        id: uuidv4(),
        date: new Date().toISOString(),
        jobTitle,
        company,
        inputJobDesc: jobDesc,
        bullets,
        output: content.trim(),
        isPro: pro
      }
      saveHistory(item)
      setHistory(prev => [item, ...prev].slice(0, 50))
    } catch (err: any) {
      setGenState('error')
      setErrorMsg(String(err.message || err))
    }
  }

  function copyOutput() {
    if (!output) return
    navigator.clipboard.writeText(output).then(() => {
      alert('已复制到剪贴板')
    }, () => {
      alert('复制失败，请手动复制')
    })
  }

  function printPreview() {
    // Create a printable window with minimal chrome
    const printWindow = window.open('', '_blank', 'noopener')
    if (!printWindow) {
      alert('无法打开打印窗口，请允许弹窗或在浏览器中尝试打印。')
      return
    }
    const title = jobTitle || 'Cover Letter'
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <style>
            body{font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color:#111}
            h1{font-size:18px;margin-bottom:6px}
            p{font-size:14px; line-height:1.45}
          </style>
        </head>
        <body>
          <h1>${title}${company ? ' — ' + company : ''}</h1>
          <pre style="white-space:pre-wrap; font-family:inherit; font-size:14px;">${escapeHtml(output)}</pre>
        </body>
      </html>
    `
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    // Wait a bit for render then print
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  function escapeHtml(s: string) {
    return s.replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c] as string))
  }

  function loadFromHistory(item: HistoryItem) {
    setJobTitle(item.jobTitle || '')
    setCompany(item.company || '')
    setJobDesc(item.inputJobDesc || '')
    setBulletsText((item.bullets || []).join('\n'))
    setOutput(item.output)
    setGenState('done')
  }

  function clearAllHistory() {
    if (!confirm('确认清除本地历史？')) return
    localStorage.removeItem('ai_cl_history')
    setHistory([])
  }

  return (
    <div id="app" className="max-w-4xl mx-auto px-4 py-8">
      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold">Settings (BYOK & Pro)</h2>
        <p className="text-sm text-gray-600">输入你的 OpenAI Key （只保存在本地）。本页面不会把 Key 发送到任何第三方。使用风险自负。</p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-... (OpenAI API Key)"
            className="col-span-2 p-2 border rounded"
          />
          <button onClick={saveKey} className="p-2 bg-sky-600 text-white rounded">保存 Key</button>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="your@email.com （输入以标记为 Pro，免费）"
            className="col-span-2 p-2 border rounded"
          />
          <button onClick={markPro} className="p-2 bg-amber-500 text-black rounded">标记为 Pro</button>
        </div>
      </section>

      <section className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-semibold">Generate Cover Letter</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={jobTitle} onChange={(e)=>setJobTitle(e.target.value)} placeholder="职位名称（可选）" className="p-2 border rounded" />
          <input value={company} onChange={(e)=>setCompany(e.target.value)} placeholder="公司（可选）" className="p-2 border rounded" />
        </div>

        <textarea
          value={jobDesc}
          onChange={(e)=>setJobDesc(e.target.value)}
          placeholder="粘贴职位描述（Job description / requirements）"
          rows={6}
          className="w-full mt-3 p-3 border rounded resize-vertical"
        />

        <textarea
          value={bulletsText}
          onChange={(e)=>setBulletsText(e.target.value)}
          placeholder="你的经验要点（一行一个 bullet）"
          rows={4}
          className="w-full mt-3 p-3 border rounded resize-vertical"
        />

        <div className="mt-3 flex gap-2 items-center">
          <button
            onClick={generate}
            disabled={genState === 'generating'}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
          >
            {genState === 'generating' ? '生成中...' : '生成 Cover Letter'}
          </button>

          <button
            onClick={() => {
              setJobTitle(''); setCompany(''); setJobDesc(''); setBulletsText(''); setOutput(''); setErrorMsg(''); setGenState('idle')
            }}
            className="px-3 py-2 border rounded"
          >
            清空
          </button>

          <div className="ml-auto text-sm text-gray-500">
            {isPro ? <span className="px-2 py-1 bg-amber-50 rounded">Pro（已标记）</span> : <span>免费：每天 1 次</span>}
          </div>
        </div>

        {errorMsg && <div className="mt-3 text-sm text-red-600">{errorMsg}</div>}
      </section>

      <section className="bg-white shadow rounded p-4 mb-6">
        <div className="flex items-start gap-3">
          <h3 className="text-base font-semibold">Result</h3>
          <div className="ml-auto flex gap-2 no-print">
            <button onClick={copyOutput} disabled={!output} className="px-3 py-1 border rounded">复制</button>
            <button onClick={printPreview} disabled={!output} className="px-3 py-1 border rounded">下载 PDF（打印）</button>
          </div>
        </div>

        <div className="mt-3 min-h-[140px] p-3 border rounded">
          {genState === 'generating' && <div className="text-gray-500">正在生成，请稍候...</div>}
          {genState === 'error' && <div className="text-red-600">{errorMsg}</div>}
          {output ? (
            <pre className="whitespace-pre-wrap break-words text-sm">{output}</pre>
          ) : (
            <div className="text-gray-400">生成的 Cover Letter 会显示在这里。</div>
          )}
        </div>
      </section>

      <section id="history" className="bg-white shadow rounded p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">History</h3>
          <div className="flex gap-2">
            <button onClick={() => {
              const h = getHistory()
              setHistory(h)
            }} className="px-2 py-1 border rounded">刷新</button>
            <button onClick={clearAllHistory} className="px-2 py-1 border rounded">清除</button>
          </div>
        </div>

        <div className="mt-3">
          {history.length === 0 && <div className="text-gray-400">暂无历史</div>}
          <ul className="space-y-3">
            {history.map(h => (
              <li key={h.id} className="p-3 border rounded">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">{new Date(h.date).toLocaleString()}</div>
                    <div className="font-medium">{h.jobTitle || 'Untitled'} {h.company ? '— ' + h.company : ''}</div>
                    <div className="text-sm mt-2 line-clamp-3">{h.output}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => loadFromHistory(h)} className="px-2 py-1 border rounded text-sm">加载</button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(h.output)
                      alert('已复制')
                    }} className="px-2 py-1 border rounded text-sm">复制</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pro" className="bg-white shadow rounded p-4 mb-8">
        <h3 className="text-base font-semibold">Pro（标记）</h3>
        <p className="text-sm text-gray-600">输入一个邮箱将本地标记为 Pro（仅本地保存，不收费）。Pro 用户无限制生成。仅作为方便的功能切换。</p>
        <div className="mt-3 flex gap-2">
          <input value={emailInput} onChange={(e)=>setEmailInput(e.target.value)} placeholder="your@email.com" className="p-2 border rounded flex-1" />
          <button onClick={() => {
            if (!emailInput.trim()) return alert('请输入邮箱')
            setProEmail(emailInput.trim())
            setIsPro(true)
            alert('已标记为 Pro（本地）')
          }} className="px-3 py-2 bg-amber-400 rounded">标记为 Pro</button>
        </div>
      </section>

      <footer className="text-center text-sm text-gray-500 py-10">
        <div className="no-print">注意：本应用在浏览器端直接调用 OpenAI API，请勿在公共设备下保存 Key。<br/>静态站点，可部署到 GitHub Pages。</div>
        <div className="text-xs mt-2">© AI Cover Letter</div>
      </footer>
    </div>
  )
}
