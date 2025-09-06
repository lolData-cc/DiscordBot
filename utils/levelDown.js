export async function checkLevelDown(member, newExpPoints, guild) {
  const levelUpChannel = guild.channels.cache.get(process.env.CHAT_CHANNEL_ID);
  const roleThresholds = [
    { exp: 500, roleId: process.env.LEVEL_10_ROLE_ID },
    { exp: 2500, roleId: process.env.LEVEL_25_ROLE_ID },
    { exp: 4500, roleId: process.env.LEVEL_50_ROLE_ID },
    { exp: 7500, roleId: process.env.LEVEL_100_ROLE_ID },
    { exp: 11500, roleId: process.env.LEVEL_MAX_ROLE_ID },
  ];

  for (const { exp, roleId } of roleThresholds) {
    if (newExpPoints < exp && member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId).catch(console.error);
    }
  }
}
