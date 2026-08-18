// /build — how a champion actually performs and levels up, from our own
// match data rather than a curated guide.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  API, SITE, JADE, championData, champIcon, normalize, fmtNum,
} from "../utils/loldata.js";

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
const SKILL = { 1: "Q", 2: "W", 3: "E", 4: "R" };

export const data = new SlashCommandBuilder()
  .setName("champion")
  .setDescription("Champion performance, laning and skill order")
  .addStringOption((o) =>
    o.setName("champion").setDescription("Champion name").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("role")
      .setDescription("Filter by role")
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
    const res = await fetch(`${API}/api/champion/build-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ champKey: champ.key, champion: champ.name, role: role ?? undefined }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    payload = await res.json();
  } catch (e) {
    console.error("[champion]", e?.message ?? e);
    return interaction.editReply("Couldn't read the build data. Try again in a moment.");
  }

  const st = payload.stats;
  if (!st?.games) {
    return interaction.editReply(
      `No data for **${champ.name}**${role ? ` ${role}` : ""} on the current patch yet.`
    );
  }

  // perLevel is the skill taken at each level; priority is the max order.
  const prio = (payload.skillOrder?.priority ?? []).map((s) => SKILL[s] ?? "?").join(" > ");
  const firstThree = (payload.skillOrder?.perLevel ?? [])
    .slice(0, 3)
    .map((s) => SKILL[s] ?? "?")
    .join(" → ");

  const lane = payload.laning;

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle(`${champ.name}${payload.role ? ` · ${payload.role}` : ""}`)
    .setURL(`${SITE}/champions/${champ.file}`)
    .setDescription(
      `**${st.winrate}%** winrate over **${fmtNum(st.games)}** games` +
        (payload.baseline?.winrate
          ? ` · baseline ${Number(payload.baseline.winrate).toFixed(1)}%`
          : "")
    )
    .addFields(
      {
        name: "Average game",
        value:
          `**${st.kills.toFixed(1)} / ${st.deaths.toFixed(1)} / ${st.assists.toFixed(1)}**\n` +
          `${st.killParticipation.toFixed(0)}% KP · ${st.damageShare.toFixed(0)}% dmg share`,
        inline: true,
      },
      {
        name: "Economy",
        value: `${fmtNum(Math.round(st.gold))} gold\n${fmtNum(Math.round(st.damageToChamps))} damage`,
        inline: true,
      },
      {
        name: "Skill order",
        value: prio ? `Max **${prio}**\nStart ${firstThree}` : "—",
        inline: true,
      }
    )
    .setThumbnail(champIcon(champ.file, champs.version))
    .setFooter({ text: "loldata.cc · from our own match data" })
    .setTimestamp(new Date());

  if (lane?.games) {
    embed.addFields({
      name: "Laning phase",
      value:
        `${lane.cs.toFixed(0)} CS · ${fmtNum(Math.round(lane.gold))} gold · ${fmtNum(Math.round(lane.xp))} XP\n` +
        `${lane.kills.toFixed(1)} / ${lane.deaths.toFixed(1)} / ${lane.assists.toFixed(1)} over ${fmtNum(lane.games)} games`,
      inline: false,
    });
  }

  return interaction.editReply({ embeds: [embed] });
}
