// /standings — the lobby leaderboard.
//
// Named "standings" rather than "leaderboard" on purpose: the lolData server
// already has a guild-scoped /leaderboard for exp points, and this one is
// global. Two commands with the same name in overlapping scopes is a trap.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  api, resolveLobby, lobbyOption, JADE, SITE, rankText, profileUrl,
} from "../utils/loldata.js";

const MEDALS = ["🥇", "🥈", "🥉"];

export const data = new SlashCommandBuilder()
  .setName("standings")
  .setDescription("Lobby leaderboard")
  .addStringOption((o) =>
    o
      .setName("window")
      .setDescription("Time range (default: all time)")
      .addChoices(
        { name: "Today", value: "today" },
        { name: "This week", value: "week" },
        { name: "This month", value: "month" },
        { name: "All time", value: "all" }
      )
      .setRequired(false)
  )
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const win = interaction.options.getString("window") || "all";
  const q = win === "all" ? "" : `?window=${win}`;
  const board = await api(
    interaction,
    `/api/scout/leaderboard/${encodeURIComponent(lobby.slug)}${q}`
  );
  if (!board) return;

  const accounts = (board.accounts ?? []).filter((a) => a.games > 0);
  if (!accounts.length) {
    return interaction.editReply(`No games in this lobby for **${win}**.`);
  }

  const lines = accounts.slice(0, 15).map((a, i) => {
    const medal = MEDALS[i] ?? `\`${String(i + 1).padStart(2)}\``;
    const link = profileUrl(a.region, a.riotName, a.riotTag);
    const name = link ? `[${a.playerDisplayName}](${link})` : a.playerDisplayName;
    const r = a.currentRank;
    const rank = r?.tier ? rankText(r.tier, r.rankDivision, r.lp) : "Unranked";
    // `balance` is the ladder-score swing over the window — the honest
    // "did they climb" number, not a raw LP subtraction.
    const bal =
      a.balance == null ? "" : a.balance > 0 ? ` · **+${a.balance}**` : ` · **${a.balance}**`;
    const streak = a.streak >= 3 ? ` 🔥${a.streak}` : "";
    return (
      `${medal} ${name}${streak}\n` +
      `${rank}\n` +
      `${a.games}G · ${a.wins}W ${a.losses}L · **${a.winrate}%** · ${a.avgKda.toFixed(2)} KDA${bal}`
    );
  });

  const LABEL = { today: "Today", week: "This week", month: "This month", all: "All time" };

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(`Standings · ${LABEL[win]}`)
    .setURL(`${SITE}/scout/${lobby.slug}/leaderboard`)
    .setDescription(lines.join("\n\n").slice(0, 4000))
    .setFooter({
      text:
        accounts.length > 15
          ? `loldata.cc · scout · showing 15 of ${accounts.length} accounts`
          : "loldata.cc · scout",
    })
    .setTimestamp(new Date());

  return interaction.editReply({ embeds: [embed] });
}
