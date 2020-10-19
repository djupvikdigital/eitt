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

function turnAssign(){
    let hasTurn = false;
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        if (currentSocket.hasTurn) hasTurn = true;
        currentSocket.emit('lastPlayed',lastPlayedCard);
    }
    if (!hasTurn) {
        let ids = Object.keys(SOCKET_LIST);
        let randomId = ids[Math.floor(Math.random() * ids.length)];
        SOCKET_LIST[randomId].hasTurn = true;
    }
}

function turnSwitch(){
    let nextPlayer = 0;
    let nextPlayerTurn = 99;
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        nextPlayer++;
        if (nextPlayer > (Object.keys(SOCKET_LIST).length - 1)) nextPlayer = 0;
        if (currentSocket.hasTurn){
            nextPlayerTurn = nextPlayer;
            currentSocket.hasTurn = false;
        }
    }
    nextPlayer = 0;
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        if (nextPlayer == nextPlayerTurn) {
            currentSocket.hasTurn = true;
        }
        nextPlayer++;
    }


}

function sendPlayerList(){
    var pack = [];
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        pack.push({
            name:currentSocket.name,
            hasTurn:currentSocket.hasTurn  
        });
    }
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        currentSocket.emit('playerList',pack);
    }
}


let io = socketio(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    socket.name = "Unnamed";
    SOCKET_LIST[socket.id] = socket;
    console.log(Object.keys(SOCKET_LIST).length);
    console.log('socket connection');
    turnAssign();
    sendPlayerList();
    socket.on('playCard',function(data){
        
        function legitPlay(){
            console.log("Yay! Someone played a " + data.color + " " + data.value);
            for(var i in SOCKET_LIST){
                var currentSocket = SOCKET_LIST[i];
                currentSocket.emit('lastPlayed',data);
                }
            lastPlayedCard = data;
            turnSwitch();
            sendPlayerList();
        }

        function unlegitPlay(){
            console.log("Oh now! We've got a cheater over here! He tried to play a " + data.color + " " + data.value + " on top of a " + lastPlayedCard.color + " " + lastPlayedCard.value);
            socket.emit('unlegitPlay',data);
        }

        if (lastPlayedCard.color == data.color && socket.hasTurn) legitPlay();
        else if (lastPlayedCard.value == data.value && socket.hasTurn) legitPlay();
        else unlegitPlay();
    });

    socket.on('nameChanged',function(data){
        console.log('Socket id: ' + socket.id + " changed name to " + data);
        socket.name = data;
        sendPlayerList();
    });

    socket.on('disconnect',function(){
        turnSwitch();
        delete SOCKET_LIST[socket.id];
        console.log('socket disconnected');
        sendPlayerList();
    });
});
