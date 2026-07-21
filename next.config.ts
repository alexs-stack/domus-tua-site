import type { NextConfig } from "next";

// Timestamp del build, valutato una volta a build-time (Node). Inlinato come process.env.BUILD_TIME
// e riportato da /api/health per capire "quando è stato buildato questo deploy" senza aprire Vercel.
const BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  // Variabili inlinate a build-time nel bundle (non segrete: solo metadati di build).
  env: {
    BUILD_TIME,
  },
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
