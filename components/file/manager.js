var fs = require('fs');
var multer = require('multer');
var jwt = require('express-jwt');

function baseAddresses(baseAdress) {
    // always initialize all instance properties
    this.base = baseAdress;
    this.user = this.base + "users\\";
    this.profile = this.user + "profile\\";
    this.post = this.user + "post\\";
    this.tornament = this.user + "tornament\\";

    this.admin = this.base + "_admin\\";
    this.category = this.admin + "category"
}

const baseAdress = new baseAddresses("c:\\clubFiles\\");


function createDirIfNotExsist(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

for (const key in baseAdress) {
    if (baseAdress.hasOwnProperty(key)) {
        const element = baseAdress[key];
        createDirIfNotExsist(element)
    }
}
var getUserId = function (req) {
    var splitedUserId = req.user.uid.split('/');
    return splitedUserId[splitedUserId.length - 1];
}
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var userId = getUserId(req);
        var dir = baseAdress[file.fieldname] + userId + "\\";
        req.fileDate = { dir: dir };
        createDirIfNotExsist(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        var userId = getUserId(req);
        var fileName = Date.now() + "-" + file.originalname;
        req.fileDate.fileName = fileName;
        req.fileDate.mimetype = file.mimetype;
        cb(null, fileName)
    }
})
var uploader = multer({ storage: storage });

module.exports={
    uploader:uploader

};