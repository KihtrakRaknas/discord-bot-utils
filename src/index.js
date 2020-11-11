const Discord = require('discord.js');
const client = new Discord.Client();
const got = require('got');
require('dotenv').config()
let channels = []
let prefix
let admins = []
let cmdObjs
let isDebug = false

exports.isDebug = isDebug
exports.channels = channels
exports.client = client
exports.admins = admins
exports.Discord = Discord


exports.onReady = (callback) => {
    client.on('ready', callback);
}

let clientReady = new Promise(res => {
    exports.onReady(() => res())
})
exports.clientReady = clientReady

exports.isDebug = ()=>{
    isDebug = true
}

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
            exports.addChannel(channelToAdd)
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

let sendHelpMsg = (message) => { // AUX function
    const newEmbed = new Discord.MessageEmbed().setTitle(`**Commands**`)
    for (let cmdObj of cmdObjs)
        if(!cmdObj["admin"]||(cmdObj["admin"] && admins.includes(message.author.id)))
            newEmbed.addField(`**${cmdObj["cmd"]?cmdObj["cmd"]:cmdObj["cmds"][0]}${cmdObj["admin"]?` (Admin Only)`:``}**`, cmdObj["desc"])
    message.reply(newEmbed)
}

exports.getUserFromMention = (mention) => {
	const matches = mention.match(/^<@!?(\d+)>$/);
	if (!matches) return;
	const id = matches[1];
	return client.users.cache.get(id);
}

exports.onMessage = (newCmdObjs) => {
    if(isDebug)
        newCmdObjs = [...newCmdObjs, {
            cmd: "dev",
            desc: "Contact the bot devs",
            exe: (message,args,params)=>{
                message.reply("Join a server with the devs here: https://discord.gg/kYDJ9sqpjT")
            },
            params: null,
            admin: false
        }]
    cmdObjs = [...newCmdObjs, {
        cmd: "help",
        desc: "This command!",
        exe: sendHelpMsg,
        params: null,
        admin: false
    }]
    client.on('message', message => {
        if(message.member&&message.member.roles)
            message.member.roles.cache.forEach(r => {
                if(r.name==='Muted')
                    message.delete()
            });
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        const args = message.content.slice(prefix.length).trim().split(' ');
        const command = args.shift().toLowerCase();
        const isAdmin = admins.includes(message.author.id)
        for (let cmdObj of cmdObjs) {
            if ((cmdObj["cmd"]&&cmdObj["cmd"].toLowerCase() == command)||(cmdObj["cmds"]&&cmdObj["cmds"].includes(command))) {
                if(!cmdObj["admin"] || isAdmin){
                    cmdObj["exe"](message, args, cmdObj["params"])
                }
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
    if(typeof role === 'undefined'){
        m.guild.roles.create({ data: { name: "Muted", permissions: [] } })
        m.channel.send("No muted role found, but I've created one. Please send the command again.")
    }
    else{
        m.channel.send(member.user.tag+" has been muted.")
        member.roles.add(role)
    }
}

exports.muteTime = (m, member, time, timeArgs) => {
    let unit = 1
    let longUnit='seconds'
    if (timeArgs.charAt(0) === 's'){
        unit = 1
        longUnit='seconds'
    }
    else if (timeArgs.charAt(0) === 'm'){
        unit=60
        longUnit='minutes'
    }
    else if (timeArgs.charAt(0) === 'h'){
        unit=3600
        longUnit='hours'
    }
    else if (timeArgs.charAt(0) === 'd'){
        unit = 3600 * 24
        longUnit='days'
    }
    else{
        m.channel.send("Invalid input. Using seconds as unit of time.")
    }
    let role = m.guild.roles.cache.find(role => role.name === "Muted")
    if(typeof role === 'undefined'){
        m.guild.roles.create({ data: { name: "Muted", permissions: [] } })
        m.channel.send("No muted role found, but I've created one. Please send the command again.")
    }
    else{
        member.roles.add(role)
    m.channel.send(member.user.tag+" has been muted for "+time+" "+longUnit)
    setTimeout(() => { member.roles.remove(role)
        m.channel.send(member.user.tag+" is no longer muted.") }, time * unit * 1000)
    }
}
