// Sonda della VOCE, non della correttezza. I grader dell'eval non vedono la ripetizione di
// una formula tra un turno e l'altro, la differenza tra calore e sdolcinatezza, o se la riga
// di handoff cambia mai. Questo script fa parlare il modello reale su conversazioni scelte
// apposta per stressare quelle cose, e stampa le risposte intere da leggere a mano.
import "./load-env";
import { runAssistantTurn } from "../app/lib/assistant/agent";
import { buildAssistantListings } from "../app/lib/assistant/listings";
import { FIXTURE_LISTINGS } from "../app/lib/assistant/__tests__/fixtures";
import type { ClientMessage } from "../app/lib/assistant/types";
import { AI_PROVIDER, ASSISTANT_MODEL } from "../app/lib/assistant/config";

interface Convo {
  id: string;
  perche: string; // cosa mette alla prova
  turni: string[];
}

// Ogni conversazione è multi-turno perché il tic si vede solo alla ripetizione.
const CONVOS: Convo[] = [
  {
    id: "limite-ripetuto",
    perche: "Stesso tipo di limite tre volte: la formula sui limiti si ripete parola per parola?",
    turni: [
      "Quanto vale casa mia a Tradate?",
      "Ok ma più o meno, una cifra la sai dire?",
      "E i tempi? Garantite di vendere entro l'estate?",
    ],
  },
  {
    id: "carico-emotivo",
    perche: "Casa ereditata dopo un lutto: riconosce senza essere sdolcinato o invadente?",
    turni: [
      "Ho ereditato la casa di mia mamma, è mancata a marzo. Non so se venderla.",
      "Mi fa strano l'idea di svuotarla. Da dove si comincia?",
    ],
  },
  {
    id: "handoff-ripetuto",
    perche: "Tre volte porta a un contatto umano: la riga di chiusura varia o è un timbro?",
    turni: [
      "Vorrei vendere casa, da dove comincio?",
      "E per la valutazione?",
      "Va bene, come vi contatto?",
    ],
  },
  {
    id: "utente-frustrato",
    perche: "Utente seccato: tiene la calma senza fare l'impiegato o scusarsi a vuoto?",
    turni: [
      "Ho già scritto due volte e nessuno mi ha risposto. Serve a qualcosa questa chat?",
      "Cerco una villa a Tradate sotto 300 mila con giardino.",
    ],
  },
  {
    id: "chiacchiera",
    perche: "Saluto e piccola conversazione: calore vero o entusiasmo da brochure?",
    turni: [
      "Ciao, buongiorno!",
      "Niente, davo un'occhiata. Belle le case dalle vostre parti?",
    ],
  },
  {
    id: "termine-tecnico",
    perche: "Chiede una sigla: la traduce in tre parole o insegna la materia (consulenza)?",
    turni: [
      "Cosa vuol dire conformità catastale?",
      "E l'IMU sulla seconda casa quanto è?",
    ],
  },
];

async function turno(messaggi: ClientMessage[]): Promise<{ testo: string; tool: string[] }> {
  let testo = "";
  const tool: string[] = [];
  for await (const ev of runAssistantTurn({
    messages: messaggi,
    listings: LISTINGS,
    onToolCall: (n) => tool.push(n),
  })) {
    if (ev.type === "text") testo += ev.value;
  }
  return { testo, tool };
}

const LISTINGS = buildAssistantListings(FIXTURE_LISTINGS, "live");

async function main() {
  console.log(`# Sonda della voce — ${AI_PROVIDER} / ${ASSISTANT_MODEL}\n`);
  for (const c of CONVOS) {
    console.log(`\n${"=".repeat(78)}\n## ${c.id}\n_${c.perche}_\n`);
    const storia: ClientMessage[] = [];
    let slugPrec: string[] = [];
    for (const t of c.turni) {
      if (storia.length) {
        storia.push({
          role: "assistant",
          content: "Ecco.",
          ...(slugPrec.length ? { listingSlugs: slugPrec } : {}),
        });
      }
      storia.push({ role: "user", content: t });
      const { testo, tool } = await turno(storia);
      console.log(`👤 ${t}`);
      console.log(`🤖 ${testo}${tool.length ? `\n   [tool: ${tool.join(", ")}]` : ""}\n`);
    }
  }
}

void main();
