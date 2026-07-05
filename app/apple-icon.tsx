import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Apple touch icon: quadrato pieno rosso (iOS applica la propria maschera arrotondata).
export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 132,
          fontWeight: 600,
          paddingBottom: 10,
        }}
      >
        D
      </div>
    ),
    { ...size, fonts: [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }] },
  );
}
