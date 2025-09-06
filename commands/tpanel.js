import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("tpanel")
  .setDescription("Sends the help desk panel message")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const ticketsEmbed = new EmbedBuilder().setColor("#01D38E").setDescription(
    `## <:support:1413072505945718844> Help Desk\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>
    This is lolData help desk. If you need help, you can create a ticket by selecting one of the following categories.\n
    <:verification:1413989890282094692> \`Verification issues\`
    Select this category if you are having issues linking your Riot Games account with <@244234418007441408>.\n
     <:loldatabug:1413989888490995822> \`Issues with lolData's bot\`
     Select this category if you are having issues with our bot or if you encountered a bug. We appreciate your help.\n
     <:other:1413989887085903955> \`Other reasons\`
     Select this category if your issue isn't covered by the categories above.
     ## <:questionmark:1413990265408196640> Server FAQs
     Before opening a ticket, make sure to read the FAQs listed below. This will prevent ticket flooding and save time both for you and for the <:loldatasupport:1413069467776192593><@&1407639645918990339> team.\n
     Opening a ticket about something that has been already discussed in the FAQs will result in a server time out.\n
     \`\`\`1. How do I verify?\`\`\`
     Before opening a ticket in the \`verification issues\` category, you can find all the steps needed in order to link your Riot Games account and complete the verification in [guidelines](https://discord.com/channels/1400118983885324411/1407744054174679244).
     \`\`\`2. Can I get roles without linking my account?\`\`\`
     No, in order to avoid spam, ban evading, the use of exploits or anything that could potentially damage the server as well as verifying the ownership of the accounts, linking your Riot Games account is required. No exceptions.
     \`\`\`3. Is it safe to link my account to Orianna Bot?\`\`\`
     Yes, it is totally safe. <@244234418007441408> is a verfied Discord Application and is already used in many big servers. Your account safety won't be at risk.
     \`\`\`4. How do I get exp points?\`\`\`
     Exp points and tier system has already been widely discussed in [tiers](https://discord.com/channels/1400118983885324411/1411950273718521998), there you'll find pretty much everything you need to know. Make sure to read it before opening a ticket.
     \`\`\`5. What does lolData's Bot do?\`\`\`
     lolData Bot is in charge of the exp system as well as the website-discord communication. If you wanna learn about its features and their respective commands, type **/help** in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).
     \`\`\`6. Can I get unbanned?\`\`\`
     Maybe. Depending on the severity of the ban, you can appeal after a week, by contacting a <:loldatamod:1413069465658327112><@&1401130681060425758> privately, or if you believe your ban may have been a mistake.
     \`\`\`7. Can I get hired as a team member?\`\`\`
     Do not open a ticket if you're trying to apply as a team member. We will post in [updates](https://discord.com/channels/1400118983885324411/1408350120768176180) as soon as team applications are publicly open.
     ### I still need help\nIf the solution you are looking for isn't listed above, you can open a ticket.
     **Remember** — Opening a ticket for no good reason will grant you a server time out. Inactive tickets get automatically deleted after 24 hours. Opening multiple tickets regarding the same issue will result in a ban.
`
  );

  const ticketsMenu = new StringSelectMenuBuilder()
    .setCustomId("help_desk")
    .setPlaceholder("Select one of the following categories")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Verification issues")
        .setEmoji("<:verification:1413989890282094692>")
        .setValue("verificationissues"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Issues with lolData's bot")
        .setEmoji("<:loldatabug:1413989888490995822>")
        .setValue("botbug"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Other reasons")
        .setEmoji("<:other:1413989887085903955>")
        .setValue("others")
    );

  const row = new ActionRowBuilder().addComponents(ticketsMenu);

  await interaction.reply({
    embeds: [ticketsEmbed],
    components: [row],
  });
}
