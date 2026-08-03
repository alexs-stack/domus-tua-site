import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Favicon di marca generato con next/og: monogramma "D" (Playfair Display,
// la didone di hero e display) su rosso Domus Tua.
export const runtime = "nodejs";
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function Icon() {
  const playfair = readFileSync(join(process.cwd(), "app/og/fonts/PlayfairDisplayStatic.ttf"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d20a0a",
          color: "#faf7f1",
          fontFamily: "Playfair Display",
          fontSize: 190,
          fontWeight: 600,
          borderRadius: 56,
          paddingBottom: 14,
        }}
      >
        D
      </div>
    ),
    { ...size, fonts: [{ name: "Playfair Display", data: playfair, weight: 600, style: "normal" }] },
  );
}
