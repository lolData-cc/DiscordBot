import { supabase } from "../supabaseClient.js";

const VERIFIED_ROLE_ID = "1407664698798768138";

export function startRealtimeRoleSync(client) {
  supabase
    .channel("profile_players_discord_sync")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profile_players",
      },
      async (payload) => {
        const discordId = payload.new?.discord_id;
        if (!discordId) return;

        try {
          const guild = client.guilds.cache.first();
          if (!guild) return;

          const member = await guild.members.fetch(discordId).catch(() => null);
          if (!member) return;

          if (member.roles.cache.has(VERIFIED_ROLE_ID)) return;

          const role = guild.roles.cache.get(VERIFIED_ROLE_ID);
          if (!role) {
            console.error(`Role ${VERIFIED_ROLE_ID} not found in guild.`);
            return;
          }

          await member.roles.add(role);
          console.log(
            `[realtime] Assigned verified role to ${member.user.tag} (${discordId})`
          );
        } catch (err) {
          console.error("[realtime] Error assigning role:", err);
        }
      }
    )
    .subscribe((status) => {
      console.log(`[realtime] profile_players subscription: ${status}`);
    });
}
