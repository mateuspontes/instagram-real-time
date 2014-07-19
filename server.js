var express = require("express");
var app = express();
var port = process.env.PORT || 80;
var io = require('socket.io').listen(app.listen(port));
var Instagram = require('instagram-node-lib');
var http = require('http');
var request = ('request');
var intervalID;

var pub = __dirname + '/public',
    view = __dirname + '/views';

var clientID = 'df8f2e7775d641ea85f6978c799c411b',
    clientSecret = 'dc9a9281ea8c49bf973f2a98576d7934';

io.configure(function () {
  io.set("transports", [
    'websocket'
    , 'xhr-polling'
    , 'flashsocket'
    , 'htmlfile'
    , 'jsonp-polling'
  ]);
  io.set("polling duration", 10);
});

Instagram.set('client_id', clientID);
Instagram.set('client_secret', clientSecret);
Instagram.set('callback_url', 'http://festpizza.herokuapp.com/callback');
Instagram.set('redirect_uri', 'http://festpizza.herokuapp.com');
Instagram.set('maxSockets', 10);

Instagram.subscriptions.subscribe({ object: 'tag',  object_id: 'festpizza' });

io.sockets.on('connection', function (socket) {
  Instagram.tags.recent({
    name: 'festpizza',
    complete: function(data) {
      socket.emit('firstShow', { firstShow: data });
    }
  });
});

//https://api.instagram.com/v1/subscriptions?client_secret=dc9a9281ea8c49bf973f2a98576d7934&client_id=df8f2e7775d641ea85f6978c799c411b
//curl -X DELETE 'https://api.instagram.com/v1/subscriptions?client_secret=dc9a9281ea8c49bf973f2a98576d7934&object=all&client_id=df8f2e7775d641ea85f6978c799c411b'
// Instagram.subscriptions.unsubscribe({ id: '3668016' });
// Instagram.subscriptions.unsubscribe({ id: '8158759' });

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(pub));
  app.use(express.static(view));
  app.use(express.errorHandler());
});

app.get('/callback', function(req, res){
    var handshake =  Instagram.subscriptions.handshake(req, res);
});

app.post('/callback', function(req, res) {
  console.log(req);
    var data = req.body;

    data.forEach(function(tag) {
      var url = 'https://api.instagram.com/v1/tags/' + tag.object_id + '/media/recent?client_id=' + clientID;
      io.sockets.emit('show', { show: url });
    });
    res.end();
});

console.log("Listening on port " + port);
