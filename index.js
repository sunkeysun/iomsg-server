/**
 * 消息服务器入口文件
 *
 * @author: sunkey
 */

var MsgServer = function() {
    // 加密模块
    var Crypto = require('crypto');

    // Url解析
    var Url = require('url');

    // 配置模块
    var config = require('./config');

    // Http 实例
    var app = null;

    // Socket.io实例
    var io = null;;

    /**
     * 服务器实例初始化
     * @return null
     */
    this.run = function() {
        // 初始化http服务器
        initHttpServer();

        // 初始化socket.io服务器
        initIOServer();
    };

    /**
     * http报文处理函数
     * @param Request req 请求对象
     * @param Response res 响应对象
     * @return null
     */
    var httpHandler = function(req, res) {
        var data = Url.parse(req.url, true).query;

        if (!data.channel) {
            return false;
        }

        var sign = getSign(data)

        if (!data.sign || data.sign != sign) {
            return false;
        }

        delete data.sign;

        // 向指定频道推送消息
        io.to(data.channel).emit('msg', data);
    };

    /**
     * 获取签名
     * @param  json data 原始数据
     * @return string
     */
    var getSign = function(data) {
        var keyArr = [];
        var sortData = {};
        var signString = '';
        var sha1 = Crypto.createHash('sha1');

        for (var key in data) {
            if (key != 'sign') {
                keyArr.push(key);
            }
        }

        keyArr.sort();


        for (var i in keyArr) {
            signString += keyArr[i] + '=' + data[keyArr[i]] + '&';
        }

        signString += 'key=' + config.key;

        sha1.update(signString);
        sign = sha1.digest('hex');

        return sign;
    };

    /**
     * 初始化Http服务器
     * @return null
     */
    var initHttpServer = function() {
        app = require('http').createServer(httpHandler);
        app.listen(config.port);

        console.log('Server listen on ' + config.port);
    };

    /**
     * 初始化IO服务器
     * @return null
     */
    var initIOServer = function() {
        io = require('socket.io')(app);

        io.on('connection', function(socket) {
            var channel = socket.handshake.query.channel;
            if (!channel) {
                return false;
            }
            // 加入房间
            socket.join(channel);
        });
    };
};

// 启动服务器
(new MsgServer()).run();
