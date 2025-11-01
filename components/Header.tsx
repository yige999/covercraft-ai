import React from 'react'

export default function Header() {
  return (
    <header className="w-full bg-white/60 backdrop-blur sticky top-0 z-50 border-b">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-sky-400 rounded flex items-center justify-center text-white font-bold">AI</div>
          <div>
            <h1 className="text-lg font-semibold">AI Cover Letter</h1>
            <p className="text-xs text-gray-500">Client-side OpenAI • BYOK • Static export</p>
          </div>
        </div>
        <nav className="hidden sm:flex gap-3 items-center text-sm">
          <a href="#app" className="px-3 py-1 rounded hover:bg-gray-100">Generate</a>
          <a href="#history" className="px-3 py-1 rounded hover:bg-gray-100">History</a>
          <a href="#pro" className="px-3 py-1 rounded bg-amber-50 border">Pro</a>
        </nav>
      </div>
    </header>
  )
}
