var appSettings = { socket: { io: {}, namespaces: {} }, settings: {} };
const express = require('express'),
  config = require("./config.json"),
  path = require('path'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  jwt = require('express-jwt'),
  Database = require("arangojs").Database,
  http = require('http'),
  request = require('request'),
  settingsDA = require('./components/settings/settingsDA'),
  index = require('./components/index/index'),
  notifications = require('./components/notification/notificationService')(appSettings),
  socketInit = require('./components/socket/initSockets'),
  taskProducer = require('./components/queue/producer/appTasksProducer' ),
  files = require('./components/file/fileService'),
  tournament_addPlayer = require('./components/queue/consumer/tournament_addPlayer'),
  appTasksConsumer = require('./components/queue/consumer/appTasksConsumer'),
  club_TasksConsumer = require('./components/queue/consumer/club_tasks') 
  servers=require('./components/serverManagement/servers');
 
  

appSettings.taskProducer = taskProducer;
var app = express();
var port = normalizePort(process.env.PORT || '3001');
var server = app.listen(port);
server.on('error', onError);
server.on('listening', onListening);

var debug = require('debug')('filesystem:server');



app.use(express.static(path.join(__dirname, 'node_modules')));


settingsDA.getSettings().then(
  settings => {
    appSettings.settings = settings;
    socketInit(server, appSettings);
    console.log(appSettings.settings.jwt_secret);
    app.use(jwt({
      secret: appSettings.settings.jwt_secret,
      credentialsRequired: false,
      getToken: function fromHeaderOrQuerystring(req, res, next) {
        if (req.headers["x-session-id"]) {
          return req.headers["x-session-id"];
        } else if (req.query && req.query.token) {
          return req.query.token;
        }
        return null;
      }
    }));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/files', files);
    app.use('/notifications', notifications);
    app.use('/', index);
    tournament_addPlayer(appSettings);
    appTasksConsumer(appSettings);
    club_TasksConsumer(appSettings)
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(function (req, res, next) {
      var err = new Error('Not Found');
      err.status = 404;
      next(err);
    });
    app.use(function (err, req, res, next) {
      if (err.name === 'UnauthorizedError') {
        res.status(401).send({ successed: false, errorCode: 401, message: 'Not authenticated' });
      }
    });

    // error handler
    app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });
  });



function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}


function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}


function onListening(req, res) {
  var addr = server.address();

  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
  require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    var serverAddress = `http://${add}:${addr.port}`;
    console.log('addr: ' + serverAddress);
  })
}