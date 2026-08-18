// /champs — champion pool for the lobby, or for one member.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  api, resolveLobby, lobbyOption, championData, champIcon, normalize, JADE, SITE,
} from "../utils/loldata.js";

export const data = new SlashCommandBuilder()
  .setName("champs")
  .setDescription("Champion pool and winrates")
  .addStringOption((o) =>
    o.setName("player").setDescription("Only this member").setRequired(false)
  )
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const payload = await api(interaction, `/api/scout/champions/${encodeURIComponent(lobby.slug)}`);
  if (!payload) return;

  let players = (payload.players ?? []).filter((p) => (p.champions ?? []).length);
  const wanted = interaction.options.getString("player");
  if (wanted) {
    const w = normalize(wanted);
    players = players.filter((p) => normalize(p.displayName).includes(w));
    if (!players.length) return interaction.editReply(`No champion data for **${wanted}**.`);
  }
  if (!players.length) return interaction.editReply("No champion data for this lobby yet.");

  const champs = await championData();

  const fields = players.slice(0, 12).map((p) => ({
    name: p.displayName,
    value:
      p.champions
        .slice(0, 5)
        .map(
          (c) =>
            `**${c.champion}** · ${c.games}G · ${c.winrate}% · ${c.avgKda} KDA`
        )
        .join("\n") || "—",
    inline: true,
  }));

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(wanted ? `Champion pool · ${players[0].displayName}` : "Champion pools")
    .setURL(`${SITE}/scout/${lobby.slug}/champions`)
    .addFields(fields)
    .setFooter({ text: "loldata.cc · scout · top 5 per player" })
    .setTimestamp(new Date());

  // One player asked for → show their most-played champion as the thumbnail.
  if (wanted && players[0].champions[0]) {
    const file = champs.byName.get(normalize(players[0].champions[0].champion))?.file;
    if (file) embed.setThumbnail(champIcon(file, champs.version));
  }

  return interaction.editReply({ embeds: [embed] });
}
