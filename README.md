# covercraft-ai
# AI Cover Letter Generator

静态前端应用（Next.js + Tailwind + TypeScript） — 在浏览器中使用你自己的 OpenAI Key（BYOK）来生成求职信。适配 GitHub Pages（`next export`）。

## 特性
- 完全静态、无后端
- BYOK：在浏览器本地保存 OpenAI Key（localStorage）
- 免费版：每天一次 | Pro（邮箱标记）：无限
- 历史保存（localStorage）
- 一键复制 & 下载为 PDF（通过浏览器打印）
- 响应式，移动友好

## 本地运行
```bash
npm install
npm run dev
# or
npm run build
npm run export
# deploy `out` (或 `.next/export`/`export`) 到 GitHub Pages
