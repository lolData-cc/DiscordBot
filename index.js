  import "dotenv/config";
  import fs from "fs";
  import path from "path";
  import {
    Client,
    GatewayIntentBits,
    Events,
    Collection,
    EmbedBuilder,
  } from "discord.js";
  import {
    giveawayInteractions,
    showModal,
    proSubmit,
    proApprove,
    proReject,
    proRejectSubmit,
    streamerSubmit,
    streamerApprove,
    streamerReject,
    streamerRejectSubmit,
  } from "./handlers/interactionHandler.js";
  import {
    cleanupEndedGiveaways,
    finishActiveGiveaways,
  } from "./utils/giveaways.js";
  import { supabase } from "./supabaseClient.js";
  import messageCreateEvent from "./events/messageCreate.js";

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on(messageCreateEvent.name, (...args) =>
    messageCreateEvent.execute(...args)
  );

  const commandsPath = path.resolve("./commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"));

  client.commands = new Collection();

  for (const file of commandFiles) {
    const { data, execute, finishGiveaway } = await import(`./commands/${file}`);
    client.commands.set(data.name, { data, execute, finishGiveaway });
  }

  client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    async function startTimers() {
      await cleanupEndedGiveaways();
      setInterval(cleanupEndedGiveaways, 12 * 60 * 60 * 1000);

      const gCommand = client.commands.get("g");
      if (!gCommand?.finishGiveaway) return;

      async function checkActive() {
        await finishActiveGiveaways(client, gCommand.finishGiveaway);
      }
      await checkActive();
      setInterval(checkActive, 60 * 1000);
    }

    await startTimers();
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      // giveaways
      if (interaction.channelId === "1407666137516212254") {
        await giveawayInteractions(interaction);
        return;
      }

      // partner applications
      if (interaction.customId === "approve") {
        await proApprove(interaction);
        return;
      }

      if (interaction.customId === "streamer_approve") {
        await streamerApprove(interaction);
        return;
      }

      if (interaction.customId === "reject") {
        await proReject(interaction);
        return;
      }

      if (interaction.customId === "streamer_reject") {
        await streamerReject(interaction);
        return;
      }
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client, supabase);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor("#01D38E")
                .setDescription("Unexpected error while executing this command."),
            ],
          });
        } else {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#01D38E")
                .setDescription("Unexpected error while executing this command."),
            ],
            ephemeral: true,
          });
        }
      }
    }

    // partner applications forms
    if (interaction.isStringSelectMenu()) {
      await showModal(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === "proform") {
        await proSubmit(interaction);
        return;
      }

      if (interaction.customId === "rejectModal") {
        await proRejectSubmit(interaction);
        return;
      }

      if (interaction.customId === "streamerform") {
        await streamerSubmit(interaction);
        return;
      }

      if (interaction.customId === "streamerRejectModal") {
        await streamerRejectSubmit(interaction);
        return;
      }
    }
  });

  client.login(process.env.DISCORD_TOKEN);
