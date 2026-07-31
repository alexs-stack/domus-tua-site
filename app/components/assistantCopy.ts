// Testi dell'assistente, in un file suo.
//
// Perché separati dal componente: il launcher (AssistantMount) ne usa una riga sola e deve
// restare leggerissimo — il pannello arriva in un chunk a parte. Se le stringhe stessero
// dentro Assistant.tsx, il launcher trascinerebbe tutto il pannello con sé.

import type { Locale } from "../lib/i18n/dictionaries";

export type AssistantCopy = {
  launcher: string;
  title: string;
  subtitle: string;
  close: string;
  newChat: string;
  placeholder: string;
  send: string;
  stop: string;
  /** Mostrato quando si interrompe prima che la risposta sia iniziata. */
  stopped: string;
  greeting: string;
  suggestions: readonly string[];
  error: string;
  retry: string;
  offline: string;
  /** Riga di contatti sempre disponibile: tre canali distinti, non un menu unico. */
  contact: { intro: string; email: string; whatsapp: string; phone: string };
  disclaimer: string;
};

export const assistantCopy: Record<Locale, AssistantCopy> = {
  it: {
    launcher: "Apri l’assistente Domus Tua",
    title: "Assistente Domus Tua",
    subtitle: "Ti aiuto a trovare casa",
    close: "Chiudi",
    newChat: "Nuova conversazione",
    placeholder: "Scrivi qui la tua domanda…",
    send: "Invia",
    stop: "Interrompi la risposta",
    stopped: "Risposta interrotta.",
    greeting:
      "Ciao! Sono l’assistente di Domus Tua. Posso aiutarti a trovare casa, capire come vendere o rispondere alle domande più comuni. Come posso aiutarti?",
    suggestions: [
      "Cerco una villa",
      "Vorrei vendere casa",
      "Come funziona Open Domus?",
      "Voglio parlare con voi",
    ],
    error: "Ops, qualcosa è andato storto. Riprova o scrivici su WhatsApp.",
    retry: "Riprova",
    offline: "Sembra che tu sia offline. Torna quando hai connessione, oppure chiamaci.",
    contact: {
      intro: "Preferisci una persona?",
      email: "Scrivi una email",
      whatsapp: "Scrivi su WhatsApp",
      phone: "Telefona",
    },
    disclaimer: "Assistente virtuale. Gli immobili citati provengono dai nostri annunci.",
  },
  en: {
    launcher: "Open the Domus Tua assistant",
    title: "Domus Tua assistant",
    subtitle: "I’ll help you find a home",
    close: "Close",
    newChat: "New conversation",
    placeholder: "Type your question here…",
    send: "Send",
    stop: "Stop the reply",
    stopped: "Reply stopped.",
    greeting:
      "Hi! I’m the Domus Tua assistant. I can help you find a home, explain how selling works, or answer the most common questions. How can I help?",
    suggestions: [
      "I’m looking for a villa",
      "I’d like to sell my home",
      "How does Open Domus work?",
      "I’d like to talk to someone",
    ],
    error: "Oops, something went wrong. Please try again or message us on WhatsApp.",
    retry: "Try again",
    offline: "You seem to be offline. Come back when you have a connection, or call us.",
    contact: {
      intro: "Prefer a person?",
      email: "Send an email",
      whatsapp: "Message on WhatsApp",
      phone: "Call us",
    },
    disclaimer: "Virtual assistant. Any listings shown come from our own portfolio.",
  },
  fr: {
    launcher: "Ouvrir l’assistant Domus Tua",
    title: "Assistant Domus Tua",
    subtitle: "Je vous aide à trouver un bien",
    close: "Fermer",
    newChat: "Nouvelle conversation",
    placeholder: "Écrivez votre question ici…",
    send: "Envoyer",
    stop: "Interrompre la réponse",
    stopped: "Réponse interrompue.",
    greeting:
      "Bonjour ! Je suis l’assistant de Domus Tua. Je peux vous aider à trouver un bien, vous expliquer comment vendre ou répondre aux questions les plus fréquentes. Comment puis-je vous aider ?",
    suggestions: [
      "Je cherche une villa",
      "Je voudrais vendre mon bien",
      "Comment fonctionne Open Domus ?",
      "Je voudrais parler à quelqu’un",
    ],
    error: "Oups, une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.",
    retry: "Réessayer",
    offline: "Vous semblez hors ligne. Revenez avec une connexion, ou appelez-nous.",
    contact: {
      intro: "Vous préférez une personne ?",
      email: "Écrire un e-mail",
      whatsapp: "Écrire sur WhatsApp",
      phone: "Téléphoner",
    },
    disclaimer: "Assistant virtuel. Les biens mentionnés proviennent de nos annonces.",
  },
  de: {
    launcher: "Domus-Tua-Assistenten öffnen",
    title: "Domus-Tua-Assistent",
    subtitle: "Ich helfe Ihnen, ein Zuhause zu finden",
    close: "Schließen",
    newChat: "Neue Unterhaltung",
    placeholder: "Schreiben Sie hier Ihre Frage…",
    send: "Senden",
    stop: "Antwort abbrechen",
    stopped: "Antwort abgebrochen.",
    greeting:
      "Hallo! Ich bin der Assistent von Domus Tua. Ich helfe Ihnen, ein Zuhause zu finden, erkläre den Verkauf oder beantworte die häufigsten Fragen. Wie kann ich helfen?",
    suggestions: [
      "Ich suche eine Villa",
      "Ich möchte verkaufen",
      "Wie funktioniert Open Domus?",
      "Ich möchte mit jemandem sprechen",
    ],
    error: "Ups, etwas ist schiefgelaufen. Bitte erneut versuchen oder auf WhatsApp schreiben.",
    retry: "Erneut versuchen",
    offline: "Sie scheinen offline zu sein. Kommen Sie mit Verbindung zurück – oder rufen Sie an.",
    contact: {
      intro: "Lieber persönlich?",
      email: "E-Mail schreiben",
      whatsapp: "Auf WhatsApp schreiben",
      phone: "Anrufen",
    },
    disclaimer: "Virtueller Assistent. Genannte Objekte stammen aus unseren Angeboten.",
  },
  es: {
    launcher: "Abrir el asistente de Domus Tua",
    title: "Asistente Domus Tua",
    subtitle: "Te ayudo a encontrar casa",
    close: "Cerrar",
    newChat: "Nueva conversación",
    placeholder: "Escribe aquí tu pregunta…",
    send: "Enviar",
    stop: "Detener la respuesta",
    stopped: "Respuesta detenida.",
    greeting:
      "¡Hola! Soy el asistente de Domus Tua. Puedo ayudarte a encontrar casa, explicarte cómo vender o responder a las preguntas más frecuentes. ¿En qué puedo ayudarte?",
    suggestions: [
      "Busco una villa",
      "Quiero vender mi casa",
      "¿Cómo funciona Open Domus?",
      "Quiero hablar con vosotros",
    ],
    error: "Vaya, algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.",
    retry: "Reintentar",
    offline: "Parece que estás sin conexión. Vuelve cuando tengas red, o llámanos.",
    contact: {
      intro: "¿Prefieres hablar con una persona?",
      email: "Escribir un email",
      whatsapp: "Escribir por WhatsApp",
      phone: "Llamar",
    },
    disclaimer: "Asistente virtual. Los inmuebles mostrados provienen de nuestros anuncios.",
  },
};
