import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Formati moderni: meno peso, stessa qualità.
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 220, 300, 384],
    // Thumbnail YouTube (LazyYouTubeEmbed): ottimizzate via next/image invece di servite raw.
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      // Foto immobili dal feed RealSmart (gestionale = source of truth).
      { protocol: "https", hostname: "cloud2.realsmart.it" },
      { protocol: "https", hostname: "*.realsmart.it" },
    ],
  },
};

export default nextConfig;
