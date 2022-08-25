// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { token } = require('./config.json')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// When the client is ready, run this code (only once)
client.once('ready', () => {
  console.log('Ready!')
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction

  if (commandName === 'getinvite') {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('agree')
          .setLabel('Agree')
          .setStyle(ButtonStyle.Success)
      )

    const filter = i => i.customId === 'agree' && i.user.id === interaction.user.id
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000 })
    collector.on('collect', async i => {
      interaction.guild.invites.create('1011755348333445130', { maxUses: 1, maxAge: 604800 })
        .then(invite => {
          i.update({ content: `Here is your invite link: ${invite.toString()}`, components: [] })
        })
        .catch(console.error)
    })
    collector.on('end', () => {
      interaction.editReply({ content: 'Expired', components: [] })
    })

    await interaction.reply({ content: 'Rules', ephemeral: true, components: [row] })
  }
})

// Login to Discord with your client's token
client.login(token)
