var config = require('../../config');
var checkAvailableServers=require('./checkAvailableServers');
var request = require('request');
const dbServers = config.dbServers;
var dbCur = 0;
const appServers = config.fileServers;
var appCur = 0;

module.exports = {
    getDBServer: function () {
        dbCur = (dbCur + 1) % dbServers.length;
        return dbServers[dbCur];
    },
    getApplicationServer: function () {
        appCur = (appCur + 1) % appServers.length;
        return appServers[appCur];
    }
};
