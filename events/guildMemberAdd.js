import { supabase } from "../supabaseClient.js";

const VERIFIED_ROLE_ID = "1407664698798768138";

export default {
  name: "guildMemberAdd",
  async execute(member) {
    try {
      const { data, error } = await supabase
        .from("profile_players")
        .select("discord_id")
        .eq("discord_id", member.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Supabase error on guildMemberAdd:", error);
        return;
      }

      if (data) {
        const role = member.guild.roles.cache.get(VERIFIED_ROLE_ID);
        if (!role) {
          console.error(`Role ${VERIFIED_ROLE_ID} not found in guild.`);
          return;
        }
        await member.roles.add(role);
        console.log(`Assigned verified role to ${member.user.tag} (${member.id})`);
      }
    } catch (err) {
      console.error("Error in guildMemberAdd handler:", err);
    }
  },
};
