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
}
*/

exports.embedArr=(params)=>{
    if(params==null)
        params = {}
    let embed = new Discord.MessageEmbed()
    embed.setColor(params.color?params.color:color)

    let charCount = 0
    let [countTitle, title] = checkChar(params.title,256)
    charCount+=countTitle
    embed.setTitle(title)

    let [countDesc, desc] = checkChar(params.desc,2048)
    charCount+=countDesc
    embed.setDescription(desc)

    if(params.thumbnail)
        embed.setThumbnail(params.thumbnail)
    if(params.image)
        embed.setImage(params.image)
    if(params.timestamp)
        embed.setTimestamp()

    let [countAuthor, author] = checkChar(params.author,256)
    charCount+=countAuthor
    embed.setAuthor(author, params.authorImg, params.authorLink)

    let [countFooter, footer] = checkChar(params.footer?params.footer:"Bot by Karthik & Franklin",2048)
    charCount+=countFooter
    if(footer !== "")
        embed.setFooter(footer, params.footerImage?params.footerImage:"")

    let embeds = []
    let fieldsAdded = 0
    if(params.fields)
        for(let field of params.fields){
            let msgLength = 0;
            let [countTitle, titleTxt] = checkChar(field[0],256-4);
            msgLength+=countTitle+4;
            let [countValue, valueTxt] = checkChar(field[1],1024);
            msgLength+=countValue;
            if(charCount+msgLength>6000||fieldsAdded==25){
                charCount=0
                fieldsAdded = 0
                embeds.push(embed)
                embed = new Discord.MessageEmbed()
                embed.setColor(params.color?params.color:color)
            }
            fieldsAdded++
            charCount+=msgLength
            embed.addField(`**${titleTxt}**`, valueTxt, field[2])
        }
    embeds.push(embed)
    return embeds
}

exports.embedWithPages=(params,targetID)=>{ //targetID ID of person who can respond (Optional)
    const embeds = exports.embedArr(params)
    let embedPage = 0
    listenForReaction(embeds,{'➡':"next",'⬅':"prev"},targetID,(reaction)=>{
        if(reaction=="next")
            if(embedPage<embeds.length-1)
                embedPage++
        else if(reaction=="prev")
            if(embedPage>0)
                embedPage--
    })
}