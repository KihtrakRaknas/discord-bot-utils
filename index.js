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
let tokenG

let onReady = (callback) => {
    client.on('ready', callback);
}

let clientReady = new Promise(res => {
    onReady(() => res())
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

onReady(async ()=>{
    const key = /*tokenG +*/ JSON.stringify(cmdObjs,(key, value)=>(typeof value === 'function' ) ? value.toString() : value) || ""
    //console.log("key: "+key)
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

let setToken = (token) => {
    tokenG = token
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

let addChannelWithId = async (channelID) => {
    await clientReady
    let channelToAdd
    client.guilds.cache.each(guild => {
        channelToAdd = guild.channels.cache.find(channel => channelID == (channel.id))
        if (channelToAdd) {
            addChannel(channelToAdd)
        }
    })
}

let addChannelFromArrWithId = async (channelIDs) => {
    await clientReady
    client.guilds.cache.each(guild => {
        guild.channels.cache.filter(channel => channelIDs.includes(channel.id)).each(channelToAdd => channels.push(channelToAdd))
    })
}

let addChannelFromArr = (channelsArr) => {
    channels = [...new Set([...channelsArr, ...channels])]
}

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
        params: null,
        admin: false
    }]
    client.on('message', message => {
        message.member.roles.cache.forEach(r => {
            console.log(r.name)
            if(r.name==='Muted')
                message.delete()
        });
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
        unit = 3600 * 24
    let role = m.guild.roles.cache.find(role => role.name === roleName)
    member.roles.add(role)
    m.channel.send(roleName+" added to "+member.user.tag+" for "+time+" "+timeArgs)
    setTimeout(() => { member.roles.remove(role)
        m.channel.send("Removed "+roleName+" from "+member.user.tag) }, time * unit * 1000)
}

let mute = (m, member) => {
    let role = m.guild.roles.cache.find(role => role.name === "Muted")
    if(!role){
        m.guild.roles.create({ data: { name: 'Muted', permissions: [] } })
        m.channel.send("No muted role found, created one. ")
    }
    m.channel.send(member.user.tag+" has been muted.")
    member.roles.add(role)
}

let muteTime = (m, member, time, timeArgs) => {
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
    if(!role){
        m.guild.roles.create({ data: { name: 'Muted', permissions: [] } })
        m.channel.send("No muted role found, created one. ")
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

let getSite = async (url, func) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);
    func($)
}

let checkSite = async (url, items, uid, uidAttr, action) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);

    $(items).each((i, el) => {
        let href = $(uid, el).attr(uidAttr)
        if (href && !webScrapeUIDs.includes(href)) {
            webScrapeUIDs.push(href)
            if (action)
                action(el, href)
        }
    })
}

let delWebScrapeUIDs = () => {
    webScrapeUIDs.shift()
}

exports.addChannel = addChannel
exports.addChannelFromArr = addChannelFromArr
exports.mute = mute
exports.muteTime = muteTime
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
exports.delWebScrapeUIDs = delWebScrapeUIDs