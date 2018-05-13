var kafka = require('kafka-node');
config = require("../../..config.json");
const kafkaOptions = {
    zkServer:  config.zkServer[0],
    clientId: 'loadbalancer-' + process.pid,
    topics: { user_notification: 'user_notification' },
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
        client.refreshMetadata([kafkaOptions.topics.tournament], function (err) {
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

module.exports = {
    publishMessageToQueue: function (req, res) {

        var queueData = req.body;


        queueData.queueData = queueData.queueData || {};
        var userId = queueData.queueData.userId;
        queueData.queueData.queueName = queueData.queueName;
        queueData.queueData.queueId = queueData.queueId;
        const buffer = new Buffer.from(JSON.stringify(queueData.queueData));
        var record = [
            {
                topic: kafkaOptions.topics.user_notification,
                key: userId,
                messages: buffer,// new kafka.KeyedMessage("key",buffer),
                attributes: 1 /* Use GZip compression for the payload */
            }
        ];
        producer.send(record, function (err, data) {
            if (err) {
                resultValidate.successed = false;
                resultValidate.errorCode = 5;
                resultValidate.message = "خطا،لطفا دوباره سعی کنید";
                res.status(500);
            }
            res.send(resultValidate);
        });

    }
}