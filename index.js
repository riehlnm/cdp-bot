// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { token } = require('./config.json')

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const invite_rules = "Have you read our invitation policy? The full policy can be found here; a quick reminder of the most important points follows:\n1) When you invite someone, they attend their first event partially as your guest. We hope you’ll invite people who are trustworthy, fun to be around, and whose behavior aligns with our community values.\n2) We will give you an invitation link to this server that is good for one use for the next seven days. Don’t try to reuse links, and wait to generate the link until you’re ready to send it.\n3) When your invitee joins the server, they will be let into a welcome channel where they will need to let a moderator know who invited them and wait to be manually assigned a role and let in to the main server. This can take a few days, and we thank you for your patience!\nClick the button to confirm you’ve read all that."

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

    await interaction.reply({ content: invite_rules, ephemeral: true, components: [row] })
  }
})

// Login to Discord with your client's token
client.login(token)
