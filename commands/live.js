// commands/live.js — "/live": who from this channel's scout lobby is in a game
// right now.
//
// A Discord *webhook* is one-way: it can post into a channel but can never read
// what is typed there. So the feed's webhook cannot answer /live — this bot
// does, and it finds the right lobby by the channel the command was typed in.
// That binding is `scout_lobby_webhooks.channel_id`, resolved when the webhook
// was connected.

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  api, resolveLobby, lobbyOption, championData, champIcon,
  queueLabel, fmtClock, profileUrl, JADE, IDLE, SITE,
} from "../utils/loldata.js";

/** Spectator gives a snapshot; the wall clock is truer once the game started. */
function elapsedSeconds(session) {
  if (session.gameStartTime > 0) {
    return Math.max(0, Math.floor((Date.now() - session.gameStartTime) / 1000));
  }
  return Math.max(0, session.gameLength ?? 0);
}

export const data = new SlashCommandBuilder()
  .setName("live")
  .setDescription("Who from this lobby is in a game right now")
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  // Riot spectator lookups run per tracked account — comfortably past
  // Discord's 3s window, so acknowledge first.
  await interaction.deferReply();

  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const payload = await api(interaction, `/api/scout/live/${encodeURIComponent(lobby.slug)}`);
  if (!payload) return;

  const sessions = payload.sessions ?? [];
  const lobbyUrl = `${SITE}/scout/${lobby.slug}/live`;

  if (sessions.length === 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(IDLE)
          .setAuthor({ name: lobby.label || "Scout lobby" })
          .setTitle("Nobody is in a game")
          .setURL(lobbyUrl)
          .setDescription("All tracked accounts are idle right now.")
          .setFooter({ text: "loldata.cc · scout" })
          .setTimestamp(new Date()),
      ],
    });
  }

  const champs = await championData();
  const champName = (id) => champs.byId.get(Number(id))?.name || `Champion ${id}`;

  // Several lobby members can share one game — group by gameId so a duo reads
  // as one entry instead of two unrelated ones.
  const games = new Map();
  for (const s of sessions) {
    if (!games.has(s.gameId)) games.set(s.gameId, []);
    games.get(s.gameId).push(s);
  }

  const fields = [];
  for (const [, members] of games) {
    const head = members[0];
    const inChampSelect = head.gameStartTime <= 0 && (head.gameLength ?? 0) <= 0;
    const queue = queueLabel(head.gameQueueConfigId, head.gameMode);

    const who = members
      .map((m) => {
        const url = profileUrl(m.region, m.riotName, m.riotTag);
        const name = url ? `[${m.displayName}](${url})` : m.displayName;
        return `${name} — **${champName(m.championId)}**`;
      })
      .join("\n");

    fields.push({
      name: inChampSelect
        ? `🟡 ${queue} · champion select`
        : `🟢 ${queue} · ${fmtClock(elapsedSeconds(head))}`,
      value: who,
      inline: false,
    });
  }

  const playerCount = sessions.length;
  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setAuthor({ name: lobby.label || "Scout lobby" })
    .setTitle(
      `${playerCount} ${playerCount === 1 ? "player" : "players"} in game · ` +
        `${games.size} ${games.size === 1 ? "game" : "games"}`
    )
    .setURL(lobbyUrl)
    .addFields(fields.slice(0, 24))
    .setFooter({ text: "loldata.cc · scout · live" })
    .setTimestamp(new Date());

  // A lone player gets their champion as the thumbnail, same as the feed.
  if (playerCount === 1) {
    const file = champs.byId.get(Number(sessions[0].championId))?.file;
    if (file) embed.setThumbnail(champIcon(file, champs.version));
  }

  return interaction.editReply({ embeds: [embed] });
}
