var express = require('express');
var router = express.Router();
var qs = require('querystring');
var uploader=require('./manager').uploader;

router.get('/get/:id', function (req, res) {
    if (!req.user) return res.sendStatus(401);
    res.sendFile(req.params.id);
});

router.post('/profile', function (req, res) {
    if (!req.user) return res.sendStatus(401);
    uploader.single("profile")(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            return
        }
        var es = qs.escape(req.fileDate.dir + req.fileDate.fileName);
        res.send({ fileId: es });

    });
});

router.post('/post', function (req, res) {
    if (!req.user) return res.sendStatus(401);
    uploader.single("post")(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            return
        }
        var es = qs.escape(req.fileDate.dir + req.fileDate.fileName);
        res.send({ fileId: es });

    });
});

router.post('/tornament', function (req, res) {
    if (!req.user) return res.sendStatus(401);
    uploader.single("tornament")(req, res, function (err) {
        console.log(process.pid);
        if (err) {
            // An error occurred when uploading
            return
        }
        var es = qs.escape(req.fileDate.dir + req.fileDate.fileName);
        res.send({ fileId: es });

    });

});

router.post('/category', function (req, res) {
    if (!req.user) return res.sendStatus(401);
    uploader.single("category")(req, res, function (err) {
        if (err) {
            // An error occurred when uploading
            return
        }
        var es = qs.escape(req.fileDate.dir + req.fileDate.fileName);
        res.send({ fileId: es });
    });
});


module.exports = router;
