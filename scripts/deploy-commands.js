import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';

const commandsPath = path.resolve('./commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

// dynamic command upload
const commands = await Promise.all(
  commandFiles.map(async file => {
    const { data } = await import(`../commands/${file}`);
    return data.toJSON();
  })
);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function main() {
  try {
    console.log('Registering commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Successfully registered commands.');
  } catch (err) {
    console.error('Error while registering commands:', err);
    process.exit(1);
  }
}

main();
