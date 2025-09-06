import { supabase } from "../supabaseClient.js";
import { checkLevelUp } from "../utils/levelUp.js";

export default {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return;

    if (message.mentions.has(message.client.user)) {
      const chance = Math.random();
      if (chance < 0.1) {
        await message.reply(`<:ajugh:1413735863598186567> what?`);
      }
    }

    const userId = message.author.id;
    const guild = message.guild;
    const guildId = guild?.id ?? "dm";

    try {
      let { data: userData, error } = await supabase
        .from("user_exp")
        .select("messages, exp_points, last_message")
        .eq("user_id", userId)
        .eq("guild_id", guildId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error(error);
        return;
      }

      let newMessageCount = 1;
      let newExpPoints = 1;
      if (!userData) {
        await supabase.from("user_exp").insert([
          {
            user_id: userId,
            guild_id: guildId,
            messages: 1,
            exp_points: 1,
            last_message: new Date().toISOString(),
          },
        ]);
      } else {
        newMessageCount = userData.messages + 1;
        newExpPoints = (userData.exp_points || 0) + 1;

        await supabase.from("user_exp").upsert(
          [
            {
              user_id: userId,
              guild_id: guildId,
              messages: newMessageCount,
              exp_points: newExpPoints,
              last_message: new Date().toISOString(),
            },
          ],
          { onConflict: ["user_id", "guild_id"] }
        );
      }

      if (error) console.error("Supabase upsert error:", error);

      if (!guild) return;
      const member = await guild.members.fetch(userId);
      if (!member) return;

      const levelUpChannel = guild.channels.cache.get(
        process.env.CHAT_CHANNEL_ID
      );

      const roleThresholds = [
        { exp: 500, roleId: process.env.LEVEL_10_ROLE_ID },
        { exp: 2500, roleId: process.env.LEVEL_25_ROLE_ID },
        { exp: 4500, roleId: process.env.LEVEL_50_ROLE_ID },
        { exp: 7500, roleId: process.env.LEVEL_100_ROLE_ID },
        { exp: 11500, roleId: process.env.LEVEL_MAX_ROLE_ID },
      ];

      await checkLevelUp(member, newExpPoints, guild);
    } catch (err) {
      console.error(
        "Error while saving messages, exp, assigning roles, or sending level up message.",
        err
      );
    }
  },
};
