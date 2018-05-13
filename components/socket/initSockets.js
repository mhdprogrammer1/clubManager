var socketIo = require('socket.io'),
    socketioJwt = require("socketio-jwt"),
    redis = require('redis').createClient,
    request = require('request'),
    adapter = require('socket.io-redis'),
    config = require("../../config.json");
var _ = require('underscore');

const pub = redis("6379", config.redisServer[0], { auth_pass: "123456" });
const sub = redis("6379", config.redisServer[0], { auth_pass: "123456" });
module.exports = function (server, appSettings) {
    var socketIoObjects = appSettings;
    var settings = appSettings.settings;
    var io = appSettings.socket.io = socketIo(server);

    io.adapter(adapter({ pubClient: pub, subClient: sub, key: "sample" }));

    var autOptions = {
        secret: settings.jwt_secret,
        handshake: true
    }
    io.of('/').adapter.customHook = (data, cb) => {
        var result = [];
        switch (data.action) {
            case "exist_socket_id":
                if (data.sockets) {
                    _.forEach(data.sockets, socket => {
                        if (io.sockets.connected[socket.id]) {
                            result.push(socket.id);
                        }
                    });
                }
                break;
            default:
                break;
        }
        cb(result);
    }
    //#region socket.io jwt
    io.use(socketioJwt.authorize(autOptions));

    function addToDb(socket) {
        var options = {
            uri: config.dbServers[0] + '/_db/clubManager/club/user/connectSocket',
            method: 'POST',
            json: {
                userId: socket.decoded_token.uid,
                socketId: socket.id,
                socketData: {}
            }
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("body is" + JSON.stringify(body)) // Print the shortened url.
            }
        });

    }
    function deleteFromDb(socket) {
        var options = {
            uri: config.dbServers[0] + '/_db/clubManager/club/user/disconnectSocket',
            method: 'POST',
            json: {
                userId: socket.decoded_token.uid,
                socketId: socket.id
            }
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("body is" + JSON.stringify(body)) // Print the shortened url.
            }
        });

    }


    io.on('connection', function (socket) {
        addToDb(socket);
        // in socket.io < 1.0 
        // console.log('hello!', socket.handshake.decoded_token.name);
        // in socket.io 1.0 
        console.log('hello! ', socket.decoded_token.uid);

        socket.on('test', function (message) {
            var socket11 = socket;
            var result = message;
        })
        socket.on('disconnecting', (reason) => {
            deleteFromDb(socket)
            var res = 10;
        });


    })


    var menu = appSettings.socket.namespaces.menu = io.of('/menu');
    menu.use(socketioJwt.authorize(autOptions));

    var tournament = appSettings.socket.namespaces.tournament = io.of('/tournament');
    tournament.use(socketioJwt.authorize(autOptions));

    menu.on('connection', function (socket) {
        console.log('someone connected');
        console.log('hello! ', socket.decoded_token.uid);
    });
    tournament.on('connection', function (socket) {
        console.log('someone connected');
        console.log('hello! ', socket.decoded_token.uid);
    });


    //client side
    // var socket = io.connect('http://localhost:9000', {
    //   'query': 'token=' + your_jwt
    // });

    //#region client side error handeling
    // socket.on("error", function(error) {
    //   if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
    //     // redirect user to login page perhaps? 
    //     console.log("User's token has expired");
    //   }
    // });
    //#endregion

    //#endregion



    // 



    // io.on('connection', function (socket) {
    // socket.broadcast.emit("","");
    //   socket.on('name', (name) => {
    //     console.log(name + ' says hello!');
    //     io.emit('name', name);

    //   })
    // });

    // var chat = io
    //   .of('/tournament')
    //   .on('connection', function (socket) {
    //     // socket.emit('a message', {
    //     //   that: 'only'
    //     //   , '/chat': 'will get'
    //     // });
    //     // chat.emit('a message', {
    //     //   everyone: 'in'
    //     //   , '/chat': 'will get'
    //     // });
    //   });

    // var news = io
    //   .of('/news')
    //   .on('connection', function (socket) {
    //     socket.emit('item', { news: 'item' }, function (data) {
    //       //confirm client received data
    //       // socket.broadcast.emit("ss","sadas";)

    //     });
    //   });

    /**
     * Listen on provided port, on all network interfaces.
     */
}