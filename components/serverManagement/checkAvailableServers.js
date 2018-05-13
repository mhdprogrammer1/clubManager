var redis = require("redis").createClient;
var config=require('../../config.json');
const pub = redis("6379", config.redisServer[0], { auth_pass: "123456" });
const sub = redis("6379", config.redisServer[0], { auth_pass: "123456" });


sub.on("message", function (channel, message) {
    console.log("sub channel " + channel + ": " + message);
 
});
setTimeout(function(){
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
    pub.publish("aaa", "I am sending a message.");
},10000);
sub.subscribe("aaa");

 