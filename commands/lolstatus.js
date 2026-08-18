// /lolstatus — health of the loldata services.
//
// Not "/status": that name is generic enough to collide with other bots in a
// shared server, and this one is global.
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { api, JADE, CITRINE, LOSS, SITE } from "../utils/loldata.js";

const DOT = { 2: "🟢", 1: "🟡", 0: "🔴" };

export const data = new SlashCommandBuilder()
  .setName("lolstatus")
  .setDescription("loldata service health");

export async function execute(interaction) {
  await interaction.deferReply();

  const s = await api(interaction, "/api/status");
  if (!s) return;

  const services = s.services ?? [];
  const worst = services.reduce((m, x) => Math.min(m, x.state), 2);

  const first = services.filter((x) => !x.thirdParty);
  const third = services.filter((x) => x.thirdParty);

  const render = (list) =>
    list
      .map(
        (x) =>
          `${DOT[x.state] ?? "⚪"} **${x.label}** · ${x.latencyMs}ms` +
          (x.detail ? `\n ${x.detail}` : "")
      )
      .join("\n") || "—";

  const embed = new EmbedBuilder()
    .setColor(worst >= 2 ? JADE : worst === 1 ? CITRINE : LOSS)
    .setTitle(
      worst >= 2 ? "All systems nominal" : worst === 1 ? "Degraded performance" : "Outage"
    )
    .setURL(`${SITE}/status`)
    .addFields(
      { name: "loldata", value: render(first), inline: false },
      // Riot's own platform is reported but does not decide our overall state —
      // their incidents are not our downtime.
      { name: "Riot (third party)", value: render(third), inline: false }
    )
    .setFooter({ text: `loldata.cc · checked ${new Date(s.checkedAt).toLocaleTimeString("en-GB")}` })
    .setTimestamp(new Date());

  return interaction.editReply({ embeds: [embed] });
}
