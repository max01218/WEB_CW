/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允許在客戶端組件中使用 antd
  transpilePackages: ['antd', '@ant-design', 'rc-util', 'rc-pagination', 'rc-picker'],
  
  // 其他配置
  reactStrictMode: true,
}

module.exports = nextConfig 