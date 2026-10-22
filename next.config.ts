import withPWA from "@ducanh2912/next-pwa";

const nextConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
})({
  turbopack: {}, // 加這行
  // 新版部署後，舊分頁切換頁面時會偵測到版本不同並自動整頁重新載入（避免按鈕卡住）
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  // 你原本的其他設定
});

export default nextConfig;