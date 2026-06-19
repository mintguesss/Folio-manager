import withPWA from "@ducanh2912/next-pwa";

const nextConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
})({
  turbopack: {}, // 加這行
  // 你原本的其他設定
});

export default nextConfig;