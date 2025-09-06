import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
// import { supabase } from "../supabaseClient.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Shows all bot features and commands");

export async function execute(interaction) {
  const owner = await interaction.client.users.fetch("853937951658475530");
  const helpEmbed = new EmbedBuilder().setColor("#01D38E").setDescription(
    `## <:commands:1413094104937529414> Features and Commands\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>
      lolData Bot is in charge of the exp system as well as the website-discord communication. Here's a list of the bot's features and respective commands.\n
      \`\`\`/help\`\`\`\nShows a list of bot's features and the respective commands.\n
      \`\`\`/profile [(optional) username]\`\`\`\nShows your profile or the profile of a designated user. User profiles contain informations such as current tier, exp points, exp points left to next tier, leaderboard position and more.\n\nIf you wanna learn more about exp, head over to [tiers](https://discord.com/channels/1400118983885324411/1411950273718521998).\n
      \`\`\`/leaderboard\`\`\`\nShows the top \`‎ #25‎ \` users with most exp points.\n### Suggestions\nlolData's <@&1413351096675733659>s appreciate any kind of contribution. If you have any suggestion on quality of life updates or potential new features, you can post them in the [feedback](https://discord.com/channels/1400118983885324411/1407743733788835840) channel, your opinion matters.\n\n<:loldataheart:1413730880681279559>Thank you for supporting our project.\n`
  );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("About us")
      .setEmoji("<:loldatainfo:1413733660267647108>")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/channels/1400118983885324411/1410198427232501850"
      ),
    new ButtonBuilder()
      .setLabel("Do you need help?")
      .setEmoji("<:support:1410203531553669222>")
      .setStyle(ButtonStyle.Link)
      .setURL(
        "https://discord.com/channels/1400118983885324411/1410198632296349728"
      )
  );

  await interaction.reply({
    embeds: [helpEmbed],
    components: [row],
    ephemeral: true,
  });
}
