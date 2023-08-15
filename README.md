# OnlineWhiteListJS

在线白名单脚本插件，方便玩家和服主在 WEB 端进行申请和管理白名单。

### 依赖环境

- Node.js *(运行环境)*
- MySQL *(数据库)*
- Express 模块
- Mysql 模块

### 插件开发和打包

1. 克隆本仓库到本地目录，并执行 `npm i` 安装依赖；
2. 安装 MySQL 服务端，手动把仓库文件里的 sql 文件导入到 MySQL 后，回到配置文件 `config.json`，配置好 db 连接信息即可；
3. 完成开发后压缩除 `node_modules/` 目录外全部文件；
4. 重命名压缩包后缀 .zip 为 .llplugin 即可。

### 插件安装

1. 把 .llplugin 文件放入 `plugins/` 目录；
2. 配置好 `config.json` 文件开服即可。

### 其他说明

仓库的 `exampleAPI.http` 文件是用来进行接口开发时，方便在 VSCode 编辑器里直接调试接口的工具，需要安装 [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) 拓展。