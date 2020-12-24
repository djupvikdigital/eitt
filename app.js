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

let ROOM_LIST = [];
ROOM_LIST.mainlobby = [];
ROOM_LIST.mainlobby.push('mainlobby');

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

let playerFName = ['attractive', 'bald', 'beautiful', 'chubby', 'clean', 'dazzling', 'drab', 'elegant', 'fancy', 'fit', 'flabby', 'glamorous', 'gorgeous', 'handsome', 'long', 'magnificent', 'muscular', 'plain', 'plump', 'quaint', 'scruffy', 'shapely', 'short', 'skinny', 'stocky', 'ugly', 'unkempt', 'unsightly']
let playerBName = ["people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president"]

function pickRand(array) {
    let rand = array[(Math.random() * array.length) | 0]
    return rand
}

let io = socketio(serv,{});
io.sockets.on('connection', function(socket){
    let cards = [];
    for (let i = 0; i < 7; i++) {
        cards.push(game.generateCard());
    }
    socket.cards = cards;
    socket.id = Math.random();

    let bName = pickRand(playerBName)
    bName = bName.charAt(0).toUpperCase() + bName.slice(1)
    socket.name = pickRand(playerFName) + bName

    SOCKET_LIST[socket.id] = socket;
    console.log('socket connection');

    ROOM_LIST.mainlobby.push(socket.id);
    console.log(ROOM_LIST);
    socket.room = 'mainlobby'
    socket.emit('joinRoom', 'mainlobby')

    turnAssign();
    sendGameStatus();

    socket.on('createNewRoom', function(data){
        for (let i in ROOM_LIST) {
            let room = ROOM_LIST[i];
            for (let o in room) {
                if (room[o] == socket.id) room.splice(o, 1);
            }
        }
        let roomExist = false;
        for (let i in ROOM_LIST) {
            let room = ROOM_LIST[i];
            if (room[0] == data) {
                roomExist = true;
                socket.emit('roomExists','')
            }
        }

        if (roomExist == false) {
            let newRoom = [];
            newRoom.push(data);
            newRoom.push(socket.id);
            ROOM_LIST.push(newRoom);
            socket.emit('joinRoom', data)
            console.log(ROOM_LIST);
        }
    })

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
        else if (data.color == 'black' && socket.hasTurn) legitPlay();
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
        if (socket.hasTurn) turnSwitch();
        delete SOCKET_LIST[socket.id];
        for (let i in ROOM_LIST) {
            let room = ROOM_LIST[i];
            for (let o in room) {
                if (room[o] == socket.id) room.splice(o, 1);
            }
        }
        console.log('socket disconnected');
        console.log(ROOM_LIST);
        sendGameStatus();
    });
});
