import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { supabase } from "../supabaseClient.js";

const roleThresholds = [
  {
    exp: 0,
    roleId: process.env.MEMBER_ROLE_ID,
    emoji: "",
    description:
      "Member is the default role. Obtainable by completing the verification, it grants `‎ 1‎ ` giveaway entry for each giveaway.",
  },
  {
    exp: 500,
    roleId: process.env.LEVEL_10_ROLE_ID,
    emoji: "<:initiate:1413070725148839986>",
    description:
      "Unlocked at `‎ 50‎ ` exp, Initiate is the first tier. This tier will grant you 1 extra giveaway entry for each giveaway, for a total of `‎ 2‎ `.",
  },
  {
    exp: 2500,
    roleId: process.env.LEVEL_25_ROLE_ID,
    emoji: "<:insider:1413070718979018792>",
    description:
      "Unlocked at `‎ 250‎ ` exp, Insider is the second tier, grants a total of `‎ 3‎ ` giveaway entries for each giveaway.",
  },
  {
    exp: 4500,
    roleId: process.env.LEVEL_50_ROLE_ID,
    emoji: "<:advocate:1413070721017708584>",
    description:
      "`‎ 450‎ ` exp required to unlock Advocate, the third tier. Being in this tier  will grant you 3 extra giveaway entries, making it `‎ 4‎ ` total for each giveaway.",
  },
  {
    exp: 7500,
    roleId: process.env.LEVEL_100_ROLE_ID,
    emoji: "<:associate:1413070727497777294>",
    description:
      "The fifth tier, Associate, is achieved upon reaching `‎ 750‎ ` exp and will award you with a total of `‎ 5‎ ` giveaway entries for each giveaway.",
  },
  {
    exp: 11500,
    roleId: process.env.LEVEL_MAX_ROLE_ID,
    emoji: "<:ambassador:1413070723404140564>",
    description:
      "Ambassador is the highster of all tiers, achieved at `‎ 1.150‎ ` exp. This tier will grant you `‎ 8‎ ` giveaway entries for every giveaway hosted.",
  },
];

function createExpBar(currentExp, nextTierExp, barLength = 44) {
  if (!nextTierExp) return "‎ ".repeat(barLength);

  const percent = currentExp / nextTierExp;

  if (percent <= 0) {
    return `\`\`\`${"‎ ".repeat(barLength)}\`\`\``;
  }

  const filledLength = Math.round(barLength * percent);

  const filledBar = "‎ ".repeat(filledLength);

  return `\`\`\`ansi
[37m[47m${filledBar}[0m
\`\`\``;
}

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Shows your own or another user's profile")
  .addUserOption((option) =>
    option.setName("user").setDescription("Targeted user").setRequired(false)
  );

export async function execute(interaction) {
  const targetUser = interaction.options.getUser("user") || interaction.user;
  const guildId = interaction.guild.id;
  const userId = targetUser.id;

  const member = await interaction.guild.members.fetch(userId);

  const vipRoles = [
    { id: "1413351096675733659", emoji: "<:developer:1413902285255217162>" },
  ];

  let vipRoleText = "";
  const ownedVipRole = member.roles.cache.find((role) =>
    vipRoles.some((vr) => vr.id === role.id)
  );
  if (ownedVipRole) {
    const roleData = vipRoles.find((r) => r.id === ownedVipRole.id);
    vipRoleText = ` ${roleData.emoji}<@&${ownedVipRole.id}>`;
  }

  const specialRoles = [
    { id: "1401130677218574336", emoji: "<:loldataadmin:1412075126102429846>" },
    { id: "1401130681060425758", emoji: "<:loldatamod:1413069465658327112>" },
    {
      id: "1407639645918990339",
      emoji: "<:loldatasupport:1413069467776192593>",
    },
    { id: "1408401579333128282", emoji: "<:tester:1413071613217210420>" },
    {
      id: "1401128807833927680",
      emoji: "<:loldatastreamers:1412878237117321288>",
    },
    {
      id: "1401128835889762415",
      emoji: "<:loldatapro:1412519573084836091>",
    },
    { id: "1408286555117981797", emoji: "<:elite:1413184777497870517>" },
    { id: "1408286412335484938", emoji: "<:premium:1413184780882809023>" },
    { id: "1401125659279101973", emoji: "<:boostieicon:1413699208317243392>" },
  ];

  const ownedSpecialRoles = member.roles.cache.filter((role) =>
    specialRoles.some((r) => r.id === role.id)
  );

  let specialRoleText = "";
  if (ownedSpecialRoles.size > 0) {
    const highestRole = ownedSpecialRoles
      .sort((a, b) => b.position - a.position)
      .first();

    const roleData = specialRoles.find((r) => r.id === highestRole.id);

    specialRoleText = ` — ${roleData.emoji}<@&${highestRole.id}>`;
  }

  try {
    const { data: userData, error } = await supabase
      .from("user_exp")
      .select("exp_points, last_message")
      .eq("user_id", userId)
      .eq("guild_id", guildId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      return interaction.reply({
        content: "Errore nel recupero dei dati.",
        ephemeral: true,
      });
    }

    const expPoints = userData?.exp_points || 0;

    let currentTier = { roleId: "1407664698798768138", emoji: "" };
    let nextTier = null;

    for (const tier of roleThresholds) {
      if (expPoints >= tier.exp) {
        currentTier = tier;
      } else {
        nextTier = tier;
        break;
      }
    }

    const expToNextTier = nextTier ? nextTier.exp - expPoints : 0;
    const expBar = createExpBar(
      expPoints - (currentTier.exp || 0),
      nextTier ? nextTier.exp - (currentTier.exp || 0) : 0
    );

    const lastMessageTime = userData?.last_message
      ? `<t:${Math.floor(new Date(userData.last_message).getTime() / 1000)}:f>`
      : "`‎ No messages yet‎ `";

    let rank = "`‎ N/A‎ `";
    try {
      const { count, error: rankError } = await supabase
        .from("user_exp")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", guildId)
        .gt("exp_points", expPoints);

      if (rankError) {
        console.error("Error while calculating rank.", rankError);
      } else {
        rank = `\`‎ #${(count || 0) + 1}‎ \``;
      }
    } catch (e) {
      console.error("Error while calculating rank.", e);
    }

    const embed = new EmbedBuilder()
      .setDescription(
        `### 
<:loldataprofile:1413314106210914336> ${
          targetUser.globalName
        } ${specialRoleText}${vipRoleText}\n<:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059><:line:1413101899770626059>\n\n**Tier**: ${
          currentTier.emoji
        }<@&${currentTier.roleId}>\n${
          currentTier.description
        }\n\n**Current exp points**: \`‎ ${Math.floor(
          expPoints / 10
        )}‎ \`\n${expBar}\n**Exp points to next tier**: \`‎ ${
          nextTier ? Math.floor(expToNextTier / 10) : "Max Tier reached"
        }‎ \`\nSending messages will grant you experience, as well as winning trivia quizzes. To learn more about it, visit [tiers](https://discord.com/channels/1400118983885324411/1411950273718521998).\n\n**Current leaderboard position**: ${rank}\nYou can check the top \`‎ 25‎ \` user with most exp points by typing **/leaderboard** in [commands](https://discord.com/channels/1400118983885324411/1413091233860943934).\n‎ `
      )
      .setColor("#01D38E")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: "Member since",
          value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:D>`,
          inline: true,
        },
        {
          name: "Last message",
          value: `${lastMessageTime}`,
          inline: true,
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#01D38E")
          .setDescription(
            `<:loldatadenied:1411943771477905479> There was an error.`
          ),
      ],
      ephemeral: true,
    });
  }
}
