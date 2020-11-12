let color = '#42ed70'
exports.setColor=(col)=>{
    color = col
}
exports.color = color

let checkChar=(text,max)=>{
    if(text&&text.length>max){
        if(isDebug)
            console.log(`${text} was ${text.length-max} characters too long for the embed.`)
        return [text.length, text.substring(0,max-3)+"..."]
    }
    return [text?text.length:0, text]
}

/*
params = {  //everything is optional
    title:'',
    desc:'',
    author:"Karthik & Franklin",
    authorLink:"",
    authorImg:"",
    color:'#42ed70',
    fields:[["title","value",true],["title","value",true]], // [titleStr,valueStr,isInline (optional)]
    footer: "Bot by Karthik & Franklin",
    footerImage: "",
    timestamp: false,
    thumbnail:"",
    image:"",
    keepPropsInOverflow:false,
    feildLimit:25,
    titleLink:''
}
*/

let setUpEmbed=(embed, params)=>{
    let charCount = 0
    if(params.title){
        let [countTitle, title] = checkChar(params.title,256)
        charCount+=countTitle
        embed.setTitle(title)
    }
    if(params.desc){
        let [countDesc, desc] = checkChar(params.desc,2048)
        charCount+=countDesc
        embed.setDescription(desc)
    }
    if(params.thumbnail)
        embed.setThumbnail(params.thumbnail)
    if(params.image)
        embed.setImage(params.image)
    if(params.timestamp)
        embed.setTimestamp()
    if(params.titleLink)
        embed.setURL(params.titleLink)
    if(params.author){
        let [countAuthor, author] = checkChar(params.author,256)
        charCount+=countAuthor
        embed.setAuthor(author, params.authorImg, params.authorLink)
    }
    if(params.footer !== ""){
        let [countFooter, footer] = checkChar(params.footer?params.footer:"Bot by Karthik & Franklin",2048)
        charCount+=countFooter
        embed.setFooter(footer, params.footerImage?params.footerImage:"")
    }
        return charCount
}

exports.embedArr=(params)=>{
    if(params==null)
        params = {}
    let embed = new Discord.MessageEmbed()
    embed.setColor(params.color?params.color:color)

    let charCount = setUpEmbed(embed,params)

    let embeds = []
    let fieldsAdded = 0
    if(params.fields)
        for(let field of params.fields){
            let msgLength = 0;
            let [countTitle, titleTxt] = checkChar(field[0],256-4);
            msgLength+=countTitle+4;
            let [countValue, valueTxt] = checkChar(field[1],1024);
            msgLength+=countValue;
            if(charCount+msgLength>6000||fieldsAdded==(params.feildLimit?params.feildLimit:25)){
                charCount=0
                fieldsAdded = 0
                embeds.push(embed)
                embed = new Discord.MessageEmbed()
                embed.setColor(params.color?params.color:color)
                if(params.keepPropsInOverflow){
                    charCount = setUpEmbed(embed,params)
                }
            }
            fieldsAdded++
            charCount+=msgLength
            embed.addField(`**${titleTxt}**`, valueTxt, field[2])
        }
    embeds.push(embed)
    return embeds
}


exports.sendEmbedsAsPages=async (embeds,channelToSend,target)=>{ //targetID ID of person who can respond (Optional)
    let embedPage = 0
    const numberOfEmbeds = embeds.length
    embeds.forEach((embed,i)=>embed.setFooter(`Page ${i+1} of ${numberOfEmbeds}`))
    const message = await channelToSend.send(embeds[embedPage])
    if(numberOfEmbeds!=1){
        listenForReaction(message,{'⬅':"prev",'➡':"next"},target,(reaction)=>{
            // console.log(reaction)
            if(reaction=="next"){
                if(embedPage<numberOfEmbeds-1)
                    embedPage++
            }else if(reaction=="prev"){
                if(embedPage>0)
                    embedPage--
            }else
                return;
            // console.log(embedPage)
            message.edit(embeds[embedPage])
        })
    } 
}