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
  .setDescription("Sends the help desk panel message")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const panelEmbed = new EmbedBuilder().setColor("#01D38E")
    .setDescription(`## <:loldatapartners:1412522686357311648> Partner Program\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>
      Apply to become a **lolData**'s official **Partner**.\nBecoming a partner will grant you several benefits such as:\n\n﹒Exclusive chat with the <@&1407662093544722522>\n﹒Permission to post in the [feedback](https://discord.com/channels/1400118983885324411/1407743733788835840) channel\n﹒Early access to unreleased features\n﹒<@&1401128835889762415> or <@&1401128807833927680> tag on the platform\n﹒Homepage carousel advertising our partnered <@&1401128807833927680>\n### How do I apply?\nTo apply, choose either Pro or Streamer category, based on what you're applying for, and create a **ticket**.\n\nYour application will be reviewed by the <:loldatasupport:1413069467776192593><@&1407639645918990339> team within 24 hours. Here's all the requirements you need in order to apply.\n### <:loldatapro:1412519573084836091> Requirements to apply as a  <@&1401128835889762415>\n﹒LP threshold at **700+** for at least **30** days\n﹒Riot account linked with<@244234418007441408>\n### <:loldatastreamers:1412878237117321288> Requirements to apply as a  <@&1401128807833927680>\n﹒Having **1000+** followers on your streaming platform\n﹒Last broadcast must be not more than **15** days ago\n﹒Riot account linked with<@244234418007441408>\n\n**Keep in mind** — Applications are still manually reviewed, **just** meeting the requirements does **not** grant you the roles. All applications are up to our\n<:loldatasupport:1413069467776192593><@&1407639645918990339> team's discretion.\n\nAny other ticket will be instantly deleted, if you need assistance, regarding **exclusively** our discord server, please use the [help](https://discord.com/channels/1400118983885324411/1410198632296349728) channel.\n\nIf you need assistance with our platform, please contact us through our [website](https://loldata.cc/).\n\nDo not open multiple application tickets nor apply again if your application gets rejected before **90** days have passed. Any transgression will grant you a server ban without the possibility to appeal.
`);

  const menu = new StringSelectMenuBuilder()
    .setCustomId("partners")
    .setPlaceholder("What are you applying for?")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply as a Pro")
        .setEmoji("<:loldatapro:1412519573084836091>")
        .setDescription("Select this category if you are applying as a Pro")
        .setValue("pro"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Apply as a Streamer")
        .setEmoji("<:loldatastreamers:1412878237117321288>")
        .setDescription(
          "Select this category if you are applying as a Streamer"
        )
        .setValue("streamer")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    embeds: [panelEmbed],
    components: [row],
  });
}
