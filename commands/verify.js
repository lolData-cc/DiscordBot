import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Sends the Discord verification panel")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#01D38E")
    .setDescription(
      "## <:lddiscord:1494238438478844067> Discord Verification\nIn order to unlock the server and use @lolData-bot's features, click the **Verify** button below."
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("Verify")
      .setEmoji("<:lddiscord:1494238438478844067>")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel("Do you need help?")
      .setEmoji("<:ldsupport:1494592731127877692>")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/channels/1400118983885324411/1410198632296349728")
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}
