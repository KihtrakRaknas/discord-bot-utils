const cheerio = require('cheerio');
//const got = require('got');
let webScrapeUIDs = null
exports.getSite = async (url, func) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);
    func($)
}

exports.checkSite = async (url, items, uid, uidAttr, action) => {
    if(!webScrapeUIDs){
        let webscrapeArr = null
        if(exports.dbRead)
            webscrapeArr = await exports.dbRead("webScrapeUIDs-package-var")
        else if(isDebug)
            console.log(`Tried to read from webScrapeUIDs-package-var but no DB init`)
        webScrapeUIDs = webscrapeArr?webscrapeArr:[]
    }
         
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
    if(exports.dbWrite)
        exports.dbWrite("webScrapeUIDs-package-var",webScrapeUIDs)
    else if(isDebug)
        console.log(`Tried to write to webScrapeUIDs-package-var but no DB init`)
}

exports.delWebScrapeUIDs = () => {
    webScrapeUIDs.shift()
}