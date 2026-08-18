// /counters — best and worst lane matchups for a champion, from our own games.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { API, SITE, JADE, championData, champIcon, normalize, fmtNum } from "../utils/loldata.js";

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const MIN_GAMES = 30; // below this a winrate is noise, not a matchup

export const data = new SlashCommandBuilder()
  .setName("counters")
  .setDescription("Best and worst matchups for a champion")
  .addStringOption((o) =>
    o.setName("champion").setDescription("Champion name").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("role")
      .setDescription("Lane (improves accuracy)")
      .addChoices(...ROLES.map((r) => ({ name: r, value: r })))
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const champs = await championData();
  const query = interaction.options.getString("champion");
  const champ = champs.byName.get(normalize(query));
  if (!champ) return interaction.editReply(`I don't know a champion called **${query}**.`);

  const role = interaction.options.getString("role");

  let payload;
  try {
    const res = await fetch(`${API}/api/champion/matchups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ champKey: champ.key, role: role ?? undefined }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    payload = await res.json();
  } catch (e) {
    console.error("[counters]", e?.message ?? e);
    return interaction.editReply("Couldn't read matchup data. Try again in a moment.");
  }

  const rows = (payload.matchups ?? []).filter((m) => (m.games ?? 0) >= MIN_GAMES);
  if (!rows.length) {
    return interaction.editReply(
      `Not enough matchup data for **${champ.name}**${role ? ` ${role}` : ""} yet ` +
        `(need ${MIN_GAMES}+ games per opponent).`
    );
  }

  const name = (key) => champs.byId.get(Number(key))?.name ?? `#${key}`;
  const sorted = [...rows].sort((a, b) => b.winrate - a.winrate);
  const line = (m) => `**${name(m.opponent_key)}** — ${m.winrate}% · ${fmtNum(m.games)} games`;

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle(`${champ.name}${role ? ` · ${role}` : ""} matchups`)
    .setURL(`${SITE}/champions/${champ.file}/matchups`)
    .addFields(
      { name: "🟢 Favourable", value: sorted.slice(0, 6).map(line).join("\n"), inline: true },
      { name: "🔴 Struggles into", value: sorted.slice(-6).reverse().map(line).join("\n"), inline: true }
    )
    .setThumbnail(champIcon(champ.file, champs.version))
    .setFooter({ text: `loldata.cc · ${MIN_GAMES}+ games per matchup` })
    .setTimestamp(new Date());

  return interaction.editReply({ embeds: [embed] });
}
