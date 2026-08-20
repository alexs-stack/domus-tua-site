// Set completo dei tool dell'assistente.
//
// Il set è CHIUSO e volutamente piccolo: cinque strumenti, tutti con schema tipizzato.
// Il modello non può eseguire nulla che non sia qui dentro, non può passare URL da
// scaricare né istruzioni arbitrarie.

import { createGetAreaProfile } from "./getAreaProfile";
import { createGetListingDetails } from "./getListingDetails";
import { createPrepareEmailEnquiry } from "./prepareEmailEnquiry";
import { createPrepareWhatsAppHandoff } from "./prepareWhatsAppHandoff";
import { createRetrieveAgencyKnowledge } from "./retrieveAgencyKnowledge";
import { createSearchListings } from "./searchListings";
import type { ToolContext } from "./context";

export type { ToolContext } from "./context";

export function createAssistantTools(ctx: ToolContext) {
  return {
    search_listings: createSearchListings(ctx),
    get_listing_details: createGetListingDetails(ctx),
    retrieve_agency_knowledge: createRetrieveAgencyKnowledge(),
    prepare_whatsapp_handoff: createPrepareWhatsAppHandoff(ctx),
    prepare_email_enquiry: createPrepareEmailEnquiry(ctx),
    // get_area_profile compare SOLO a territorio attivo: a feature spenta il set è identico a prima.
    ...(ctx.territory ? { get_area_profile: createGetAreaProfile(ctx) } : {}),
  };
}

export type AssistantTools = ReturnType<typeof createAssistantTools>;
