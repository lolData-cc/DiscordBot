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
  const embed = new EmbedBuilder().setColor("#01D38E").setDescription(
    `## <:loldatasupport:1413069467776192593> Help Desk\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>\nIf you need assistance, select the category that best describes your issue and fill in the short form. A member of the <:loldatasupport:1413069467776192593><@&${process.env.SUPPORT_ROLE_ID}> team will get back to you as soon as possible.\n\n\`\`\`ansi\n[2;40m[2;32m How do I earn exp points on lolData's discord server? [0m[2;40m[0m\`\`\`\nYou can earn exp points by winning giveaways, chatting with other community members and being active in the server.\n\n\`\`\`ansi\n[2;40m[2;32m How do I check how many points I have? [0m[2;40m[0m\`\`\`\nYou can check your progress by typing /profile [(optional)username] in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).\n\n\`\`\`ansi\n[2;40m[2;32m How do I check the Leaderboard? [0m[2;40m[0m\`\`\`\nYou can check the server leaderboard by typing /leaderboard in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).\n\n\`\`\`ansi\n[2;40m[2;32m How do I check all the available commands? [0m[2;40m[0m\`\`\`\nYou can check the bot's commands by typing /help in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934). The list will be updated as new features come out.\n\n\`\`\`ansi\n[2;40m[2;32m How do I become a partner? [0m[2;40m[0m\`\`\`\nYou can apply for the partner program by opening a ticket in [partners](https://discord.com/channels/1400118983885324411/1410198632296349728). Keep in mind — you will need to meet some requirements before applying.\n\n\`\`\`ansi\n[2;40m[2;32m Where can I read informations on this project? [0m[2;40m[0m\`\`\`\nYou can read in depth informations about our project in [about](https://discord.com/channels/1400118983885324411/1410198427232501850) or consult the [documentation](https://loldata.cc/dashboard/documentation) on our website.\n\nDo not open multiple tickets for the same issue. Tickets opened for no valid reason will be closed without a response.\n\nIf you encountered a bug, please report it in [feedback](https://discord.com/channels/1400118983885324411/1407743733788835840).`
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
        .setEmoji("<:loldatabug:1413989888490995822>")
        .setValue("website_support"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Billing")
        .setEmoji("<:premium:1413184780882809023>")
        .setValue("billing"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Other")
        .setEmoji("<:other:1413989887085903955>")
        .setValue("other")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
