import {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { supabase } from "../supabaseClient.js";

// giveaways
export async function giveawayInteractions(interaction) {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "join") return;

  const { data: giveaway } = await supabase
    .from("giveaways")
    .select("id")
    .eq("message_id", interaction.message.id)
    .single();

  if (!giveaway) {
    return interaction.reply({
      content: "Giveaway non trovato.",
      ephemeral: true,
    });
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  const roleEntries = {
    [process.env.MEMBER_ROLE_ID]: 1,
    [process.env.BOOSTER_ROLE_ID]: 3,
    [process.env.LEVEL_10_ROLE_ID]: 2,
    [process.env.LEVEL_25_ROLE_ID]: 3,
    [process.env.LEVEL_50_ROLE_ID]: 4,
    [process.env.LEVEL_100_ROLE_ID]: 5,
    [process.env.LEVEL_MAX_ROLE_ID]: 8,
    [process.env.PREMIUM_ROLE_ID]: 10,
    [process.env.ELITE_ROLE_ID]: 25,
  };

  const userRoles = interaction.member.roles.cache.map((r) => r.id);

  let entries = 1;
  for (const roleId of userRoles) {
    if (roleEntries[roleId] && roleEntries[roleId] > entries) {
      entries = roleEntries[roleId];
    }
  }

  const { data: existing } = await supabase
    .from("giveaway_entries")
    .select("*")
    .eq("giveaway_id", giveaway.id)
    .eq("user_id", interaction.user.id)
    .single();

  let action;
  if (!existing) {
    await supabase
      .from("giveaway_entries")
      .insert([
        { giveaway_id: giveaway.id, user_id: interaction.user.id, entries },
      ]);
    action = "joined";
  } else {
    await supabase
      .from("giveaway_entries")
      .delete()
      .eq("giveaway_id", giveaway.id)
      .eq("user_id", interaction.user.id);
    action = "left";
  }

  const { data: allEntries } = await supabase
    .from("giveaway_entries")
    .select("entries")
    .eq("giveaway_id", giveaway.id);

  const totalEntries = allEntries.reduce((sum, row) => sum + row.entries, 0);

  const embed = EmbedBuilder.from(interaction.message.embeds[0]);
  const lines = embed.data.description
    .split("\n")
    .map((line) =>
      line.includes("Number of entries")
        ? `<:loldataeye:1412329976220483614> Number of entries: \`‎ ${totalEntries}‎ \``
        : line
    );
  embed.setDescription(lines.join("\n"));
  await interaction.message.edit({ embeds: [embed] });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#01D38E")
        .setDescription(
          action === "joined"
            ? "### <:loldatasuccess:1411943739836071967> You joined the giveaway\nClick the button again to leave."
            : "### <:loldatadenied:1411943771477905479> You left the giveaway\nClick the button again to join back."
        ),
    ],
    ephemeral: true,
  });

  console.log("allEntries:", allEntries);
}

// partner applications
export async function showModal(interaction) {
  if (interaction.customId !== "partners") return;

  if (interaction.deferred || interaction.replied) return;

  const selectedCategory = interaction.values?.[0];
  if (!selectedCategory) {
    await interaction.reply({ content: "Selezione non valida.", ephemeral: true }).catch(() => { });
    return;
  }

  const proForm = new ModalBuilder()
    .setCustomId("proform")
    .setTitle("Pro application");

  const riotId = new TextInputBuilder()
    .setCustomId("riot_id")
    .setLabel("Riot ID")
    .setPlaceholder("lolData#EUW")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const nationality = new TextInputBuilder()
    .setCustomId("nationality")
    .setLabel("Country")
    .setPlaceholder("Germany")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const name = new TextInputBuilder()
    .setCustomId("name")
    .setLabel("Name (optional)")
    .setPlaceholder("Name and last name")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const team = new TextInputBuilder()
    .setCustomId("team")
    .setLabel("Team (optional)")
    .setPlaceholder("G2 Esports")
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  const other = new TextInputBuilder()
    .setCustomId("other")
    .setLabel("Informations (optional)")
    .setPlaceholder("Any other detail you would like to provide")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  proForm.addComponents(
    new ActionRowBuilder().addComponents(riotId),
    new ActionRowBuilder().addComponents(nationality),
    new ActionRowBuilder().addComponents(name),
    new ActionRowBuilder().addComponents(team),
    new ActionRowBuilder().addComponents(other)
  );

  const streamerForm = new ModalBuilder()
    .setCustomId("streamerform")
    .setTitle("Streamer application");

  const inputStreamer = new TextInputBuilder()
    .setCustomId("link")
    .setLabel("Streaming URL")
    .setPlaceholder("twitch.tv/loldata, kick.com/loldata, etc.")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  streamerForm.addComponents(new ActionRowBuilder().addComponents(inputStreamer));

  if (selectedCategory === "pro") {
    await interaction.showModal(proForm);
    return;
  }

  if (selectedCategory === "streamer") {
    await interaction.showModal(streamerForm);
    return;
  }

  await interaction.reply({
    content: "Categoria non valida.",
    ephemeral: true,
  }).catch(() => { });
}


export async function proSubmit(interaction) {
  if (interaction.customId === "proform") {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) return;

    const category = "pro";

    const { data: lastThreadData } = await supabase
      .from("threads")
      .select("thread_number")
      .eq("category", category)
      .order("thread_number", { ascending: false })
      .limit(1)
      .single();

    let threadNumber = lastThreadData ? lastThreadData.thread_number + 1 : 1;

    const riotIdContent = interaction.fields.getTextInputValue("riot_id");
    const nationalityContent =
      interaction.fields.getTextInputValue("nationality");
    const nameContent = interaction.fields.getTextInputValue("name");
    const teamContent = interaction.fields.getTextInputValue("team");
    const otherContent = interaction.fields.getTextInputValue("other");

    const fields = [
      { label: "Riot ID", value: riotIdContent },
      { label: "Nationality", value: nationalityContent },
      { label: "Name", value: nameContent },
      { label: "Team", value: teamContent },
      { label: "Informations", value: otherContent },
    ];

    const proFormContent = fields
      .filter((f) => f.value && f.value.trim() !== "")
      .map((f) => `${f.label}: \`${f.value}\``)
      .join("\n");

    const infoEmbed = new EmbedBuilder()
      .setColor("#01D38E")
      .setDescription(
        `## <:loldatapro:1412519573084836091> Pro Application\nThanks for applying as a <@&1401128835889762415>. The <@&1407639645918990339> team will get to you asap, in the meantime, tell us more about your achievements or any other info that you think it might be useful while reviewing this application.\n### Form informations\n${proFormContent}`
      );

    const approveReject = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("approve")
        .setLabel("Approve")
        .setEmoji("<:loldatasuccess:1411943739836071967>")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("reject")
        .setLabel("Reject")
        .setEmoji("<:loldatareject:1412576366943273022>")
        .setStyle(ButtonStyle.Secondary)
    );

    const proThread = await channel.threads.create({
      name: `pro application ${threadNumber}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false,
    });

    await proThread.members.add(interaction.user.id).catch(console.error);

    await supabase.from("threads").insert([
      {
        thread_id: proThread.id,
        thread_number: threadNumber,
        creator_id: interaction.user.id,
        channel_id: proThread.id,
        category: category,
      },
    ]);

    await proThread.send({
      content: `Your application will be reviewed by the <@&1407639645918990339> team within 24 hours.`,
      embeds: [infoEmbed],
      components: [approveReject],
    });

    const { error: proAppErr } = await supabase.from("proApplications").insert([
      {
        guild_id: interaction.guildId,
        creator_id: interaction.user.id,
        thread_id: proThread.id,
        thread_url: proThread.url,

        riot_id: riotIdContent,
        nationality: nationalityContent,
        name: nameContent || null,
        team: teamContent || null,
        other: otherContent || null,

        status: "pending",
      },
    ]);

    if (proAppErr) {
      console.error("Error inserting proApplications:", proAppErr);
      // Non blocco l'utente: il thread è già creato, però segnalo in log.
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `## <:loldatasuccess:1411943739836071967> Application submitted: ${proThread.url}\nYour application will be reviewed within 24 hours.`
          ),
      ],
      ephemeral: true,
    });
  }
}

export async function proApprove(interaction) {
  if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> You cannot approve or reject your own application.`
          ),
      ],
      ephemeral: true,
    });

    return;
  }

  if (interaction.customId === "approve") {
    const { data: application, error } = await supabase
      .from("threads")
      .select("creator_id")
      .eq("channel_id", interaction.channel.id)
      .single();

    // console.log("Supabase result:", application, error);

    if (!application) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Application user not found."
            ),
        ],
        ephemeral: true,
      });
    }

    const guild = interaction.guild;
    const applicationMember = await guild.members
      .fetch(application.creator_id)
      .catch(() => null);

    if (!applicationMember) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
            ),
        ],
        ephemeral: true,
      });
    }

    await applicationMember.roles.add(process.env.PRO_ROLE_ID);

    const reviewer = interaction.user.globalName;
    try {
      await applicationMember.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `**<:loldatasuccess:1411943739836071967> Your application has been approved**\n\nlolData has approved your **Pro** application, welcome aboard.\nIf you need assistance, please head over to [help](https://discord.com/channels/1400118983885324411/1410198632296349728) and open a ticket.\n\nHandled by \`‎ ${reviewer}‎ \``
            )
            .setThumbnail("https://i.imgur.com/01LojTr.png"),
        ],
      });
    } catch (err) {
      console.error(
        `<:loldatadenied:1411943771477905479> Could not message user ${userId}:`,
        err
      );
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Application approved and user notified.`
          ),
      ],
      ephemeral: true,
    });

    await supabase
      .from("proApplications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewer_id: interaction.user.id,
      })
      .eq("thread_id", interaction.channel.id);

    return interaction.channel.delete().catch(console.error);
  }
}

export async function proReject(interaction) {
  if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> You cannot approve or reject your own application.`
          ),
      ],
      ephemeral: true,
    });

    return;
  }

  if (interaction.customId === "reject") {
    const { data: application, error } = await supabase
      .from("threads")
      .select("creator_id")
      .eq("channel_id", interaction.channel.id)
      .single();

    if (!application) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Application user not found."
            ),
        ],
        ephemeral: true,
      });
    }

    const guild = interaction.guild;
    const applicationMember = await guild.members
      .fetch(application.creator_id)
      .catch(() => null);

    if (!applicationMember) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
            ),
        ],
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("rejectModal")
      .setTitle("Reject Application");

    const reasonInput = new TextInputBuilder()
      .setCustomId("rejectReason")
      .setLabel("Reason")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Reason of the rejection")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }
}

export async function proRejectSubmit(interaction) {
  if (interaction.customId !== "rejectModal") return;

  const reason = interaction.fields.getTextInputValue("rejectReason");

  const { data: application } = await supabase
    .from("threads")
    .select("creator_id")
    .eq("channel_id", interaction.channel.id)
    .single();

  if (!application) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            "<:loldatadenied:1411943771477905479> Application user not found."
          ),
      ],
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  const applicationMember = await guild.members
    .fetch(application.creator_id)
    .catch(() => null);

  if (!applicationMember) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
          ),
      ],
      ephemeral: true,
    });
  }

  const reviewer = interaction.user.globalName;
  try {
    await applicationMember.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `**<:loldatadenied:1411943771477905479> Your application has been rejected**\n\nlolData has rejected your **Pro** application. Please do not submit another application before **90** days have passed.\n\n**Reason** — \`${reason}\`\n\nHandled by \`‎ ${reviewer}‎ \``
          )
          .setThumbnail("https://i.imgur.com/01LojTr.png"),
      ],
    });
  } catch (err) {
    console.error(`Could not message user ${application.creator_id}:`, err);
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#01D38E")
        .setDescription(
          `<:loldatasuccess:1411943739836071967> Application rejected and user notified.`
        ),
    ],
    ephemeral: true,
  });

  await interaction.channel.delete().catch(console.error);
}

export async function streamerSubmit(interaction) {
  if (interaction.customId === "streamerform") {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased()) return;

    const category = "streamer";

    const { data: lastThreadData } = await supabase
      .from("threads")
      .select("thread_number")
      .eq("category", category)
      .order("thread_number", { ascending: false })
      .limit(1)
      .single();

    let threadNumber = lastThreadData ? lastThreadData.thread_number + 1 : 1;
    const streamLink = interaction.fields.getTextInputValue("link");

    const streamerEmbed = new EmbedBuilder()
      .setColor("#01D38E")
      .setDescription(
        `## <:loldatastreamers:1412878237117321288> Streamer Application\nThanks for applying as a <@&1401128807833927680>. The <@&1407639645918990339> team will get to you asap, in the meantime, tell us more about your achievements or any other info that you think it might be useful while reviewing this application.\n### Form informations\n\nStreaming URL: \`${streamLink}\``
      );

    const approveRejectTwo = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("streamer_approve")
        .setLabel("Approve")
        .setEmoji("<:loldatasuccess:1411943739836071967>")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("streamer_reject")
        .setLabel("Reject")
        .setEmoji("<:loldatareject:1412576366943273022>")
        .setStyle(ButtonStyle.Secondary)
    );

    const streamerThread = await channel.threads.create({
      name: `streamer application ${threadNumber}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      invitable: false,
    });

    await streamerThread.members.add(interaction.user.id).catch(console.error);

    await supabase.from("threads").insert([
      {
        thread_id: streamerThread.id,
        thread_number: threadNumber,
        creator_id: interaction.user.id,
        channel_id: streamerThread.id,
        category: category,
      },
    ]);

    await streamerThread.send({
      content: `Your application will be reviewed by the <@&1407639645918990339> team within 24 hours.`,
      embeds: [streamerEmbed],
      components: [approveRejectTwo],
    });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `## <:loldatasuccess:1411943739836071967> Application submitted: ${streamerThread.url}\nYour application will be reviewed within 24 hours.`
          ),
      ],
      ephemeral: true,
    });
  }
}
export async function streamerApprove(interaction) {
  if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> You cannot approve or reject your own application.`
          ),
      ],
      ephemeral: true,
    });

    return;
  }

  if (interaction.customId === "streamer_approve") {
    const { data: application, error } = await supabase
      .from("threads")
      .select("creator_id")
      .eq("channel_id", interaction.channel.id)
      .single();

    if (!application) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Application user not found."
            ),
        ],
        ephemeral: true,
      });
    }

    const guild = interaction.guild;
    const applicationMember = await guild.members
      .fetch(application.creator_id)
      .catch(() => null);

    if (!applicationMember) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
            ),
        ],
        ephemeral: true,
      });
    }

    await applicationMember.roles.add(process.env.STREAMER_ROLE_ID);

    const reviewer = interaction.user.globalName;
    try {
      await applicationMember.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              `**<:loldatasuccess:1411943739836071967> Your application has been approved**\n\nlolData has approved your **Streamer** application, welcome aboard.\nIf you need assistance, please head over to [help](https://discord.com/channels/1400118983885324411/1410198632296349728) and open a ticket.\n\nHandled by \`‎ ${reviewer}‎ \``
            )
            .setThumbnail("https://i.imgur.com/4AL855s.png"),
        ],
      });
    } catch (err) {
      console.error(`Could not message user: ${application.creator_id}`, err);
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatasuccess:1411943739836071967> Application approved and user notified.`
          ),
      ],
      ephemeral: true,
    });

    return interaction.channel.delete().catch(console.error);
  }
}
export async function streamerReject(interaction) {
  if (!interaction.member.roles.cache.has(process.env.SUPPORT_ROLE_ID)) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> You cannot approve or reject your own application.`
          ),
      ],
      ephemeral: true,
    });

    return;
  }

  if (interaction.customId === "streamer_reject") {
    const { data: application, error } = await supabase
      .from("threads")
      .select("creator_id")
      .eq("channel_id", interaction.channel.id)
      .single();

    if (!application) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Application user not found."
            ),
        ],
        ephemeral: true,
      });
    }

    const guild = interaction.guild;
    const applicationMember = await guild.members
      .fetch(application.creator_id)
      .catch(() => null);

    if (!applicationMember) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#01D38E")
            .setDescription(
              "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
            ),
        ],
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("streamerRejectModal")
      .setTitle("Reject Application");

    const reasonInput = new TextInputBuilder()
      .setCustomId("streamerRejectReason")
      .setLabel("Reason")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Reason of the rejection")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  }
}

export async function streamerRejectSubmit(interaction) {
  if (interaction.customId !== "streamerRejectModal") return;

  const reason = interaction.fields.getTextInputValue("streamerRejectReason");

  const { data: application } = await supabase
    .from("threads")
    .select("creator_id")
    .eq("channel_id", interaction.channel.id)
    .single();

  if (!application) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            "<:loldatadenied:1411943771477905479> Application user not found."
          ),
      ],
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  const applicationMember = await guild.members
    .fetch(application.creator_id)
    .catch(() => null);

  if (!applicationMember) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            "<:loldatadenied:1411943771477905479> Could not find the application user in this server."
          ),
      ],
      ephemeral: true,
    });
  }
  const reviewer = interaction.user.globalName;

  try {
    await applicationMember.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `**<:loldatadenied:1411943771477905479> Your application has been rejected**\n\nlolData has rejected your **Streamer** application. Please do not submit another application before **90** days have passed.\n\n**Reason** — \`${reason}\`\n\nHandled by \`‎ ${reviewer}‎ \``
          )
          .setThumbnail("https://i.imgur.com/4AL855s.png"),
      ],
    });
  } catch (err) {
    console.error(`Could not message user ${application.creator_id}:`, err);
  }

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#01D38E")
        .setDescription(
          `<:loldatasuccess:1411943739836071967> Application rejected and user notified.`
        ),
    ],
    ephemeral: true,
  });

  await interaction.channel.delete().catch(console.error);
}
