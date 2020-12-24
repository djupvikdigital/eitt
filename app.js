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

// number of +2 cards currently in play
let plusTwoInPlay = 0;

let turnRotation = 1;
let turnSkip = 1;

function drawCards(){
    let cards = [];
    let number = 1;
    if (plusTwoInPlay) {
        number = plusTwoInPlay * 2;
    }
    for (let i = 0; i < number; i++) {
        cards.push(game.generateCard());
    }
    return cards;
}

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
        if (currentSocket.hasTurn){
            nextPlayerTurn = nextPlayer + (1 * turnRotation * turnSkip);
            currentSocket.hasTurn = false;
            turnSkip = 1;
        }
        nextPlayer++;
    }
    if (nextPlayerTurn > (Object.keys(SOCKET_LIST).length - 1)) nextPlayerTurn = (nextPlayerTurn - (Object.keys(SOCKET_LIST).length - 1) - 1);
    if (nextPlayerTurn < 0) nextPlayerTurn = ((Object.keys(SOCKET_LIST).length) + nextPlayerTurn);
    nextPlayer = 0;
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        if (nextPlayer == nextPlayerTurn) {
            currentSocket.hasTurn = true;
        }
        nextPlayer++;
    }


}

function sendGameStatus(){
    let pack = [];
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        pack.push({
            name:currentSocket.name,
            numberOfCards:currentSocket.cards.length,
            hasTurn:currentSocket.hasTurn  
        });
    }
    for(var i in SOCKET_LIST){
        var currentSocket = SOCKET_LIST[i];
        let gameStatus = {
            cards: currentSocket.cards,
            hasTurn: currentSocket.hasTurn,
            playerList: pack,
        };
        currentSocket.emit('gameStatus',gameStatus);
    }
}


let io = socketio(serv,{});
io.sockets.on('connection', function(socket){
    let cards = [];
    for (let i = 0; i < 7; i++) {
        cards.push(game.generateCard());
    }
    socket.cards = cards;
    socket.id = Math.random();
    socket.name = "Unnamed";
    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection');
    turnAssign();
    sendGameStatus();

    socket.on('drawCards',function(){
        if (socket.hasTurn) {
            socket.cards = socket.cards.concat(drawCards());
            if (plusTwoInPlay > 0) {
                plusTwoInPlay = 0;
                turnSwitch();
            }
            sendGameStatus();
        }
    });

    socket.on('pass',function(){
        if (socket.hasTurn) {
            if (plusTwoInPlay > 0) {
                socket.cards = socket.cards.concat(drawCards());
                plusTwoInPlay = 0;
            }
            turnSwitch();
            sendGameStatus();
        }
    });

    socket.on('playCard',function(cardIndex){
        
        function legitPlay(){
            console.log("Yay! Someone played a " + data.color + " " + data.value);
            // remove played card from player cards
            socket.cards.splice(cardIndex, 1);
            for(var i in SOCKET_LIST){
                var currentSocket = SOCKET_LIST[i];
                currentSocket.emit('lastPlayed',data);
                }
            lastPlayedCard = data;
            if (data.value == '+2') plusTwoInPlay = plusTwoInPlay + 1;
            if (data.value == 'R') turnRotation = (turnRotation * -1);
            if (data.value == 'S') turnSkip = 2;
            turnSwitch();
            sendGameStatus();
        }

        function unlegitPlay(){
            console.log("Oh now! We've got a cheater over here! He tried to play a " + data.color + " " + data.value + " on top of a " + lastPlayedCard.color + " " + lastPlayedCard.value);
        }

        if (!(cardIndex < socket.cards.length)) {
            // we got invalid input
            console.log(cardIndex + ' is not in range');
            return;
        }
        let data = socket.cards[cardIndex];
        if (plusTwoInPlay > 0 && data.value != '+2') unlegitPlay();
        else if (lastPlayedCard.color == data.color && socket.hasTurn) legitPlay();
        else if (lastPlayedCard.value == data.value && socket.hasTurn) legitPlay();
        else unlegitPlay();
    });

    socket.on('nameChanged',function(data){
        if (data.length > 20) {
            data = data.slice(0, 20);
        }
        console.log('Socket id: ' + socket.id + " changed name to " + data);
        socket.name = data;
        sendGameStatus();
    });

    socket.on('disconnect',function(){
        turnSwitch();
        delete SOCKET_LIST[socket.id];
        console.log('socket disconnected');
        sendGameStatus();
    });
});
