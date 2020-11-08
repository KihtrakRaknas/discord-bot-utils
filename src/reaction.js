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

let listenForReaction = (message,emojiObj,target,callback)=>{//target is a user obj (optional)
    const emojiArr = Object.keys(emojiObj)
    for (let emoji of emojiArr)
        message.react(emoji)
    const collector = message.createReactionCollector((reaction, user) =>(emojiArr.includes(reaction.emoji.name) && (target == null || user.id === target.id)), { time: 60000, dispose: true })
    let old = {}
    let reactionUpdated = (reaction, user) => {  
        if(emojiArr.includes(reaction.emoji.name)){
            if(old[reaction.emoji.name]!=reaction.count){
                callback(emojiObj[reaction.emoji.name],user)
            }
            old[reaction.emoji.name] = reaction.count
        }
    }
    collector.on('collect', reactionUpdated);
    collector.on('remove', reactionUpdated);
}

exports.getSelection = async (message, emojisObj, sendMedium) => {
    return askWithReactions(await sendMedium.send(message + generateEmojiDesc(emojisObj)), emojisObj)
}