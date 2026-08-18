// /today — the lobby's session so far: games, W/L, winrate, KDA.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api, resolveLobby, lobbyOption, JADE, LOSS, IDLE, SITE } from "../utils/loldata.js";

/** A 10-cell bar — reads at a glance where a bare percentage does not. */
function bar(pct) {
  const filled = Math.round((pct / 100) * 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

export const data = new SlashCommandBuilder()
  .setName("today")
  .setDescription("How the lobby is doing today")
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const stats = await api(interaction, `/api/scout/stats/${encodeURIComponent(lobby.slug)}`);
  if (!stats) return;

  const buckets = stats.buckets ?? [];
  if (!buckets.length) return interaction.editReply("No games recorded for this lobby yet.");

  // Buckets are daily and chronological, so the session is the last one.
  const today = buckets[buckets.length - 1];
  const prev = buckets.length > 1 ? buckets[buckets.length - 2] : null;

  if (!today.games) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(IDLE)
          .setAuthor({ name: lobby.label || "Scout lobby" })
          .setTitle("No games yet today")
          .setURL(`${SITE}/scout/${lobby.slug}`)
          .setFooter({ text: "loldata.cc · scout" }),
      ],
    });
  }

  const delta = prev?.games ? today.winrate - prev.winrate : null;
  const trend =
    delta == null ? "" : delta > 0 ? ` (▲ ${delta} vs yesterday)` : delta < 0 ? ` (▼ ${Math.abs(delta)} vs yesterday)` : " (flat vs yesterday)";

  // A whole week of context under the headline, so today has a shape.
  const week = buckets.slice(-7).filter((b) => b.games > 0);
  const history = week
    .map((b) => `\`${String(b.bucketLabel).padEnd(7)}\` ${bar(b.winrate)} ${String(b.winrate).padStart(3)}%  ${b.wins}W ${b.losses}L`)
    .join("\n");

  const embed = new EmbedBuilder()
    .setColor(today.winrate >= 50 ? JADE : LOSS)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(`${today.games} games · ${today.wins}W ${today.losses}L · ${today.winrate}%${trend}`)
    .setURL(`${SITE}/scout/${lobby.slug}`)
    .addFields(
      { name: "Winrate", value: `${bar(today.winrate)} **${today.winrate}%**`, inline: true },
      { name: "Average KDA", value: `**${today.avgKda}**`, inline: true },
      { name: "Last 7 days", value: history || "—", inline: false }
    )
    .setFooter({ text: "loldata.cc · scout" })
    .setTimestamp(new Date());

  return interaction.editReply({ embeds: [embed] });
}
