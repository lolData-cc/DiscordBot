// /bounty — today's daily bounty for the lobby, and who has claimed it.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api, resolveLobby, lobbyOption, JADE, CITRINE, IDLE, SITE } from "../utils/loldata.js";

const RARITY = { common: 0x8a8f93, rare: 0x00b8ff, epic: 0xa855c7, legendary: 0xffb615 };

export const data = new SlashCommandBuilder()
  .setName("bounty")
  .setDescription("Today's daily bounty")
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const slug = encodeURIComponent(lobby.slug);
  const today = await api(interaction, `/api/scout/bounty/today/${slug}`);
  if (!today) return;

  if (!today.template) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(IDLE)
          .setAuthor({ name: lobby.label || "Scout lobby" })
          .setTitle("No bounty today")
          .setURL(`${SITE}/scout/${lobby.slug}`)
          .setFooter({ text: "loldata.cc · scout" }),
      ],
    });
  }

  const t = today.template;
  const claimed = today.state === "claimed" || !!today.claimed_at;

  const embed = new EmbedBuilder()
    .setColor(claimed ? JADE : RARITY[t.rarity] ?? CITRINE)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(`${claimed ? "✅ " : "🎯 "}${t.title}`)
    .setURL(`${SITE}/scout/${lobby.slug}/leaderboard`)
    .setDescription(t.description)
    .addFields(
      { name: "Target", value: `**${t.threshold}** ${t.metric}`, inline: true },
      { name: "Rarity", value: String(t.rarity ?? "—"), inline: true },
      {
        name: "Status",
        value: claimed
          ? `Claimed${today.claimed_value != null ? ` with **${today.claimed_value}**` : ""}`
          : "Still up for grabs",
        inline: true,
      }
    )
    .setFooter({ text: `loldata.cc · scout · ${today.day_utc}` })
    .setTimestamp(new Date());

  // The standings endpoint returns {rows: []} until someone has claimed one.
  const board = await api(interaction, `/api/scout/bounty/leaderboard/${slug}`);
  const rows = board?.rows ?? [];
  if (rows.length) {
    embed.addFields({
      name: "Most bounties claimed",
      value: rows
        .slice(0, 8)
        .map((r, i) => `\`${String(i + 1).padStart(2)}\` ${r.displayName ?? r.display_name ?? "—"} · **${r.claims ?? r.count ?? 0}**`)
        .join("\n"),
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}
