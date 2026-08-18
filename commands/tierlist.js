// /tierlist — the nightly-regenerated tier list, optionally per role.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api, JADE, SITE, championData, champIcon, normalize } from "../utils/loldata.js";

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const TIER_MARK = { S: "🟢", A: "🔵", B: "🟡", C: "🟠", D: "🔴" };

export const data = new SlashCommandBuilder()
  .setName("tierlist")
  .setDescription("Current tier list")
  .addStringOption((o) =>
    o
      .setName("role")
      .setDescription("Filter by role")
      .addChoices(...ROLES.map((r) => ({ name: r, value: r })))
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const payload = await api(interaction, "/api/tierlist");
  if (!payload) return;

  const role = interaction.options.getString("role");
  let rows = payload.champions ?? [];
  if (role) {
    // The snapshot stores ADC as BOTTOM and SUPPORT as UTILITY.
    const want = role === "ADC" ? ["ADC", "BOTTOM"] : role === "SUPPORT" ? ["SUPPORT", "UTILITY"] : [role];
    rows = rows.filter((r) => want.includes(String(r.role).toUpperCase()));
  }
  if (!rows.length) return interaction.editReply(`No tier-list data${role ? ` for ${role}` : ""}.`);

  rows = [...rows].sort((a, b) => (a.tier_rank ?? 999) - (b.tier_rank ?? 999)).slice(0, 15);

  const lines = rows.map((r, i) => {
    const mark = TIER_MARK[r.tier] ?? "⚪";
    return (
      `\`${String(i + 1).padStart(2)}\` ${mark} **${r.champion_name}**` +
      (role ? "" : ` · ${r.role}`) +
      ` — ${r.winrate}% WR · ${r.pickrate}% PR`
    );
  });

  const champs = await championData();
  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle(role ? `Tier list · ${role}` : "Tier list · all roles")
    .setURL(`${SITE}/tierlist${role ? `/${role.toLowerCase()}` : ""}`)
    .setDescription(lines.join("\n"))
    .setFooter({
      text: `loldata.cc · patch ${payload.patch ?? "?"} · snapshot ${payload.snapshot_date ?? "?"}`,
    })
    .setTimestamp(new Date());

  const top = champs.byName.get(normalize(rows[0].champion_name))?.file;
  if (top) embed.setThumbnail(champIcon(top, champs.version));

  return interaction.editReply({ embeds: [embed] });
}
