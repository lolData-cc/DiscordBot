// /loldata — the command index.
//
// Separate from /help on purpose: that one is bound to the lolData server
// (its custom emoji and channel links only resolve there), while these
// commands are global and have to read correctly in anyone's server.
//
// The list is built from the commands the bot ACTUALLY has loaded, not from a
// hardcoded copy — a hardcoded list drifts the moment someone adds a command
// and forgets to update it. Anything loldata-ish that isn't slotted into a
// section below still shows up under "Other", so nothing can go missing
// silently.

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { lobbyForChannel, JADE, SITE } from "../utils/loldata.js";

const SECTIONS = [
  {
    title: "🎯 Scout lobby",
    blurb:
      "These read the lobby connected to the channel you're in. " +
      "Add `lobby:<slug>` to target a different one.",
    names: ["live", "lastgame", "today", "standings", "champs", "bounty", "refresh"],
  },
  {
    title: "📊 League data",
    blurb: "These work anywhere — no lobby needed.",
    names: ["rank", "champion", "counters", "tierlist", "patchnotes", "lolstatus"],
  },
];

// Everything this command documents; used to spot strays.
const OWNED = new Set(SECTIONS.flatMap((s) => s.names).concat("loldata"));

export const data = new SlashCommandBuilder()
  .setName("loldata")
  .setDescription("Every loldata command, and what it does");

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const loaded = interaction.client.commands ?? new Map();
  const describe = (name) => loaded.get(name)?.data?.description ?? null;

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle("loldata commands")
    .setURL(SITE)
    .setFooter({ text: "loldata.cc" })
    .setTimestamp(new Date());

  // Tell people up front whether the lobby commands will work bare here —
  // "it says no lobby" is the single most likely confusion.
  const hook = await lobbyForChannel(interaction.channelId);
  embed.setDescription(
    hook
      ? `This channel is connected to **${hook.label || hook.lobby_slug}** — the scout commands work with no arguments.`
      : "This channel isn't connected to a scout lobby, so the scout commands need `lobby:<slug>`. " +
        "Connect a feed in the lobby's **Edit → Discord** panel to drop that."
  );

  for (const section of SECTIONS) {
    const lines = section.names
      .filter((n) => loaded.has(n))
      .map((n) => `\`/${n}\` — ${describe(n) ?? "—"}`);
    if (!lines.length) continue;
    embed.addFields({
      name: section.title,
      value: `*${section.blurb}*\n${lines.join("\n")}`,
      inline: false,
    });
  }

  // Any loldata command added later but not slotted above.
  const strays = [...loaded.keys()].filter(
    (n) => !OWNED.has(n) && loaded.get(n)?.data?.description?.toLowerCase().includes("lobby")
  );
  if (strays.length) {
    embed.addFields({
      name: "Other",
      value: strays.map((n) => `\`/${n}\` — ${describe(n) ?? "—"}`).join("\n"),
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}
