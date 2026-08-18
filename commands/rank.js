// /rank — rank card for any account, in or out of a lobby.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { API, JADE, rankIcon, profileUrl } from "../utils/loldata.js";

const REGIONS = ["EUW", "EUNE", "NA", "KR", "BR", "LAN", "LAS", "OCE", "TR", "RU", "JP"];

/** "MASTER I" from the API → the pieces rankIcon/emoji need. */
function splitRank(s) {
  if (!s || s.toLowerCase() === "unranked") return { tier: null, division: null };
  const [tier, division] = String(s).split(" ");
  return { tier: tier.toUpperCase(), division: division ?? null };
}

const winrate = (w, l) => (w + l > 0 ? Math.round((w / (w + l)) * 100) : 0);

export const data = new SlashCommandBuilder()
  .setName("rank")
  .setDescription("Rank card for any summoner")
  .addStringOption((o) =>
    o.setName("riotid").setDescription("Name#TAG").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("region")
      .setDescription("Default EUW")
      .addChoices(...REGIONS.map((r) => ({ name: r, value: r })))
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const raw = interaction.options.getString("riotid").trim();
  const region = interaction.options.getString("region") || "EUW";
  const m = raw.match(/^(.+)#(.+)$/);
  if (!m) return interaction.editReply("Use the `Name#TAG` form, e.g. `Faker#KR1`.");

  const [, name, tag] = m;

  let payload;
  try {
    const res = await fetch(`${API}/api/summoner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), tag: tag.trim(), region }),
    });
    if (res.status === 404) return interaction.editReply(`No account **${raw}** on ${region}.`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    payload = await res.json();
  } catch (e) {
    console.error("[rank]", e?.message ?? e);
    return interaction.editReply("Riot didn't answer. Try again in a moment.");
  }

  const s = payload?.summoner;
  if (!s?.puuid) return interaction.editReply(`No account **${raw}** on ${region}.`);

  const solo = splitRank(s.rank);
  const flex = splitRank(s.flexRank);
  const url = profileUrl(region, s.name, s.tag);

  const embed = new EmbedBuilder()
    .setColor(JADE)
    .setTitle(`${s.name}#${s.tag}`)
    .setURL(url)
    .setDescription(`Level ${s.level ?? "—"} · ${region}${s.live ? " · 🟢 in game" : ""}`)
    .addFields(
      {
        name: "Solo/Duo",
        value: solo.tier
          ? `**${s.rank}** · ${s.lp} LP\n${s.wins}W ${s.losses}L · ${winrate(s.wins, s.losses)}%`
          : "Unranked",
        inline: true,
      },
      {
        name: "Flex",
        value: flex.tier ? `**${s.flexRank}** · ${s.flexLp} LP` : "Unranked",
        inline: true,
      },
      {
        name: "Peak",
        value:
          [
            s.peakRank ? `Solo **${s.peakRank}**${s.peakLp != null ? ` · ${s.peakLp} LP` : ""}` : null,
            s.peakFlexRank ? `Flex **${s.peakFlexRank}**` : null,
          ]
            .filter(Boolean)
            .join("\n") || "—",
        inline: true,
      }
    )
    .setFooter({ text: "loldata.cc" })
    .setTimestamp(new Date());

  // Rank crests live at the CDN root and are the only art we can address
  // without a version lookup — an unranked account simply gets no thumbnail.
  const crest = rankIcon(solo.tier);
  if (crest) embed.setThumbnail(crest);

  return interaction.editReply({ embeds: [embed] });
}
