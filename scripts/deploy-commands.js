import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';

// Commands are registered in two separate scopes.
//
//   GUILD  — everything that only makes sense inside the lolData server
//            (tickets, panels, role assignment, exp leaderboard).
//   GLOBAL — commands that must work in ANY server the bot is invited to.
//            /live answers for a scout lobby, and a lobby's Discord feed
//            usually lives in the community's own server, not ours.
//
// The two sets are independent in Discord's API, so anything listed as global
// is deliberately excluded from the guild payload — otherwise it would appear
// twice inside lolData.
const GLOBAL_COMMANDS = new Set([
  // scout lobby
  'live.js', 'lastgame.js', 'today.js', 'standings.js', 'champs.js',
  'bounty.js', 'refresh.js',
  // league data
  'rank.js', 'champion.js', 'counters.js', 'tierlist.js', 'patchnotes.js',
  'lolstatus.js',
  // the index of all of the above
  'loldata.js',
]);

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

const load = async (files) =>
  Promise.all(
    files.map(async file => {
      const { data } = await import(`../commands/${file}`);
      return data.toJSON();
    })
  );

// The loldata commands go in BOTH scopes on purpose.
//
// A global command can take up to an hour to appear the first time, while a
// guild command shows up instantly. Registering them in the lolData guild too
// means they are usable here immediately and everywhere else once Discord
// catches up. There is no duplicate in the picker: when a guild and a global
// command share a name, Discord shows the guild one.
const guildFiles = commandFiles;
const globalFiles = commandFiles.filter(f => GLOBAL_COMMANDS.has(f));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function main() {
  try {
    const guildBody = await load(guildFiles);
    console.log(`Registering ${guildBody.length} guild command(s)...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: guildBody }
    );

    const globalBody = await load(globalFiles);
    console.log(`Registering ${globalBody.length} global command(s): ${globalFiles.join(', ')}`);
    // The first time, a global command can take up to an hour to show up in
    // every server; later edits propagate quickly.
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: globalBody }
    );

    console.log('Successfully registered commands.');
  } catch (err) {
    console.error('Error while registering commands:', err);
    process.exit(1);
  }
}

main();
