import { EmbedBuilder } from "discord.js";

export async function checkLevelUp(member, newExpPoints, guild) {
  const levelUpChannel = guild.channels.cache.get(process.env.CHAT_CHANNEL_ID);

  const roleThresholds = [
    {
      exp: 500,
      roleId: process.env.LEVEL_10_ROLE_ID,
      emoji: "<:initiate:1413070725148839986>",
    },
    {
      exp: 2500,
      roleId: process.env.LEVEL_25_ROLE_ID,
      emoji: "<:insider:1413070718979018792>",
    },
    {
      exp: 4500,
      roleId: process.env.LEVEL_50_ROLE_ID,
      emoji: "<:advocate:1413070721017708584>",
    },
    {
      exp: 7500,
      roleId: process.env.LEVEL_100_ROLE_ID,
      emoji: "<:associate:1413070727497777294>",
    },
    {
      exp: 11500,
      roleId: process.env.LEVEL_MAX_ROLE_ID,
      emoji: "<:ambassador:1413070723404140564>",
    },
  ];

  const rolesToAdd = roleThresholds.filter(
    (r) => newExpPoints >= r.exp && !member.roles.cache.has(r.roleId)
  );

  if (!rolesToAdd.length) return;

  for (const { roleId } of rolesToAdd) {
    await member.roles.add(roleId).catch(console.error);
  }

  const highestRole = rolesToAdd[rolesToAdd.length - 1];

  if (levelUpChannel && levelUpChannel.isTextBased()) {
    const levelUpEmbed = new EmbedBuilder()
      .setColor("#01D38E")
      .setDescription(
        `## <:updates:1412881811624955936> Tier Advancement\n<@${member.id}> has reached the ${highestRole.emoji}<@&${highestRole.roleId}> tier, congratulations.`
      );

    await levelUpChannel
      .send({
        content: `<@${member.id}>`,
        embeds: [levelUpEmbed],
        allowedMentions: {
          users: [member.id],
          roles: [highestRole.roleId],
        },
      })
      .catch(console.error);
  }
}
