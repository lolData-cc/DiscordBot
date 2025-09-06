import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { supabase } from "../supabaseClient.js";
import { checkLevelUp } from "../utils/levelUp.js";

export const data = new SlashCommandBuilder()
  .setName("assign")
  .setDescription("Assigns exp points to a designated user")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option.setName("user").setDescription("Targeted user").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("amount")
      .setDescription("Amount of exp points")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has("ManageRoles")) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> You don't have permission to execute this command.`
          ),
      ],
      ephemeral: true,
    });
  }

  const user = interaction.options.getUser("user");
  const amount = interaction.options.getInteger("amount");

  if (amount <= 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> Invalid amount.`
          ),
      ],
      ephemeral: true,
    });
  }

  const guildId = interaction.guild.id;
  const userId = user.id;

  try {
    const { data: userData, error } = await supabase
      .from("user_exp")
      .select("exp_points")
      .eq("user_id", userId)
      .eq("guild_id", guildId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> There was an error while scraping data.`
            ),
        ],
        ephemeral: true,
      });
    }

    if (!userData) {
      await supabase.from("user_exp").insert([
        {
          user_id: userId,
          guild_id: guildId,
          messages: 0,
          exp_points: amount,
        },
      ]);
    } else {
      const newExpPoints = (userData.exp_points || 0) + amount;
      await supabase
        .from("user_exp")
        .update({ exp_points: newExpPoints })
        .eq("user_id", userId)
        .eq("guild_id", guildId);

      const member = await interaction.guild.members.fetch(userId);
      await checkLevelUp(member, newExpPoints, interaction.guild);
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Successfully assigned \`‎ ${amount}‎ \` exp points to <@${user.id}>.`
          ),
      ],
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> There was an error while assigning exp points.`
          ),
      ],
      ephemeral: true,
    });
  }
}
