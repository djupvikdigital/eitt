var SOCKET_LIST = {};

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection');

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        console.log('socket disconnected');
    });
});