import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Favicon di marca generato con next/og: monogramma "D" (Fraunces) su rosso Domus Tua.
export const runtime = "nodejs";
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function Icon() {
  const fraunces = readFileSync(join(process.cwd(), "app/og/fonts/FrauncesStatic.ttf"));
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
          fontFamily: "Fraunces",
          fontSize: 190,
          fontWeight: 600,
          borderRadius: 56,
          paddingBottom: 14,
        }}
      >
        D
      </div>
    ),
    { ...size, fonts: [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }] },
  );
}
