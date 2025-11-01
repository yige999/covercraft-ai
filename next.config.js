/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // 使 next export 生成静态文件（供 GitHub Pages 使用）
  trailingSlash: true // 对 GitHub Pages 更友好（可选）
}

module.exports = nextConfig
