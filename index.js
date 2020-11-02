const Discord = require('discord.js');
const client = new Discord.Client();
const cheerio = require('cheerio');
const got = require('got');
let channels = []
let prefix
let admins = []
let cmdObjs
let webScrapeUIDs=[]

let setToken = (token) => {
    client.login(token);
}

let setPrefix = (newPrefix) => {
    prefix = newPrefix
}

let addAdmin = (admin) => {
    if (!admins.includes(admin))
        admins.push(admin)
}

let addAdminsFromArr = (adminsArr) => {
    admins = [...new Set([...adminsArr, ...admins])]
}

let addChannel = (channel) => {
    if (!channels.includes(channel))
        channels.push(channel)
}

let addChannelWithId = async (channelID)=>{
    await clientReady
    let channelToAdd
    client.guilds.cache.each(guild=>{
        channelToAdd = guild.channels.cache.find(channel=>channelID == (channel.id))
    })
    if(channelToAdd){
      channels.push(channelToAdd)
    }
}

let addChannelFromArrWithId = async (channelIDs)=>{
    await clientReady
    client.guilds.cache.each(guild=>{
        guild.channels.cache.filter(channel=>channelIDs.includes(channel.id)).each(channelToAdd=>channels.push(channelToAdd))
    })
}

let addChannelFromArr = (channelsArr) => {
    channels = [...new Set([...channelsArr, ...channels])]
}

let onReady = (callback) => {
    client.on('ready', callback);
}

let clientReady = new Promise(res=>{
    onReady(()=>res())
})

let sendHelpMsg = (message) => { // AUX function
    const newEmbed = new Discord.MessageEmbed().setTitle(`**Commands**`)
    for (let cmdObj of cmdObjs)
        newEmbed.addField(`**${cmdObj["cmd"]}**`, cmdObj["desc"])
    message.reply(newEmbed)
}

let onMessage = (newCmdObjs) => {
    cmdObjs = [...newCmdObjs, {
        cmd: "help",
        desc: "This command!",
        exe: sendHelpMsg,
        params:null,
        admin:false
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


let addRole = (m, roleName, member) => {
    let role = member.guild.roles.cache.find(role => role.name === roleName)
    member.roles.add(role)
}

let addRoleTime = (m, roleName, member, time, timeArgs) => {
    let unit = 60
    if (timeArgs === 's')
        unit = 1
    if (timeArgs === 'm')
        unit = 60
    if (timeArgs === 'h')
        unit = 3600
    if (timeArgs === 'd')
        unit = 3600*24
    let role = member.guild.roles.cache.find(role => role.name === roleName)
    member.roles.add(role)
    setTimeout(() => { member.roles.remove(role) }, time * unit * 1000)
}

let getSelection = async (message, emojisObj, sendMedium) => {
    return askWithReactions(await sendMedium.send(message+generateEmojiDesc(emojisObj)), emojisObj)
}

let generateEmojiDesc = (m, emojiObj) => {
    let output = '\n'
    for (let emoji in emojiObj) {
        output += `\n${emoji} -> **${emojiObj[emoji]}**`
    }
    return output
}

let askWithReactions = (message, emojiObj) => {
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

let getSite = async (url,func)=>{
    const response = await got(url);
    const $ = cheerio.load(response.body);
    func($)
  }
  
  let checkSite = async (url,items,uid,uidAttr,action) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);
  
    $(items).each((i, el) => {
      let href = $(uid, el).attr(uidAttr)
      if(href && !webScrapeUIDs.includes(href)){
        webScrapeUIDs.push(href)
        if(action)
          action(el,href)
      }
    }) 
  }

exports.addChannel = addChannel
exports.addChannelFromArr = addChannelFromArr
exports.channels = channels
exports.client = client
exports.onReady = onReady
exports.onMessage = onMessage
exports.getSelection = getSelection
exports.setToken = setToken
exports.setPrefix = setPrefix
exports.addAdmin = addAdmin
exports.addAdminsFromArr = addAdminsFromArr
exports.addRole = addRole
exports.addRoleTime = addRoleTime
exports.addChannelWithId = addChannelWithId
exports.addChannelFromArrWithId = addChannelFromArrWithId
exports.Discord = Discord
exports.getSite = getSite
exports.checkSite = checkSite