import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Formati moderni: meno peso, stessa qualità.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
  },
};

export default nextConfig;
