import type { Metadata } from "next";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SegnoDomus } from "./components/BrandMotif";
import { Cta } from "./components/primitives/Cta";

export const metadata: Metadata = {
  title: "Pagina non trovata",
  description: "La pagina che cercavi non esiste o è stata spostata.",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center bg-cream">
        <div className="mx-auto w-full max-w-[1240px] px-5 py-32 pt-40 sm:px-8 sm:py-40">
          <div className="max-w-2xl">
            <SegnoDomus className="mb-6 h-7 w-16" embrace={false} />
            <span className="eyebrow">Errore 404</span>

            <h1 className="mt-6 font-display text-[2.8rem] font-medium leading-[1.02] tracking-[-0.02em] text-ink balance sm:text-6xl lg:text-[4.6rem]">
              Questa pagina ha
              <br />
              <span className="italic text-red">cambiato casa.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-stone sm:text-lg">
              La pagina che cercavi non esiste, oppure è stata spostata. Nessun problema:
              torniamo insieme sulla strada giusta, siamo qui per aiutarti.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Cta href="/" variant="cta" size="lg">
                Torna alla home
              </Cta>
              {/* §6.7, famiglia acquirente: il pulsante porta a /acquista, quindi
                  «Vedi le case in vendita» — che è la formula, e descrive esattamente
                  ciò che succede al clic. «Cerca una casa» era una nona variante. */}
              <Cta href="/acquista" variant="ghost" size="lg">
                Vedi le case in vendita
              </Cta>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
