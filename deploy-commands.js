const { SlashCommandBuilder, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { clientId, guildId, token } = require('./config.json')

const commands = [
  new SlashCommandBuilder().setName('getinvite').setDescription('Get an invite for a friend!')
]
  .map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(token)

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error)

rest.delete(Routes.applicationGuildCommand(clientId, '1012435820218683453'))
	.then(() => console.log('Successfully deleted application command'))
	.catch(console.error);
