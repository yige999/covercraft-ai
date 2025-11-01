export type HistoryItem = {
  id: string
  date: string // ISO
  jobTitle: string
  company?: string
  inputJobDesc: string
  bullets: string[]
  output: string
  isPro: boolean
}

const KEY_API = 'ai_cl_api_key'
const KEY_HISTORY = 'ai_cl_history'
const KEY_USAGE = 'ai_cl_usage' // { date: 'YYYY-MM-DD', count: number }
const KEY_PRO_EMAIL = 'ai_cl_pro_email'

export function setApiKey(key: string) {
  localStorage.setItem(KEY_API, key)
}

export function getApiKey(): string | null {
  return localStorage.getItem(KEY_API)
}

export function setProEmail(email: string) {
  localStorage.setItem(KEY_PRO_EMAIL, email)
}

export function getProEmail() {
  return localStorage.getItem(KEY_PRO_EMAIL)
}

export function saveHistory(item: HistoryItem) {
  const raw = localStorage.getItem(KEY_HISTORY)
  const arr: HistoryItem[] = raw ? JSON.parse(raw) : []
  arr.unshift(item)
  localStorage.setItem(KEY_HISTORY, JSON.stringify(arr.slice(0, 50)))
}

export function getHistory(): HistoryItem[] {
  const raw = localStorage.getItem(KEY_HISTORY)
  return raw ? JSON.parse(raw) : []
}

export function clearHistory() {
  localStorage.removeItem(KEY_HISTORY)
}

export function canUseFree(): boolean {
  // Free version: max 1 per calendar day unless pro
  const raw = localStorage.getItem(KEY_USAGE)
  const today = new Date().toISOString().slice(0, 10)
  if (!raw) return true
  try {
    const obj = JSON.parse(raw) as { date: string; count: number }
    if (obj.date !== today) return true
    return obj.count < 1
  } catch {
    return true
  }
}

export function recordUsage() {
  const raw = localStorage.getItem(KEY_USAGE)
  const today = new Date().toISOString().slice(0, 10)
  let obj = { date: today, count: 0 }
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { date: string; count: number }
      if (parsed.date === today) obj = parsed
    } catch {}
  }
  obj.count = (obj.count || 0) + 1
  localStorage.setItem(KEY_USAGE, JSON.stringify(obj))
}

export { KEY_API, KEY_HISTORY, KEY_USAGE, KEY_PRO_EMAIL }
