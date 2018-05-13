var express = require('express');
var router = express.Router();

module.exports = function (appSettings) {
    var namespaces = appSettings.socket.namespaces;
    //var notification_producer=require('../util/notificationProducer');
    router.get('/', function (req, res) {
        appSettings.socket.io.emit("test", "test")
        // notification_producer.publishMessageToQueue(req,res);
        console.log("get result........................" + JSON.stringify(req.body));
    });
    router.post('/publish', function (req, res) {
        var io = appSettings.socket.io;
        var data = req.body;
        var sockets = req.body.sockets;
        if (sockets) {
            for (let index = 0; index < sockets.length; index++) {
                const socket = sockets[index];
                io.to(socket.id).emit('tournament_addPlayer', data);
            }
            appSettings.taskProducer.publishMessageToQueue(appSettings,{ action: 'delete_socket', sockets: sockets, userId: data.userId })
        }
        // notification_producer.publishMessageToQueue(req,res);
        console.log("get result........................" + JSON.stringify(req.body));
        res.send({ succesed: true });
    });
    return router;
};
