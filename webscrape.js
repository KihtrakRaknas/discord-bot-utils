exports.getSite = async (url, func) => {
    const response = await got(url);
    const $ = cheerio.load(response.body);
    func($)
}

exports.checkSite = async (url, items, uid, uidAttr, action) => {
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

exports.delWebScrapeUIDs = () => {
    webScrapeUIDs.shift()
}