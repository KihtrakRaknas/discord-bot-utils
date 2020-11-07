let writeFunc;
let readFunc;
exports.initDB = (type, setUpObj)=>{
    if(type == "repl"){
        /*
            {
                cleanKeys:false //optional
            }
        */
        const Database = require("@replit/database")
        const db = new Database()
        let cleanKey = (key)=>{
            return key.split("#").join(" ")
        }
        let replWrite=(key,value)=>{
            if(setUpObj.cleanKeys)
                key = cleanKey(key)
            if(typeof value != "object")
                return replWriteHelper(key,value)
            return replWriteHelper(key,JSON.stringify(value))
        }

        let replWriteHelper = (key,value)=>{
            return db.set(key,value).then(()=>{
                if(isDebug)
                    db.get(key).then(currValue=>{
                        if(value != currValue)
                            console.log(`Database not updated. Key: ${key}; Value: ${value}`)
                    })
            })
        }

        let replRead=(key)=>{
            if(setUpObj.cleanKeys)
                key = cleanKey(key)
            return db.get(key).then(value=>{
                try{
                    return JSON.parse(value)
                }catch(e){
                    return value
                }
            })
        }

        exports.dbIncrement = (key,inc)=>{
            return replRead(key).then(val=>replWrite(key,(val&&(typeof val == "number"|| typeof val == "string"))?(val+inc):inc)) 
        }

        writeFunc = replWrite
        readFunc = replRead
    }else if(type == "sheets"){
        /*  SETUPOBJ SCHEMA
        {
            key: "asdfgasdfgjasdj",
            sheetIndex: 0, //optional
            
        }
        */
        const { GoogleSpreadsheet } = require('google-spreadsheet');
        const doc = new GoogleSpreadsheet(setUpObj.key);
        (async ()=>{
            await doc.useServiceAccountAuth({
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL||GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: (process.env.GOOGLE_PRIVATE_KEY||GOOGLE_PRIVATE_KEY).replace(/\\n/g, "\n"),
            });
            await doc.loadInfo()
            monthlySheet = doc.sheetsByIndex[setUpObj.sheetIndex?setUpObj.sheetIndex:0];
        })()
    }
    
}

exports.dbWrite = (key,value)=>{
    return writeFunc(key,value)
}

exports.dbRead = (key)=>{
    return readFunc(key)
}