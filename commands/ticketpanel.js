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
    `## <:loldatasupport:1413069467776192593> Help Desk\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>\nIf you need assistance, select the category that best describes your issue and fill in the short form. A member of the <:loldatasupport:1413069467776192593><@&${process.env.SUPPORT_ROLE_ID}> team will get back to you as soon as possible.\n\nDo not open multiple tickets for the same issue. Tickets opened for no valid reason will be closed without a response.`
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
