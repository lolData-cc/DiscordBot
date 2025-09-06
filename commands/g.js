import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { supabase } from "../supabaseClient.js";

async function wipeEndedGiveaways() {
  const { data: endedGiveaways, error } = await supabase
    .from("giveaways")
    .select("id")
    .eq("status", "ended");

  if (error) {
    console.error("Error while wiping the giveaways:", error);
    return { success: false, error };
  }

  if (endedGiveaways?.length) {
    for (const giveaway of endedGiveaways) {
      await supabase.from("giveaways").delete().eq("id", giveaway.id);
    }
  }

  return { success: true, count: endedGiveaways?.length || 0 };
}

export async function finishGiveaway(
  client,
  giveaway,
  forced = false,
  reason = null
) {
  const { data: entries, error } = await supabase
    .from("giveaway_entries")
    .select("*")
    .eq("giveaway_id", giveaway.id);

  if (error) {
    console.error("Error while collecting the entries:", error);
    return;
  }

  let winners = [];
  let winnersMention = "Not enough participants.";

  if (entries && entries.length > 0) {
    let weightedEntries = [];
    for (const e of entries) {
      for (let i = 0; i < e.entries; i++) {
        weightedEntries.push(e);
      }
    }

    let uniqueUserIds = new Set();

    while (winners.length < giveaway.winners && weightedEntries.length > 0) {
      const index = Math.floor(Math.random() * weightedEntries.length);
      const candidate = weightedEntries[index];

      if (!uniqueUserIds.has(candidate.user_id)) {
        winners.push(candidate);
        uniqueUserIds.add(candidate.user_id);
      }

      weightedEntries.splice(index, 1);
    }

    winnersMention = winners.map((w) => `<@${w.user_id}>`).join(", ");
  }

  await supabase
    .from("giveaways")
    .update({
      status: "ended",
      ended_at: Math.floor(Date.now() / 1000),
      winners_mention: winnersMention,
    })
    .eq("id", giveaway.id);

  const channel = await client.channels.fetch(giveaway.channel_id);
  const message = await channel.messages.fetch(giveaway.message_id);

  if (winners.length > 0) {
    await channel.send({
      content: `${winnersMention}`,
      reply: { messageReference: message.id },
    });
  }

  const endedEmbed = new EmbedBuilder()
    .setColor("#01D38E")
    .setDescription(
      forced
        ? `## <:loldataadmin:1412075126102429846> Giveaway was terminated\nReason: ${
            reason || `\`No reason provided\``
          }\n\n**Remember** — You have \`‎ 24 hours‎ \` to contact the giveaway host privately, before getting **rerolled** and losing the prize.\n\n<:loldataprize:1411943860636221441> Prize: \`‎ ${
            giveaway.prize
          }‎ \`\n<:loldatawinner:1412077245584904202> Winners: ${winnersMention}\n\n<:loldatastar:1411951560438714470> Host: <@${
            giveaway.host_id
          }>\n<:loldataid:1412324429203111957> Giveaway ID: \`‎ ${
            giveaway.id
          }‎ \``
        : `## <:loldatathrophy:1412076051034669206> The giveaway has ended\n**Remember** — You have \`‎ 24 hours‎ \` to contact the giveaway host privately, before getting **rerolled** and losing the prize.\n\n<:loldataprize:1411943860636221441> Prize: \`‎ ${giveaway.prize}‎ \`\n<:loldatawinner:1412077245584904202> Winners: ${winnersMention}\n\n<:loldataid:1412324429203111957> Giveaway ID: \`‎ ${giveaway.id}‎ \``
    );

  console.log(`Finishing giveaway${forced ? " (forced)" : ""}:`, giveaway.id);
  await message.edit({
    embeds: [endedEmbed],
    components: [],
  });
}

export async function scheduleGiveaways(client) {
  const now = Math.floor(Date.now() / 1000);
  const { data: activeGiveaways } = await supabase
    .from("giveaways")
    .select("*")
    .gte("ends_at", now);

  for (const giveaway of activeGiveaways) {
    const delay = (giveaway.ends_at - now) * 1000;
    console.log("Scheduling giveaway", giveaway.id, "delay (ms):", delay);

    setTimeout(() => finishGiveaway(client, giveaway), delay);
  }
}

export const data = new SlashCommandBuilder()
  .setName("g")
  .setDescription("Giveaway command")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((sub) =>
    sub
      .setName("start")
      .setDescription("Starts a giveaway")
      .addStringOption((option) =>
        option
          .setName("prize")
          .setDescription("Prize of the giveaway")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("winners")
          .setDescription("Number of winners")
          .setRequired(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("duration")
          .setDescription("Duration of the giveaway in hours")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("thumbnail")
          .setDescription("Image link for the embed thumbnail")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("end")
      .setDescription("Ends a designated giveaway")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Messaged ID of the targeted giveaway")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason why you are ending the giveaway")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("reroll")
      .setDescription("Rerolls a winner for a designated giveaway")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Messaged ID of the targeted giveaway")
          .setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("cancel")
      .setDescription("Cancels a designated giveaway")
      .addStringOption((option) =>
        option
          .setName("id")
          .setDescription("Messaged ID of the targeted giveaway")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("reason")
          .setDescription("Reason why you are canceling the giveaway")
          .setRequired(false)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("cleanup")
      .setDescription("Cleans up all ended giveaways from database")
  );

export async function execute(interaction, client, supabase) {
  const subcommand = interaction.options.getSubcommand();
  if (subcommand == "start") {
    const prize = interaction.options.getString("prize");
    const winners = interaction.options.getInteger("winners");
    const duration = interaction.options.getInteger("duration");
    const thumbnail = interaction.options.getString("thumbnail");
    const host = interaction.user;
    const endsat = Math.floor(Date.now() / 1000) + duration * 3600;
    const giveawayNotif = "1412262741086961744";
    const giveawayEmbed = new EmbedBuilder().setColor("#01D38E").setDescription(
      `## <:party:1413258805806104586> A giveaway has started\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>
        lolData is hosting a giveaway, click the **button below** to join.\n\n**Double entries, double chance of winning** — you can get \`‎ 2‎ \` giveaway entries by being a <@&1401125659279101973>. This will double your chance of winning.\n### Higher tier, higher prizes
        lolData's Discord server has an exp system that allows you to unlock several benefits such as more giveaway entries. The higher is the tier, the more are the entries. Each tier will grant you more chances of winning a giveaway. If you wanna learn more about it, head over to [tiers](https://discord.com/channels/1400118983885324411/1411950273718521998).\n### Giveaway notifications\nIf you want to get a ping for each of the upcoming giveaways, head over to <id:customize> and select **Giveaways**.\n\n**Remember** — Winners have \`‎ 24 hours‎ \` to contact the giveaway host privately, before getting **rerolled** and losing the prize.\n### Giveaway info
        <:loldataprize:1411943860636221441> Prize: \`‎ ${prize}‎ \`\n<:loldatawinners:1411944315453833267> Number of winners: \`‎ ${winners}‎ \`\n<:loldatacalendar:1411943814662455346> Ends: <t:${endsat}:R>\n\n<:loldatastar:1411951560438714470> Host: ${host}\n<:loldataeye:1412329976220483614> Number of entries: \`‎ 0‎ \`
        `
    );

    if (thumbnail) giveawayEmbed.setThumbnail(thumbnail);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join")
        .setLabel("Join giveaway")
        .setEmoji("<:loldatauser:1412522159359787068>")
        .setStyle(ButtonStyle.Secondary)
    );

    const sentMessage = await interaction.reply({
      content: `<@&${giveawayNotif}>`,
      embeds: [giveawayEmbed],
      components: [row],
      allowedMentions: {
        roles: [giveawayNotif],
        users: [],
        parse: [],
      },
      fetchReply: true,
    });

    const { data, error } = await supabase
      .from("giveaways")
      .insert([
        {
          guild_id: interaction.guild.id,
          channel_id: interaction.channel.id,
          message_id: sentMessage.id,
          prize,
          winners,
          ends_at: endsat,
          host_id: host.id,
          thumbnail,
          status: "active",
        },
      ])
      .select("*");

    if (error) {
      console.error("Error while saving giveaway:", error);
    } else {
      console.log("Successfully saved the giveaway.", data);
    }
  } else if (subcommand === "end") {
    const messageId = interaction.options.getString("id");

    const { data: giveaways, error } = await supabase
      .from("giveaways")
      .select("*")
      .eq("message_id", messageId);

    if (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> Unexpected query error.`
            ),
        ],
        ephemeral: true,
      });
    }

    const giveaway = giveaways[0];

    if (giveaway.status === "ended") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> This giveaway has already ended.`
            ),
        ],
      });
    }

    if (!giveaways?.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldataquestion:1412073422195916840> No giveaways found with this ID.`
            ),
        ],
        ephemeral: true,
      });
    }

    const gCommand = client.commands.get("g");
    if (!gCommand?.finishGiveaway) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> Cannot end this giveaway.`
            ),
        ],
      });
    }

    try {
      const reason = interaction.options.getString("reason");
      await gCommand.finishGiveaway(client, giveaway, true, reason);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatasuccess:1411943739836071967> Succesfully ended the giveaway.`
            ),
        ],
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> Unexpected error while ending the giveaway.`
            ),
        ],
        ephemeral: true,
      });
    }
  }

  if (subcommand === "cleanup") {
    const result = await wipeEndedGiveaways();

    if (!result.success) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> There was an error while wiping ended giveaways."
            ),
        ],
        ephemeral: true,
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Successfully wiped \`‎ ${result.count}‎ \` ended giveaways from the database.`
          ),
      ],
      ephemeral: true,
    });
  }
  if (subcommand === "reroll") {
    const messageId = interaction.options.getString("id");

    const { data: giveaways, error } = await supabase
      .from("giveaways")
      .select("*")
      .eq("message_id", messageId)
      .eq("status", "ended");

    if (error || !giveaways?.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> Giveaway not found or not ended.`
            ),
        ],
        ephemeral: true,
      });
    }

    const giveaway = giveaways[0];

    const { data: entries, error: entriesError } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("giveaway_id", giveaway.id);

    if (entriesError || !entries?.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> No participants found.`
            ),
        ],
        ephemeral: true,
      });
    }

    let weightedEntries = [];
    for (const e of entries) {
      for (let i = 0; i < e.entries; i++) {
        weightedEntries.push(e);
      }
    }

    const existingWinners = giveaway.winners_mention
      ? giveaway.winners_mention
          .match(/<@(\d+)>/g)
          ?.map((w) => w.replace(/[<@>]/g, ""))
      : [];

    let newWinner = null;
    const triedUserIds = new Set(existingWinners);

    while (weightedEntries.length > 0) {
      const index = Math.floor(Math.random() * weightedEntries.length);
      const candidate = weightedEntries[index];

      if (!triedUserIds.has(candidate.user_id)) {
        newWinner = candidate;
        break;
      }

      weightedEntries.splice(index, 1);
    }

    if (!newWinner) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `<:loldatadenied:1411943771477905479> No eligible users to reroll.`
            ),
        ],
        ephemeral: true,
      });
    }

    const newMention = `<@${newWinner.user_id}>`;
    const updatedMentions =
      existingWinners.length > 0
        ? [...existingWinners, newMention].join(", ")
        : newMention;

    await supabase
      .from("giveaways")
      .update({ winners_mention: updatedMentions })
      .eq("id", giveaway.id);

    const channel = await client.channels.fetch(giveaway.channel_id);
    // const message = await channel.messages.fetch(giveaway.message_id);

    const rerollMention = `${newMention}`;
    const rerollEmbed = new EmbedBuilder()
      .setColor("#01D38E")
      .setDescription(
        `<:loldatareroll:1412317301641838632> ${newMention} is the **new winner**, congratulations.\n\n**Remember** — You have \`‎ 24 hours‎ \` to contact the giveaway host privately, before getting **rerolled** and losing the prize.\n\n<:loldataprize:1411943860636221441> Prize: \`‎ ${giveaway.prize}‎ \`\n\n<:loldatastar:1411951560438714470> Host: <@${giveaway.host_id}>\n<:loldataid:1412324429203111957> Giveaway ID: \`‎ ${giveaway.id}‎ \``
      );

    await interaction.reply({
      content: rerollMention,
      embeds: [rerollEmbed],
      ephemeral: false,
    });

    return interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Successfully rerolled the giveaway.`
          ),
      ],
      ephemeral: true,
    });
  } else if (subcommand === "cancel") {
    const messageId = interaction.options.getString("id");

    const { data: giveaways, error } = await supabase
      .from("giveaways")
      .select("*")
      .eq("message_id", messageId);

    if (error || !giveaways?.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Giveaway not found."
            ),
        ],
        ephemeral: true,
      });
    }

    const giveaway = giveaways[0];

    const { error: deleteError } = await supabase
      .from("giveaways")
      .delete()
      .eq("id", giveaway.id);

    if (deleteError) {
      console.error(deleteError);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Failed to cancel giveaway."
            ),
        ],
        ephemeral: true,
      });
    }

    try {
      const channel = await client.channels.fetch(giveaway.channel_id);
      const message = await channel.messages.fetch(giveaway.message_id);
      const reason =
        interaction.options.getString("reason") || `\`No reason provided\``;

      const canceledEmbed = new EmbedBuilder()
        .setColor("#01D38E")
        .setDescription(
          `## <:loldatasad:1412500209430171738> Giveaway was canceled\nReason: \`${reason}\`\n\n<:loldataprize:1411943860636221441> Prize: \`‎ ${giveaway.prize} ‎\`\n<:loldataid:1412324429203111957> Giveaway ID: \`‎ ${giveaway.id} ‎\``
        );

      await message.edit({
        embeds: [canceledEmbed],
        components: [],
      });
    } catch (err) {
      console.error("Failed to edit giveaway message:", err);
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Successfully canceled the giveaway.`
          ),
      ],
      ephemeral: true,
    });
  }
}
