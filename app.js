//express setup
let express = require('express');
const { disconnect } = require('process');
let app = express();
let serv = require('http').Server(app);

app.get('/',function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.');

let SOCKET_LIST = {};

let io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection');

    socket.on('playCard',function(data){
        console.log("Yay! Someone played a " + data.color + data.value)
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        console.log('socket disconnected');
    });
});