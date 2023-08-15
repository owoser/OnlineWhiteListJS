// 模块导入
const express = require("express")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const mysql = require("mysql")
const jwt = require("jsonwebtoken")
const cfg = require("./config.json")
const fs = require("fs")

// 实例化类和常量
const app = express()
const conn = mysql.createConnection(cfg.db)
      conn.connect(err => {
        if(err) logger.error("数据库连接失败 " + err)
      })
const SECRET = cfg.web.secret
const WLPath = __dirname + cfg.allowListPath

// Express 使用中间件
app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(cookieParser())

// 验证中间件
const Auth = (req, res, next) => {
    const token = req.cookies._LOVE

    if(token === undefined) {
        res.status(401).send({
            "state": "CheckAuthorizationFailed",
            "result": "未提供 Token 导致检查验证失败"
        })

        return;
    }

    const { user } = jwt.verify(token, SECRET)

    if(user === cfg.web.user) {
        next()
    } else {
        res.status(401).send({
            "state": "CheckAuthorizationFailed",
            "result": "检查验证失败"
        })
    }
}

// 静态页面开放
app.use("/", express.static(__dirname + "/web"))
app.get("/", (req, res) => res.sendFile("/web/index.html", { root: __dirname }))
app.get("/admin", (req, res) => res.sendFile("/web/admin.html", { root: __dirname }))

// 登录接口
app.post("/login", (req, res) => {
    const user = cfg.web.user
    const pass = cfg.web.pass

    if(req.body.user != user) {
        res.status(401).send({
            "state": "AuthorizationFailed",
            "result": "账号错误"
        })

        return;
    }

    if(req.body.password != pass) {
        res.status(401).send({
            "state": "AuthorizationFailed",
            "result": "密码错误"
        })

        return;
    }

    let token = jwt.sign({ user }, SECRET, { expiresIn: '2h' })

    res.cookie("_LOVE", token, { maxAge: 7200000 })
    res.send({
        "state": "AuthorizationSuccess",
        "result": "验证成功",
        "token": token
    })
})

// 查询申请玩家列表接口
app.get("/api/playerlist/state/:state", Auth, (req, res) => {
    const sql = "SELECT * FROM playerlist WHERE player_state = ?"
    let sqlParams = [ req.params.state ]

    execSql(res, sql, sqlParams, "Query")
})

// 增加申请玩家接口
app.post("/api/apply", (req, res) => {
    const checkSql = "SELECT id FROM playerlist WHERE player_id = ? AND player_email = ?"
    const insertSql = "INSERT INTO playerlist (player_id, player_email, date) VALUES (?, ?, ?)"
    let sqlParams = [ req.body.plID, req.body.plEmail ]

    conn.query(checkSql, sqlParams, (err, results) => {
        if(err) {
            logger.error("SQL::Insert::CheckExists::ERROR")
            logger.error(err)

            res.status(422).send({
                "state": "CheckExistsErr",
                "result": {
                    "code": err.code,
                    "errno": err.errno
                }
            })

            return;
        }

        if(results.length) {
            res.send({ "state": "CheckExistsYes", "result": "已存在数据" })

            return;
        }

        sqlParams.push(formatDate(new Date(), 'yyyy-mm-dd'))
        execSql(res, insertSql, sqlParams, "Insert")
    })
})

// 更新玩家状态接口
app.patch("/api/player/:id", Auth, (req, res) => {
    const id = req.params.id
    const plID = req.body.plID
    const plState = req.body.plState
    const sql = "UPDATE playerlist SET player_state = ? WHERE id = ?"
    let sqlParams = [ plState, id ]

    execSql(res, sql, sqlParams, "Update")

    let WL = JSON.parse(fs.readFileSync(WLPath, "utf-8"))
    switch(plState) {
        case 0:
            let newJson = WL.filter(i => i.name != plID)
            if(WL.toString() != newJson.toString()) fs.writeFile(WLPath, JSON.stringify(newJson), "utf-8", (err, written) => {})
            break;
        case 1:
            WL.push({ name: plID })
            fs.writeFile(WLPath, JSON.stringify(WL), "utf-8", (err, written) => {})
            break;
    }
})

// 删除玩家数据接口
app.delete("/api/player/:id", Auth, (req, res) => {
    const id = req.params.id
    const plID = req.body.plID
    const sql = "DELETE FROM playerlist WHERE id = ?"
    let sqlParams = [ id ]

    execSql(res, sql, sqlParams, "Delete")

    let WL = JSON.parse(fs.readFileSync(WLPath, "utf-8"))
    let newJson = WL.filter(i => i.name != plID)
    if(WL.toString() != newJson.toString()) fs.writeFile(WLPath, JSON.stringify(newJson), "utf-8", (err, written) => {})
})

// 开始监听
app.listen(cfg.web.port, cfg.web.addr, () => logger.info(`HTTP 服务端启动成功，地址为 http://${cfg.web.addr}:${cfg.web.port}`))


// 日期格式化方法
function formatDate(date, format) {
    const map = {
        yyyy: date.getFullYear(),
        mm: date.getMonth() + 1,
        dd: date.getDate()
    }

    return format.replace(/yyyy|mm|dd/gi, matched => map[matched])
}


// SQL执行方法
function execSql(res, sql, sqlParams, type) {
    conn.query(sql, sqlParams, (err, results) => {
        if(err) {
            logger.error("SQL::" + type + "::ERROR")
            logger.error(err)

            res.state(422).send({
                "state": "ExecSQLErr",
                "result": {
                    "code": err.code,
                    "errno": err.errno
                }
            })

            return;
        }

        res.send({ "state": "ExecSQLSucc", "result": results })
    })
}