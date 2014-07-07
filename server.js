var express = require("express");
var app = express();
var port = process.env.PORT || 3000;
var io = require('socket.io').listen(app.listen(port));
var Instagram = require('instagram-node-lib');
var http = require('http');
var request = ('request');
var intervalID;

var pub = __dirname + '/public',
    view = __dirname + '/views';

var clientID = '9fedd28bb93042eead2d31377e16d374',
    clientSecret = '53c775ce624742b0a8f6f3a4fe7b596a';

Instagram.set('client_id', clientID);
Instagram.set('client_secret', clientSecret);
Instagram.set('callback_url', 'http://goproexp.herokuapp.com/callback');
Instagram.set('redirect_uri', 'http://goproexp.herokuapp.com');
Instagram.set('maxSockets', 10);


Instagram.subscriptions.subscribe({ object: 'tag',  object_id: 'gopro' });


// if you want to unsubscribe to any hashtag you subscribe
// just need to pass the ID Instagram send as response to you
// Instagram.subscriptions.unsubscribe({ id: '3668016' });

// https://devcenter.heroku.com/articles/using-socket-io-with-node-js-on-heroku
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

/**
 * Set your app main configuration
 */
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(pub));
    app.use(express.static(view));
    app.use(express.errorHandler());
});

app.get("/views", function(req, res){
    res.render("index");
});

io.sockets.on('connection', function (socket) {
  Instagram.tags.recent({
      name: 'gopro',
      complete: function(data) {
        socket.emit('firstShow', { firstShow: data });
      }
  });
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
