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
        const webscrapeArr = await exports.dbRead("webScrapeUIDs-package-var")
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
    exports.dbWrite("webScrapeUIDs-package-var",webScrapeUIDs)
}

exports.delWebScrapeUIDs = () => {
    webScrapeUIDs.shift()
}