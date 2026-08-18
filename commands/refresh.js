// /refresh — force the lobby to re-pull matches now.
//
// Gated to members who can manage the server: every refresh spends Riot API
// calls, so it must not be something anyone in the channel can spam.
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { API, resolveLobby, lobbyOption, JADE, SITE } from "../utils/loldata.js";

// Per-lobby cooldown on top of the permission check — a refresh already
// running makes a second one pure waste.
const COOLDOWN_MS = 60_000;
const lastRun = new Map();

export const data = new SlashCommandBuilder()
  .setName("refresh")
  .setDescription("Force this lobby to pull new matches now")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption(lobbyOption);

export async function execute(interaction) {
  await interaction.deferReply();
  const lobby = await resolveLobby(interaction);
  if (!lobby) return;

  const since = Date.now() - (lastRun.get(lobby.slug) ?? 0);
  if (since < COOLDOWN_MS) {
    return interaction.editReply(
      `Already refreshed ${Math.round(since / 1000)}s ago — wait ${Math.ceil(
        (COOLDOWN_MS - since) / 1000
      )}s.`
    );
  }
  lastRun.set(lobby.slug, Date.now());

  try {
    const res = await fetch(`${API}/api/scout/refresh/${encodeURIComponent(lobby.slug)}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.error("[refresh]", e?.message ?? e);
    lastRun.delete(lobby.slug);
    return interaction.editReply("The refresh didn't go through. Try again in a moment.");
  }

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(JADE)
        .setAuthor({ name: lobby.label || "Scout lobby" })
        .setTitle("Refresh started")
        .setURL(`${SITE}/scout/${lobby.slug}`)
        .setDescription(
          "Pulling new matches for every tracked account. New games land in the feed shortly."
        )
        .setFooter({ text: "loldata.cc · scout" })
        .setTimestamp(new Date()),
    ],
  });
}
