// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { token } = require('./config.json')
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('cdpbot.db') 
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildInvites,
] })

const invite_rules = "Have you read our invitation policy? The full policy can be found here; a quick reminder of the most important points follows:\n1) When you invite someone, they attend their first event partially as your guest. We hope you’ll invite people who are trustworthy, fun to be around, and whose behavior aligns with our community values.\n2) We will give you an invitation link to this server that is good for one use for the next seven days. Don’t try to reuse links, and wait to generate the link until you’re ready to send it.\n3) When your invitee joins the server, they will be let into a welcome channel where they will need to let a moderator know who invited them and wait to be manually assigned a role and let in to the main server. This can take a few days, and we thank you for your patience!\nClick the button to confirm you’ve read all that."

// Initialize the invite cache
const invites = new Map();

// A pretty useful method to create a delay without blocking the whole script.
const wait = require("timers/promises").setTimeout;

client.on("ready", async () => {
  // "ready" isn't really ready. We need to wait a spell.
  await wait(1000);

  console.log('Ready!')
  // Loop over all the guilds
  client.guilds.cache.forEach(async (guild) => {
    // Fetch all Guild Invites
    const firstInvites = await guild.invites.fetch();
    // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
    invites.set(guild.id, new Map(firstInvites.map((invite) => [invite.code, invite.uses])));
    for (const [_, invite] of firstInvites) {
      if (invite.inviterId == '800580011245043772' && invite.uses == 1) invite.delete()
    }
  });
});

client.on("guildMemberAdd", async (member) => {
  const newInvites = await member.guild.invites.fetch()
  const oldInvites = invites.get(member.guild.id);
  const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
  const logChannel = member.guild.channels.cache.find(channel => channel.name === "invitation-tracking");

  if (invite){
    db.get('SELECT * FROM invites WHERE code = ?', invite.code, async (_, row) => {
      db.run('UPDATE invites SET invited = ? WHERE code = ?', member.user.id, invite.code)
      const inviter_id = row?.inviter
      const inviter = (await member.guild.members.fetch(`${inviter_id}`)).displayName
      if (logChannel) {
        (row && inviter)
          ? logChannel.send(`${member.user.tag} joined using an invite from ${inviter}`)
          : logChannel.send(`${member.user.tag} joined but I couldn't find who invited them`)
      }
    })
    oldInvites.set(invite.code, invites.uses)
    if (invite.inviterId == '800580011245043772'){
      oldInvites.delete(invite.code)
      invite.delete()
    }
  } else if (logChannel) {
    logChannel.send(`${member.user.tag} joined but I couldn't find who invited them`);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  const { commandName } = interaction

  if (commandName === 'getinvite') {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('agree' + interaction.id)
          .setLabel('Agree')
          .setStyle(ButtonStyle.Success)
      )

    const filter = i => i.customId === ('agree' + interaction.id) && i.user.id === interaction.user.id
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 120000, max: 1 })
    collector.on('collect', async i => {
      interaction.guild.invites.create('1011755348333445130', { maxUses: 2, maxAge: 604800, unique: true })
        .then(invite => {
          db.run('INSERT INTO invites (code, inviter) VALUES (?, ?)', invite.code, interaction.user.id)
          invites.get(interaction.guild.id).set(invite.code, invite.uses);
          i.update({ content: `Here is your invite link: ${invite.toString()}`, components: [] })
            .catch(console.error)
        })
        .catch(console.error)
    })
    collector.on('end', () => {
      if (collector.endReason != 'limit') {
        interaction.editReply({ content: 'Expired', components: [] })
      }
    })

    await interaction.reply({ content: invite_rules, ephemeral: true, components: [row] })
  }
})

// Login to Discord with your client's token
client.login(token)
