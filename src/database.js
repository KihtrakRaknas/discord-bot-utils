
exports.initDB = (type, setUpObj)=>{
    if(type == "repl"){
        /*
            {
                cleanKeys:false //optional
            }
        */

        if(!setUpObj)
         setUpObj={} 
        const Database = require("@replit/database")
        const db = new Database()
        let cleanKey = (key)=>{
            return key.split("#").join(" ")
        }
        exports.dbWrite = (key,value)=>{
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
                            console.log(`Database not updated. Key: ${key}; New Value: ${value}`)
                            console.log(`Current Value: ${currValue}`)
                    })
            })
        }

        exports.dbRead =(key)=>{
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

        exports.dbIncrement = (key, inc)=>{
            return exports.dbRead(key).then(val=>exports.dbWrite(key,(val&&(typeof val == "number"|| typeof val == "string"))?(val+inc):inc)) 
        }
        exports.dbPush = (key, newEl)=>{
            return exports.dbRead(key).then(val=>exports.dbWrite(key,(val&&typeof val == "object")?[...val, newEl]:[newEl])) 
        }
        exports.dbPushMulti = (key, newEls)=>{
            return exports.dbRead(key).then(val=>exports.dbWrite(key,(val&&typeof val == "object")?[...val, ...newEls]:[...newEls])) 
        }
        exports.dbUpdateObj = (key, newEls)=>{
            return exports.dbRead(key).then(val=>exports.dbWrite(key,(val&&typeof val == "object")?{...val, ...newEls}:newEls)) 
        }
        exports.dbIncrementObj = (key, newEls)=>{
            return exports.dbRead(key).then(val=>{
                if(!val||!typeof val == "object")
                    val = {}
                for(let key in newEls){
                    if(!val[key])
                        val[key] = 0
                    val[key] += newEls[key]
                }
                exports.dbWrite(key,val)
            })
        }
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