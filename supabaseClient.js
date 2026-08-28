import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "loldata-bot/1.0" } },
  }
);

/**
 * The self-hosted box.
 *
 * ⚠️ The bot talks to TWO databases. Everything it owns — threads, giveaways,
 * user_exp, giveaway_entries, profile_players — is still on Supabase Cloud and
 * uses `supabase` above. The scout family moved to the box on 2026-08-28, so
 * `scout_lobby_webhooks` is read through here instead; reading it from Cloud
 * now finds nothing, and the /live command silently answers "no lobby".
 *
 * Falls back to the Cloud URL when MATCH_SUPABASE_URL is unset, so a laptop
 * checkout keeps working exactly as before.
 */
export const supabaseBox = createClient(
  process.env.MATCH_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    global: { headers: { "X-Client-Info": "loldata-bot/1.0 (box)" } },
  }
);
