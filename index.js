// LiteLoader-AIDS automatic generated
/// <reference path="d:\游戏\MCBE Ser Dev\vscode/dts/HelperLib-master/src/index.d.ts"/> 

ll.registerPlugin(
    "OnlineWhiteList",
    "在线白名单插件",
    [0,0,1],
    { "Author": "OWOSerDev" }
)
logger.setTitle("OnlineWhiteList")

require("./WebServer")
const fs = require("fs")
const cfg = require("./config.json")

mc.listen("onPreJoin", (pl) => {
    const WL = JSON.parse(fs.readFileSync(__dirname + cfg.allowListPath))
    const inWL = WL.find(i => i.name == pl.name)

    if(!inWL) {
        pl.kick("你未在白名单内，请联系管理申请！")

        return false;
    }
})