import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("panel")
  .setDescription("Sends the partners panel message")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const panelEmbed = new EmbedBuilder().setColor("#01D38E")
    .setDescription(`## <:loldatasupport:1413069467776192593> Partner Program\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>\nApply to become an official **lolData** Partner and gain access to exclusive benefits within our community and platform.\n\n\`Platform recognition\`\n\nReceive the <@&1401128835889762415> or <@&1401128807833927680> tag on the platform, with homepage carousel advertising for partnered streamers.\n\nAccess to an exclusive partner chat with <@&1407662093544722522>, permission to post in the [feedback](https://discord.com/channels/1400118983885324411/1407743733788835840) channel, and early access to unreleased features.\n\n### <:loldatapro:1412519573084836091> Requirements — <@&1401128835889762415>\n﹒LP threshold at **700+** for at least **30** days\n﹒Riot account linked with <@244234418007441408>\n\n### <:loldatastreamers:1412878237117321288> Requirements — <@&1401128807833927680>\n﹒**1,000+** followers on your streaming platform\n﹒Last broadcast within the last **15** days\n﹒Riot account linked with <@244234418007441408>\n\n\`Important\`\n\nApplications are manually reviewed — meeting the requirements alone does **not** guarantee approval. All decisions are at the discretion of the <:loldatasupport:1413069467776192593><@&1407639645918990339> team.\n\nDo not reapply within **90 days** of a rejection or open multiple tickets, violations result in a permanent ban.\n`);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("partners")
    .setPlaceholder("What are you applying for?")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply as a Pro")
        .setEmoji("<:loldatapro:1412519573084836091>")
        .setValue("pro"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply as a Streamer")
        .setEmoji("<:loldatastreamers:1412878237117321288>")
        .setValue("streamer")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    embeds: [panelEmbed],
    components: [row],
  });
}
