// /lastgame — the lobby's most recent match, or a specific member's.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  api, resolveLobby, lobbyOption, championData, champIcon, queueLabel,
  JADE, LOSS, CITRINE, SITE, fmtNum, fmtClock, timeAgo, kdaRatio, normalize, profileUrl,
} from "../utils/loldata.js";

export const data = new SlashCommandBuilder()
  .setName("lastgame")
  .setDescription("The lobby's most recent game")
  .addStringOption((o) =>
    o.setName("player").setDescription("Only this member's last game").setRequired(false)
  )
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const wanted = interaction.options.getString("player");
  // Pull a page rather than one row: filtering by member happens here, since
  // the feed has no per-player parameter.
  const feed = await api(interaction, `/api/scout/feed/${encodeURIComponent(lobby.slug)}?limit=40`);
  if (!feed) return;

  let items = feed.items ?? [];
  if (wanted) {
    const w = normalize(wanted);
    items = items.filter((it) => {
      const owner = (it.lobbyPlayers ?? []).find((p) => p.id === it.ownerPlayerId);
      return (
        normalize(it.participant?.summonerName).includes(w) ||
        normalize(owner?.displayName).includes(w)
      );
    });
  }

  const it = items[0];
  if (!it) {
    return interaction.editReply(
      wanted ? `No recent game found for **${wanted}**.` : "No games in the feed yet."
    );
  }

  const p = it.participant ?? {};
  const champs = await championData();
  const owner = (it.lobbyPlayers ?? []).find((x) => x.id === it.ownerPlayerId);
  const who = owner?.displayName || p.summonerName || "Unknown";
  const remake = (it.gameDurationSeconds ?? 0) < 300;

  const lp =
    p.lpDelta == null
      ? null
      : p.rankChange === "PROMOTION"
        ? `PROMOTED (${p.lpDelta > 0 ? "+" : ""}${p.lpDelta})`
        : p.rankChange === "DEMOTION"
          ? `DEMOTED (${p.lpDelta})`
          : `${p.lpDelta > 0 ? "+" : ""}${p.lpDelta} LP`;

  const link = profileUrl(it.platform, p.summonerName, null);
  const embed = new EmbedBuilder()
    .setColor(remake ? CITRINE : p.win ? JADE : LOSS)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(`${remake ? "REMAKE" : p.win ? "VICTORY" : "DEFEAT"} · ${who} — ${p.championName}`)
    .setURL(`${SITE}/matches/${it.matchId}`)
    .addFields(
      {
        name: "K / D / A",
        value: `**${p.kills} / ${p.deaths} / ${p.assists}**\n${kdaRatio(p.kills, p.deaths, p.assists)} KDA`,
        inline: true,
      },
      {
        name: "CS · Damage",
        value: `${p.cs} CS\n${fmtNum(p.totalDamageToChampions)} to champions`,
        inline: true,
      },
      {
        name: lp ? "LP · Vision" : "Vision",
        value: `${lp ? `**${lp}**\n` : ""}${p.visionScore ?? 0} vision score`,
        inline: true,
      },
      {
        name: "Match",
        value:
          `${queueLabel(it.queueId)} · ${fmtClock(it.gameDurationSeconds ?? 0)} · ${timeAgo(
            new Date(it.gameCreation).getTime() + (it.gameDurationSeconds ?? 0) * 1000
          )}` + `\n**[▸ Open match page](${SITE}/matches/${it.matchId})**`,
        inline: false,
      }
    )
    .setFooter({ text: "loldata.cc · scout" })
    .setTimestamp(new Date(it.gameCreation));

  const file = champs.byName.get(normalize(p.championName))?.file;
  if (file) embed.setThumbnail(champIcon(file, champs.version));
  void link;

  return interaction.editReply({ embeds: [embed] });
}
