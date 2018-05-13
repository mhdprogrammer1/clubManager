

const Database = require("arangojs").Database;
const servers=require('../serverManagement/servers');
const db = new Database({
    url: servers.getDBServer()
});
db.useBasicAuth("root", "root");
db.useDatabase("clubManager");
var foxxSettings = db.collection("club_foxxy_settings");

module.exports = {
    getSettings: function () {
        var getFoxxSettings = foxxSettings.firstExample({});
    
        return getFoxxSettings;
    }
}
