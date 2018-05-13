var kafka = require('kafka-node'),
  http = require('http'),
  request = require('request'),
  Database = require("arangojs").Database,
  config = require("../../../config.json");
var _ = require('underscore');
var kue = require('kue');
var queue = kue.createQueue({
  jobEvents: false,
  prefix: 'q',
  redis: {
    port: 6379,
    host: config.redisServer[0],
    auth: '123456',
    db: 3, // if provided select a non-default redis db 
    // options: {
    //   // see https://github.com/mranney/node_redis#rediscreateclient 
    // }
  }
});

const db = new Database({
  url: config.dbServers[0]
});
db.useBasicAuth("root", "root");
db.useDatabase("clubManager");


module.exports = function (appSettings) {
  queue.process('chech_expire_tournament_addPlayer', function (job, done) {
    var data = job.data;
    var options = {
      uri: config.dbServers[0] + '/_db/clubManager/club/tournament/checkExpireAddPlayer',
      method: 'POST',
      json: data
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = body;
        if (data.successed) {
          _.forEach(data.result, res => {
            saveNotification(res);
          });
        }
        //#region send result

        //#endregion

      }
    });
  });

  var io = appSettings.socket.io;
  var namespaces = appSettings.socket.namespaces;
  var ConsumerGroup = kafka.ConsumerGroup;
  consumer = new ConsumerGroup({

    host: config.zkServer[0],  // zookeeper host omit if connecting directly to broker (see kafkaHost below)
    kafkaHost: config.kafkaServer[0], // connect directly to kafka broker (instantiates a KafkaClient)
    zk: undefined,   // put client zk settings if you need them (see Client)
    batch: undefined, // put client batch settings if you need them (see Client)
    ssl: true, // optional (defaults to false) or tls options hash
    groupId: config.tournament_addPlayserConsumerGroupId,
    sessionTimeout: 15000,
    // An array of partition assignment protocols ordered by preference.
    // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
    protocol: ['roundrobin'],

    // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
    // equivalent to Java client's auto.offset.reset
    fromOffset: 'latest', // default

    // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
    outOfRangeOffset: 'earliest', // default
    migrateHLC: false,    // for details please see Migration section below
    migrateRolling: true,
    // Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
    // isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
    onRebalance: (isAlreadyMember, callback) => { callback(); } // or null
  }, ['tournament_addPlayer']);

  consumer.on('message', function (message) {
    var buf = new Buffer(message.value, "binary");
    var decodedMessage = JSON.parse(buf.toString());
    console.log(message);
    sendTournamentPlayer(decodedMessage);
  });

  function sendTournamentPlayer(decodedMessage) {
    var options = {
      uri: config.dbServers[0] + '/_db/clubManager/club/tournament/addPlayerToQueue',
      method: 'POST',
      json: {
        menu: decodedMessage.menu,
        subMenu: decodedMessage.subMenu,
        action: decodedMessage.action,
        tournamentId: decodedMessage.actionId
        , user: {
          userId: decodedMessage.user.uid,
          currentClubId: decodedMessage.user.payload.currentClubId,
          defaultClubId: decodedMessage.user.payload.defaultClubId,
          // adminUserId:decodedMessage.user.payload.adminUser
        }
      }
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = body;
        var sockets = body.result.sockets;
        if (data.successed) {
          saveNotification(data.result, true);
        }
        //#region send result
        if (sockets) {
          for (let index = 0; index < sockets.length; index++) {
            const socket = sockets[index];
            io.to(socket.id).emit('tournament_addPlayer', data);
          }
          appSettings.taskProducer.publishMessageToQueue(appSettings, { action: 'delete_socket', sockets: sockets, userId: decodedMessage.user.uid })
        }
        //#endregion
        //#region checkExpire
        if (data.result.delay) {
          addNodeJsToQueue(data.result);
        }
        //#endregion
      }
    });
  }

  function addNodeJsToQueue(data) {
    var job = queue.create('chech_expire_tournament_addPlayer', {
      userId: data.userId,
      tournamentId: data.tournamentId,
      defaultClubId: data.user.defaultClubId,
      currentClubId: data.user.currentClubId,
      menu: data.menu,
      subMenu: data.subMenu,
      action: data.action,
      actionId: data.actionId
    }).delay(data.delay).save(function (err) {
      if (!err) console.log(job.id);
    });
  }

  function saveNotification(data, isSendResult) {
    var options = {
      uri: config.dbServers[0] + '/_db/clubManager/club/notification/save',
      method: 'POST',
      json: {
        isSendResult: isSendResult,
        lastState: data.lastStatus,
        date: data.date,
        user: data.user,
        _to: data._to,
        category: data.category,
        menu: data.menu,
        subMenu: data.subMenu,
        action: data.action,
        actionId: data.actionId,
        data: data.data
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = body;
        if (data.result.notifications && data.result.notifications.length > 0) {
          _.forEach(data.result.notifications, noti => {
            var sockets = noti.sockets;
            if (sockets) {
              for (let index = 0; index < sockets.length; index++) {
                const socket = sockets[index];
                io.to(socket.id).emit('tournament_addPlayer', data);
              }
            }
          });
        }
      }
    });
  }

  consumer.on('error', function (err) {
    console.log(err);

  });
  consumer.on('offsetOutOfRange', function (err) { })
}