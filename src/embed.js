let color = '#42ed70'
exports.setColor=(col)=>{
    color = col
}
exports.color = color

let checkChar=(text,max)=>{
    if(text&&text.length>max){
        if(isDebug)
            console.log(`${text} was ${text.length-max} characters too long for the embed.`)
        return [text.substring(0,max-3)+"...",text.length]
    }
    return [text,text?text.length:0]
}

/*
params = {  //everything is optional
    title:'',
    desc:'',
    author:"Karthik & Franklin",
    authorLink:"",
    authorImg:"",
    color:'#42ed70' 
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
    let [count, txt] = checkChar(params.color,256)
    charCount+=count
    embed.setTitle(txt)

    [count, txt] = checkChar(params.desc,2048)
    charCount+=count
    embed.setDescription(txt)

    if(params.thumbnail)
        embed.setThumbnail(params.thumbnail)
    if(params.image)
        embed.setImage(params.image)
    if(params.timestamp)
        embed.setTimestamp()

    [count, txt] = checkChar(params.author,256)
    charCount+=count
    embed.setAuthor(txt, params.authorImg, params.authorLink)

    [count, txt] = checkChar(params.footer?params.footer:"Bot by Karthik & Franklin",2048)
    charCount+=count
    if(footer !== "")
        embed.setFooter(txt, params.footerImage?params.footerImage:"")

    let embeds = []
    let fieldsAdded = 0
    if(params.fields)
        for(let field of params.fields){
            let msgLength = 0;
            [count, titleTxt] = checkChar(field[0],256-4);
            msgLength+=count+4;
            [count, valueTxt] = checkChar(field[1],1024);
            msgLength+=count;
            if(charCount+msgLength>6000||fieldsAdded==25){
                charCount=0
                fieldsAdded = 0
                embeds.push(embed)
                let embed = new Discord.MessageEmbed()
                embed.setColor(params.color?params.color:color)
            }
            fieldsAdded++
            charCount+=msgLength
            embed.addField(`**${titleTxt}**`, valueTxt, field[2])
        }
    embeds.push(embed)
    return embeds
}