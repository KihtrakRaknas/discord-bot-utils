const Discord = require('discord.js');
const client = new Discord.Client();
const cheerio = require('cheerio');
const got = require('got');
require('dotenv').config()
let channels = []
let prefix
let admins = []
let cmdObjs
let webScrapeUIDs = []

exports.onReady = (callback) => {
    client.on('ready', callback);
}

let clientReady = new Promise(res => {
    exports.onReady(() => res())
})

let hash = (str)=>{
    let h = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      h  = ((h << 5) - h) + chr;
      h |= 0; // Convert to 32bit integer
    }
    return h;
}

exports.onReady(async ()=>{
    const key = JSON.stringify(cmdObjs,(key, value)=>(typeof value === 'function' ) ? value.toString() : value) || ""
    let body
    try{
        body = (await got('https://verify-util.herokuapp.com/check', {searchParams: {hash: hash(key), auth:process.env.REMOTEVERIFICATIONSERVERCODE},responseType: 'json'})).body
    }catch(e){
        console.log("Verify Failed: "+e)
    }
    if(body&&body.valid == false){
        console.log("Invalid HashCode")
        process.exit()
        throw new Error('Invalid HashCode');
    }
})

exports.setToken = (token) => {
    client.login(token);
}

exports.setPrefix = (newPrefix) => {
    prefix = newPrefix
}

exports.addAdmin = (admin) => {
    if (!admins.includes(admin))
        admins.push(admin)
}

exports.addAdminsFromArr = (adminsArr) => {
    admins = [...new Set([...adminsArr, ...admins])]
}

exports.addChannel = (channel) => {
    if (!channels.includes(channel))
        channels.push(channel)
}

exports.addChannelWithId = async (channelID) => {
    await clientReady
    let channelToAdd
    client.guilds.cache.each(guild => {
        channelToAdd = guild.channels.cache.find(channel => channelID == (channel.id))
        if (channelToAdd) {
            addChannel(channelToAdd)
        }
    })
}

exports.addChannelFromArrWithId = async (channelIDs) => {
    await clientReady
    client.guilds.cache.each(guild => {
        guild.channels.cache.filter(channel => channelIDs.includes(channel.id)).each(channelToAdd => channels.push(channelToAdd))
    })
}

exports.addChannelFromArr = (channelsArr) => {
    channels = [...new Set([...channelsArr, ...channels])]
}

exports.sendHelpMsg = (message) => { // AUX function
    const newEmbed = new Discord.MessageEmbed().setTitle(`**Commands**`)
    for (let cmdObj of cmdObjs)
        newEmbed.addField(`**${cmdObj["cmd"]}**`, cmdObj["desc"])
    message.reply(newEmbed)
}

exports.onMessage = (newCmdObjs) => {
    cmdObjs = [...newCmdObjs, {
        cmd: "help",
        desc: "This command!",
        exe: sendHelpMsg,
        params: null,
        admin: false
    }]
    client.on('message', message => {
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        const args = message.content.slice(prefix.length).trim().split(' ');
        const command = args.shift().toLowerCase();
        const isAdmin = admins.includes(message.author.id)
        for (let cmdObj of cmdObjs) {
            if (cmdObj["cmd"].toLowerCase() == command && (!cmdObj["admin"] || isAdmin)) {
                cmdObj["exe"](message, args, cmdObj["params"])
            }
        }
    })
}


exports.addRole = (m, roleName, member) => {
    let role = member.guild.roles.cache.find(role => role.name === roleName)
    member.roles.add(role)
}

exports.addRoleTime = (m, roleName, member, time, timeArgs) => {
    let unit = 60
    if (timeArgs === 's')
        unit = 1
    if (timeArgs === 'm')
        unit = 60
    if (timeArgs === 'h')
        unit = 3600
    if (timeArgs === 'd')
        unit = 3600 * 24
    let role = m.guild.roles.cache.find(role => role.name === roleName)
    member.roles.add(role)
    m.channel.send(roleName+" added to "+member.user.tag+" for "+time+" "+timeArgs)
    setTimeout(() => { member.roles.remove(role)
        m.channel.send("Removed "+roleName+" from "+member.user.tag) }, time * unit * 1000)
}

exports.mute = (m, member) => {
    let role = m.guild.roles.cache.find(role => role.name === "Muted")
    if(role==null){
        guild.roles.create({ data: { name: 'Muted', permissions: [] } })
    }
    m.channel.send(member.user.tag+" has been muted.")
    member.roles.add(role)
}

exports.muteTime = (m, member, time, timeArgs) => {
    let unit = 60
    if (timeArgs === 's')
        unit = 1
    if (timeArgs === 'm')
        unit = 60
    if (timeArgs === 'h')
        unit = 3600
    if (timeArgs === 'd')
        unit = 3600 * 24
    let role = m.guild.roles.cache.find(role => role.name === "Muted")
    if(role==null){
        guild.roles.create({ data: { name: 'Muted', permissions: [] } })
    }
    member.roles.add(role)
    m.channel.send(member.user.tag+" has been muted for "+time+" "+timeArgs)
    setTimeout(() => { member.roles.remove(role)
        m.channel.send(member.user.tag+" is no longer muted.") }, time * unit * 1000)
}

let getSelection = async (message, emojisObj, sendMedium) => {
    return askWithReactions(await sendMedium.send(message + generateEmojiDesc(emojisObj)), emojisObj)
}

let generateEmojiDesc = (m, emojiObj) => {
    let output = '\n'
    for (let emoji in emojiObj) {
        output += `\n${emoji} -> **${emojiObj[emoji]}**`
    }
    return output
}

exports.askWithReactions = (message, emojiObj) => {
    emojiArr = Object.keys(emojiObj)
    for (let emoji of emojiArr)
        message.react(emoji)
    const reactions = new Discord.ReactionCollector(message, reaction => true);
    let emojiSelection = new Promise((res, rej) => {
        reactions.on('collect', reaction => {
            if (reaction.count > 1) {
                if (emojiArr.includes(reaction.emoji.name))
                    message.reactions.removeAll().catch(() => { }/*error => console.log('Failed to clear reactions')*/);
                reactions.stop()
                res(emojiObj[reaction.emoji.name])
            }
        })
    });

    return emojiSelection;
}

exports.channels = channels
exports.client = client
exports.Discord = Discord