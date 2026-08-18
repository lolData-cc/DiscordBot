// /patchnotes — what actually changed this patch.
//
// Riot has no patch-notes API, so these are diffs our own engine computes
// between DDragon versions: real stat/ability deltas, not scraped prose.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api, JADE, SITE, championData, champIcon, normalize } from "../utils/loldata.js";

const ARROW = { buff: "🟢", nerf: "🔴", adjust: "🟡" };

export const data = new SlashCommandBuilder()
  .setName("patchnotes")
  .setDescription("Changes in the current patch")
  .addStringOption((o) =>
    o.setName("champion").setDescription("Only this champion").setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const payload = await api(interaction, "/api/patch-notes");
  if (!payload) return;

  const wanted = interaction.options.getString("champion");
  let changes = payload.changes ?? [];

  const champs = await championData();
  let champ = null;
  if (wanted) {
    champ = champs.byName.get(normalize(wanted));
    if (!champ) return interaction.editReply(`I don't know a champion called **${wanted}**.`);
    changes = changes.filter(
      (c) => normalize(c.entity_key) === normalize(champ.file) ||
             normalize(c.entity_name) === normalize(champ.name)
    );
    if (!changes.length) {
      return interaction.editReply(
        `**${champ.name}** wasn't touched in patch ${payload.patch}.`
      );
    }
  }

  // Group by entity so a champion with five tweaks is one block, not five.
  const byEntity = new Map();
  for (const c of changes) {
    const k = c.entity_name || c.entity_key;
    if (!byEntity.has(k)) byEntity.set(k, []);
    byEntity.get(k).push(c);
  }

  const fields = [...byEntity.entries()].slice(0, 20).map(([entity, list]) => ({
    name: entity,
    value: list
      .slice(0, 6)
      .map(
        (c) =>
          `${ARROW[c.direction] ?? "⚪"} ${c.label || c.field}: ${c.old_value} → **${c.new_value}**`
      )
      .join("\n"),
    inline: true,
  }));

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle(`Patch ${payload.patch}${champ ? ` · ${champ.name}` : ""}`)
    .setURL(`${SITE}/patch-notes`)
    .setDescription(
      champ
        ? `${changes.length} change(s) to ${champ.name}.`
        : `${byEntity.size} entities changed · showing ${fields.length}.`
    )
    .addFields(fields)
    .setFooter({ text: "loldata.cc · computed from DDragon diffs" })
    .setTimestamp(new Date());

  if (champ) embed.setThumbnail(champIcon(champ.file, champs.version));

  return interaction.editReply({ embeds: [embed] });
}
