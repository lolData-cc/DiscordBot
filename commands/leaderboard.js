import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { supabase } from "../supabaseClient.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Shows the top 25 users with most exp points");

export async function execute(interaction) {
  const guildId = interaction.guildId;

  try {
    let { data: leaderboard, error } = await supabase
      .from("user_exp")
      .select("user_id, exp_points")
      .eq("guild_id", guildId)
      .order("exp_points", { ascending: false })
      .limit(25);

    if (error) {
      console.error(error);
      return interaction.reply({
        content: "There was an error while retrieving data.",
        ephemeral: true,
      });
    }

    if (!leaderboard || leaderboard.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> Leaderboard is empty.`
            ),
        ],
        ephemeral: true,
      });
    }

    const specialRoles = [
      {
        id: process.env.MEMBER_ROLE_ID,
        emoji: "",
      },
      {
        id: process.env.LEVEL_10_ROLE_ID,
        emoji: "<:initiate:1413070725148839986>",
      },
      {
        id: process.env.LEVEL_25_ROLE_ID,
        emoji: "<:insider:1413070718979018792>",
      },
      {
        id: process.env.LEVEL_50_ROLE_ID,
        emoji: "<:advocate:1413070721017708584>",
      },
      {
        id: process.env.LEVEL_100_ROLE_ID,
        emoji: "<:associate:1413070727497777294>",
      },
      {
        id: process.env.LEVEL_MAX_ROLE_ID,
        emoji: "<:ambassador:1413070723404140564>",
      },
    ];

    let description = "";
    for (let i = 0; i < leaderboard.length; i++) {
      const userId = leaderboard[i].user_id;
      const exp = leaderboard[i].exp_points;
      const showedExp = Math.floor(exp / 10);

      const member = await interaction.guild.members.fetch(userId);
      const ownedSpecialRoles = member.roles.cache.filter((role) =>
        specialRoles.some((r) => r.id === role.id)
      );

      let specialRoleText = "";
      if (ownedSpecialRoles.size > 0) {
        const highestRole = ownedSpecialRoles
          .sort((a, b) => b.position - a.position)
          .first();

        const roleData = specialRoles.find((r) => r.id === highestRole.id);

        specialRoleText = ` — ${roleData.emoji}<@&${highestRole.id}>`;
      }

      if (i === 0) {
        description += `### 1. ${specialRoleText} <@${userId}> — ${showedExp} exp\n`;
      } else {
        description += `${
          i + 1
        }. ${specialRoleText} <@${userId}> — ${showedExp} exp\n`;
      }
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `## <:loldatathrophy:1412076051034669206> Exp Leaderboard\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>\nCurrent top \`‎ #25‎ \` users with most exp points. Sending messages will grant you experience, as well as winning trivia quizzes. To learn more about it, visit [tiers](https://discord.com/channels/1400118983885324411/1411950273718521998).\n${description}`
          ),
      ],
    });
  } catch (err) {
    console.error("Errore leaderboard:", err);
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> There was an error.`
          ),
      ],
      ephemeral: true,
    });
  }
}
