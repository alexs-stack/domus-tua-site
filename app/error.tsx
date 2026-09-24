"use client";

import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SegnoDomus } from "./components/BrandMotif";
import { Cta, CtaButton } from "./components/primitives/Cta";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In produzione andrebbe collegato a un servizio di error reporting.
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center bg-cream">
        <div className="mx-auto w-full max-w-[1240px] px-5 py-32 pt-40 sm:px-8 sm:py-40">
          <div className="max-w-2xl">
            <SegnoDomus className="mb-6 h-7 w-16" embrace={false} />
            <span className="eyebrow">Qualcosa è andato storto</span>

            <h1 className="mt-6 font-display text-[2.8rem] font-medium leading-[1.02] tracking-[-0.02em] text-ink balance sm:text-6xl lg:text-[4.4rem]">
              Ci scusiamo per
              <br />
              <span className="text-red">l&apos;inconveniente.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-stone sm:text-lg">
              Si è verificato un errore imprevisto durante il caricamento della pagina. Puoi
              riprovare tra un istante oppure tornare alla home. Se il problema persiste,
              siamo a tua disposizione.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <CtaButton type="button" onClick={() => reset()} variant="cta" size="lg">
                Riprova
              </CtaButton>
              <Cta href="/" variant="ghost" size="lg">
                Torna alla home
              </Cta>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
