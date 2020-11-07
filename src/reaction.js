let generateEmojiDesc = (m, emojiObj) => {
    let output = '\n'
    for (let emoji in emojiObj) {
        output += `\n${emoji} -> **${emojiObj[emoji]}**`
    }
    return output
}

//TODO use listenForReaction for this func
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

let listenForReaction = (message,emojiObj,id,callback)=>{//user.id (optional)
    const emojiArr = Object.keys(emojiObj)
    for (let emoji of emojiArr)
        message.react(emoji)
    const collector = message.createReactionCollector((reaction, user) =>(emojiArr.includes(reaction.emoji.name) && (id == null || user.id === id)), { time: 60000 })
    collector.on('collect', (reaction, user) => {
        if (reaction.count > 1) {
            callback(emojiObj[reaction.emoji.name],user)
        }
    });
}

exports.getSelection = async (message, emojisObj, sendMedium) => {
    return askWithReactions(await sendMedium.send(message + generateEmojiDesc(emojisObj)), emojisObj)
}