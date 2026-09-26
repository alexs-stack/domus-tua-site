// Corpus di PROVA per i test del retrieval.
//
// Perché non usare quello reale: oggi ha nove voci verificate, perché quasi tutti i testi
// aspettano l'approvazione del cliente. Una suite costruita su quelle nove voci verificherebbe
// il contenuto di oggi, non il MOTORE — e andrebbe riscritta appena arrivano i testi veri.
//
// Questo corpus ha invece la forma che avrà quello definitivo: tutte le dodici aree coperte,
// titoli e keyword nello stesso stile. I contenuti sono PLACEHOLDER espliciti e non escono mai
// da qui: nessun rischio che finiscano in una risposta.
//
// Gli stati non verificati sono presenti di proposito: servono a dimostrare che restano fuori.

import type { KnowledgeEntry } from "../knowledge/entries";

function entry(
  id: string,
  category: KnowledgeEntry["category"],
  title: string,
  content: string,
  keywords: string[],
  status: KnowledgeEntry["status"] = "verified",
): KnowledgeEntry {
  return {
    id,
    category,
    title,
    content,
    status,
    source: "corpus di prova",
    lastVerified: status === "verified" ? "2026-07-31" : "",
    locale: "it",
    keywords,
  };
}

export const FIXTURE_KNOWLEDGE: KnowledgeEntry[] = [
  entry("f-identita", "identita", "Chi è l'agenzia",
    "[prova] Agenzia immobiliare di Tradate, in provincia di Varese, attiva dal 2007.",
    ["agenzia", "azienda", "sede", "storia", "anni", "fondata"]),

  entry("f-assistente", "identita", "Assistente virtuale",
    "[prova] Sono un software, non una persona.",
    ["assistente", "robot", "bot", "umano", "persona", "intelligenza artificiale"]),

  entry("f-contatti", "contatti", "Recapiti",
    "[prova] Telefono, WhatsApp e indirizzo email dell'agenzia.",
    ["telefono", "chiamare", "numero", "whatsapp", "email", "recapiti", "dove siete"]),

  entry("f-referente", "contatti", "Chi segue i casi complessi",
    "[prova] Referente indicato per le situazioni che l'assistente non copre.",
    ["referente", "responsabile", "titolare", "chi segue", "parlare"]),

  entry("f-orari", "orari", "Orari di apertura",
    "[prova] Lunedì-venerdì mattina e pomeriggio, sabato mattina, domenica chiuso.",
    ["orari", "aperto", "chiuso", "sabato", "domenica", "pomeriggio", "apertura"]),

  entry("f-area", "area", "Zona servita",
    "[prova] Tradate e comuni vicini della provincia di Varese.",
    ["zona", "comuni", "provincia", "varese", "tradate", "area", "territorio", "coprite"]),

  entry("f-metodo", "metodo", "Il Metodo Domus Tua",
    "[prova] Percorso in più fasi che l'agenzia segue per accompagnare chi vende.",
    ["metodo", "fasi", "percorso", "come lavorate", "procedura"]),

  entry("f-doc", "domus-doc", "Domus D.O.C.",
    "[prova] Protocollo di verifica documentale sull'immobile prima della vendita.",
    ["doc", "d.o.c.", "certificata", "origine", "documenti verificati", "verifica documentale"]),

  entry("f-open", "open-domus", "Open Domus",
    "[prova] Formato di visita organizzata su appuntamento.",
    ["open domus", "open house", "porte aperte", "visite collettive", "evento"]),

  entry("f-vendita", "vendita", "Come si vende casa",
    "[prova] Dal primo contatto all'incarico di vendita.",
    ["vendere", "vendita", "incarico", "mandato", "mettere in vendita"]),

  entry("f-acquisto", "acquisto", "Come si compra casa",
    "[prova] Dalla ricerca alla proposta d'acquisto.",
    ["comprare", "acquisto", "acquistare", "primo passo"]),

  entry("f-valutazione", "valutazione", "Valutazione dell'immobile",
    "[prova] Come si richiede una stima del valore della casa.",
    ["valutazione", "quanto vale", "stima", "perizia", "valore"]),

  entry("f-appuntamenti", "appuntamenti", "Appuntamenti e visite",
    "[prova] Come si prenota una visita a un immobile.",
    ["appuntamento", "visita", "vedere casa", "sopralluogo", "prenotare", "visitare"]),

  entry("f-proposte", "proposte", "Proposta d'acquisto",
    "[prova] Passaggi generali dalla proposta al rogito.",
    ["proposta", "offerta", "caparra", "preliminare", "compromesso", "rogito"]),

  entry("f-trattativa", "proposte", "Trattare sul prezzo",
    "[prova] Cosa succede quando si propone una cifra più bassa.",
    ["trattare", "sconto", "abbassare", "ribasso", "margine", "offrire", "cifra più bassa"]),

  entry("f-limiti", "limiti", "Cosa non posso fare",
    "[prova] Niente consulenza legale, fiscale, notarile o tecnica.",
    ["limiti", "legale", "fiscale", "notaio", "tasse", "mutuo", "conformita", "catastale"]),

  entry("f-garanzie", "limiti", "Nessuna promessa su tempi e prezzi",
    "[prova] Tempi ed esiti non sono garantibili.",
    ["garanzia", "garantisci", "promessa", "tempi di vendita", "certezza"]),

  entry("f-privacy", "limiti", "Trattamento della conversazione",
    "[prova] La conversazione non viene conservata.",
    ["privacy", "dati", "conservate", "salvate", "gdpr", "trattamento"]),

  entry("f-faq-spese", "faq", "Costi per chi compra",
    "[prova] Quali costi sono a carico di chi acquista.",
    ["costi", "spese", "provvigione", "commissioni", "quanto costa"]),

  entry("f-faq-mutuo", "faq", "Supporto per il mutuo",
    "[prova] L'agenzia può indirizzare verso consulenti per il finanziamento.",
    ["mutuo", "finanziamento", "banca", "prestito", "rata"]),

  // ── Non utilizzabili: devono restare fuori da ogni risultato ──────────────
  entry("f-pending", "faq", "Voce in attesa di approvazione",
    "[prova] Contenuto non ancora approvato dal cliente.",
    ["approvazione", "bozza", "attesa"], "pending"),

  entry("f-disabled", "identita", "Voce disabilitata",
    "[prova] Contenuto ritirato di proposito.",
    ["disabilitata", "ritirata"], "disabled"),

  entry("f-verified-vuota", "faq", "Verificata ma senza testo",
    "",
    ["vuota", "senza testo"], "verified"),
];
