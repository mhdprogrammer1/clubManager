var kafka = require('kafka-node');
config = require('../../../config.json');
var _ = require('underscore');
const kafkaOptions = {
    zkServer: config.zkServer[0],
    clientId: 'appTasks-' + process.pid,
    topics: { app_tasks: 'app_tasks' },
    producerOptions: {
        // Configuration for when to consider a message as acknowledged, default 1
        requireAcks: 1,
        // The amount of time in milliseconds to wait for all acks before considered, default 100ms
        ackTimeoutMs: 100,
        // Partitioner type (default = 0, random = 1, cyclic = 2, keyed = 3, custom = 4), default 2
        partitionerType: 3
    }
};
//#region Producer
var HighLevelProducer = kafka.HighLevelProducer,
    client = new kafka.Client(kafkaOptions.zkServer, kafkaOptions.clientId),
    producer = new HighLevelProducer(client, kafkaOptions.producerOptions);

client.once('connect', function () {
    client.loadMetadataForTopics([], function (error, results) {
        if (error) {
            return console.error(error);
        }
        client.refreshMetadata([kafkaOptions.topics.app_tasks], function (err) {
            // sendMessage();
        });
    });
});

producer.on('ready', function (data, sss, ddd) {
    console.log("Producer for countries is ready");
    // client.refreshMetadata();

});

producer.on('error', function (err) {
    console.error("Problem with producing Kafka message " + err);
})
//#endregion
function publishMessageToQueue() {

}
function delete_socket(appSettings, data) {
    var io = appSettings.socket.io;
    var checkData = { action: 'exist_socket_id', sockets: data.sockets };
    io.of('/').adapter.customRequest(checkData, function (err, replies) {
        if (!err) {
            var disconnectedSocketids = [];
            var flat = _.reduceRight(replies, function (a, b) { return a.concat(b); }, []);
            _.forEach(data.sockets, s => {
                var exist = _.find(flat, function (id) { return s.id == id });
                if (!exist) {
                    disconnectedSocketids.push(s);
                }
            });
            if (disconnectedSocketids.length > 0) {
                _.forEach(disconnectedSocketids, socket => {
                    var disConnectedData = { action: data.action, socketId: socket.id, userId: data.userId };
                    const buffer = new Buffer.from(JSON.stringify(disConnectedData));
                    var record = [
                        {
                            topic: "app_tasks",
                            key: disConnectedData.userId,
                            messages: buffer,// new kafka.KeyedMessage("key",buffer),
                            attributes: 1 /* Use GZip compression for the payload */
                        }
                    ];
                    producer.send(record, function (err, reqData) {
                        if (err) {
                            console.log("app tasks producer error " + err);
                        }
                    });
                });
            }
        }
    });


}
module.exports = {
    publishMessageToQueue: function (appSettings, data) {
        switch (appSettings, data.action) {
            case "delete_socket":
                delete_socket(appSettings, data);
                break;

            default:
                break;
        }

    }
}