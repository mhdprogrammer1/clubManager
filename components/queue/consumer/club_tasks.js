var kafka = require('kafka-node'),
    http = require('http'),
    request = require('request'),
    Database = require("arangojs").Database,
    config = require("../../../config.json");


module.exports = function (appSettings) {
    var io = appSettings.socket.io;
    var namespaces = appSettings.socket.namespaces;
    var ConsumerGroup = kafka.ConsumerGroup;
    consumer = new ConsumerGroup({

        host: config.zkServer[0],  // zookeeper host omit if connecting directly to broker (see kafkaHost below)
        kafkaHost: config.kafkaServer[0], // connect directly to kafka broker (instantiates a KafkaClient)
        zk: undefined,   // put client zk settings if you need them (see Client)
        batch: undefined, // put client batch settings if you need them (see Client)
        ssl: true, // optional (defaults to false) or tls options hash
        groupId: "group1",
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
    }, ['club_tasks']);


    consumer.on('message', function (message) {
        var buf = new Buffer(message.value, "binary");
        var decodedMessage = JSON.parse(buf.toString());
        switch (decodedMessage.action) {
            case "change_rate":
                updateRateInfo(decodedMessage);
                break;
            case "add_follower":
            case "remove_follower":
                updateFollowerInfo(decodedMessage);
                break;
            case "add_following":
            case "remove_following":
                updateFollowingInfo(decodedMessage);
                break;
            default:
                break;
        }

    });
    consumer.on('error', function (err) {
        console.log(err);

    });
    consumer.on('offsetOutOfRange', function (err) { })

    function updateRateInfo(message) {
        var options = {
            uri: config.dbServers[0] + '/_db/clubManager/club/club/updateRateInfo',
            method: 'POST',
            json: message
        };
        request(options, function (error, response, body) {
            var result = body;
        });
    }
    function updateFollowerInfo(message) {
        var options = {
            uri: config.dbServers[0] + '/_db/clubManager/club/club/updateFollowerInfo',
            method: 'POST',
            json: message
        };
        request(options, function (error, response, body) {
            var result = body;
        });
    }
    function updateFollowingInfo(message) {
        var options = {
            uri: config.dbServers[0] + '/_db/clubManager/club/club/updateFollowingInfo',
            method: 'POST',
            json: message
        };
        request(options, function (error, response, body) {
            var result = body;
        });
    }
}