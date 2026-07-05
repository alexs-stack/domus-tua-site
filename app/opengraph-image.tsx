import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

// Card social 1200x630 di marca (Fraunces + Jakarta + logo reale), generata a build.
// File-convention Next: diventa l'og:image / twitter:image di default del sito.
export const runtime = "nodejs";
export const alt = "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const fraunces = readFileSync(join(process.cwd(), "app/og/fonts/FrauncesStatic.ttf"));
  const jakarta = readFileSync(join(process.cwd(), "app/og/fonts/Jakarta.ttf"));
  const logo = readFileSync(join(process.cwd(), "public/logo-domustua-original.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#faf7f1",
          fontFamily: "Jakarta",
          position: "relative",
        }}
      >
        {/* Barra accento rossa in alto */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, backgroundColor: "#d20a0a", display: "flex" }} />
        {/* Alone caldo in basso a destra */}
        <div style={{ position: "absolute", right: -160, bottom: -160, width: 460, height: 460, borderRadius: 460, backgroundColor: "#fbeaea", display: "flex" }} />

        {/* Riga superiore: logo */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logoSrc} height={60} alt="Domus Tua" style={{ height: 60 }} />
        </div>

        {/* Blocco centrale: eyebrow + payoff */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#a8452f",
              fontWeight: 600,
              marginBottom: 22,
            }}
          >
            Agenzia immobiliare indipendente · Tradate (VA)
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 68,
              lineHeight: 1.08,
              color: "#1a1816",
              maxWidth: 940,
              fontWeight: 600,
            }}
          >
            Vendere senza stress, acquistare con sicurezza.
          </div>
        </div>

        {/* Riga inferiore: sito + firma */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", fontSize: 27, color: "#6f6862", fontWeight: 600 }}>domustua.com</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#1a1816",
              color: "#faf7f1",
              padding: "12px 24px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            Dal 2007 · 4,9 ★ Google
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
        { name: "Jakarta", data: jakarta, weight: 600, style: "normal" },
      ],
    },
  );
}
