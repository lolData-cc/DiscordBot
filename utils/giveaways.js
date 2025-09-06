import { supabase } from "../supabaseClient.js";

export async function cleanupEndedGiveaways() {
  const now = Math.floor(Date.now() / 1000);
  const threshold = now - 48 * 3600;

  const { data: oldGiveaways, error } = await supabase
    .from("giveaways")
    .select("id")
    .lt("ended_at", threshold)
    .eq("status", "ended");

  if (error) {
    console.error("Errore nel recuperare i giveaway da eliminare:", error);
  } else if (oldGiveaways?.length) {
    for (const giveaway of oldGiveaways) {
      await supabase.from("giveaways").delete().eq("id", giveaway.id);
      console.log("Giveaway eliminato:", giveaway.id);
    }
  }
}

export async function finishActiveGiveaways(client, finishGiveawayFn) {
  const now = Math.floor(Date.now() / 1000);

  const { data: activeGiveaways } = await supabase
    .from("giveaways")
    .select("*")
    .lte("ends_at", now)
    .eq("status", "active");

  if (activeGiveaways?.length) {
    for (const giveaway of activeGiveaways) {
      await finishGiveawayFn(client, giveaway);
    }
  }
}
