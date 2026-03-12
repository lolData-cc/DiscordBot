import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Sends the ticket panel message")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const lines = "<:line:1413101899770626059>".repeat(27);
  const embed = new EmbedBuilder().setColor("#01D38E").setDescription(
    `## <:loldatasupport:1413069467776192593> Help Desk\n${lines}\nIf you need assistance, select the category that best describes your issue and fill in the short form.\n\nA member of the <:loldatasupport:1413069467776192593><@&${process.env.SUPPORT_ROLE_ID}> team or a <:loldatamod:1413069465658327112><@&${process.env.MOD_ROLE_ID}> will get back to you as soon as possible.\n## FAQs\n` +
    "```\nHow do I earn exp points on lolData's discord server?\n```\n" +
    "You can earn exp points by winning giveaways, chatting with other community members and being active in the server.\n\n" +
    "```\nHow do I check how many points I have?\n```\n" +
    "You can check your progress by typing /profile [(optional)username] in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).\n\n" +
    "```\nHow do I check the Leaderboard?\n```\n" +
    "You can check the server leaderboard by typing /leaderboard in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).\n\n" +
    "```\nHow do I check all the available commands?\n```\n" +
    "You can check the bot's commands by typing /help in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934). The list will be updated as new features come out.\n\n" +
    "```\nHow do I become a partner?\n```\n" +
    "You can apply for the partner program by opening a ticket in [partners](https://discord.com/channels/1400118983885324411/1410198632296349728). Keep in mind — you will need to meet some requirements before applying.\n\n" +
    "```\nWhere can I read informations on this project?\n```\n" +
    "You can read in depth informations about our project in [about](https://discord.com/channels/1400118983885324411/1410198427232501850) or consult the [documentation](https://loldata.cc/dashboard/documentation) on our website.\n\n### Keep in mind\nDo not open multiple tickets for the same issue. Tickets opened for no valid reason will be closed without a response.\n\nIf you encountered a bug, please report it in [feedback](https://discord.com/channels/1400118983885324411/1407743733788835840)."
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("help_ticket")
    .setPlaceholder("Select a category")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Discord Support")
        .setEmoji("<:loldatasupport:1413069467776192593>")
        .setValue("discord_support"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Website Support")
        .setEmoji("<:loldatamod:1413069465658327112>")
        .setValue("website_support"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Billing")
        .setEmoji("<:loldatastar:1411951560438714470>")
        .setValue("billing"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Other")
        .setEmoji("<:support:1410203531553669222>")
        .setValue("other")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
