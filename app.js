//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import socketio from 'socket.io';
import { fileURLToPath } from 'url';

import * as game from './client/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app = express();
let serv = http.Server(app);

app.get('/',function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.');

let SOCKET_LIST = {};

let lastPlayedCard = game.generateCard();

let io = socketio(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection');
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        currentSocket.emit('lastPlayed',lastPlayedCard);
    }

    socket.on('playCard',function(data){
        console.log("Yay! Someone played a " + data.color + " " + data.value);
        for(var i in SOCKET_LIST){
            var currentSocket = SOCKET_LIST[i];
            currentSocket.emit('lastPlayed',data);
        }
        lastPlayedCard = data;
    });

    socket.on('disconnect',function(){
        delete SOCKET_LIST[socket.id];
        console.log('socket disconnected');
    });
});
