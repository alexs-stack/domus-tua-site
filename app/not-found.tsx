import type { Metadata } from "next";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SegnoDomus } from "./components/BrandMotif";
import { ArrowUpRight, ArrowRight } from "./components/Icons";

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
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                Torna alla home
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
              <Link
                href="/case"
                className="group flex items-center justify-center gap-1.5 rounded-full border border-line bg-paper px-7 py-4 text-base font-semibold text-ink transition-all duration-300 hover:border-red/40"
              >
                Cerca una casa
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
