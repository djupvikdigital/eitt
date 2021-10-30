//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import socketio from 'socket.io';
import { fileURLToPath } from 'url';

import { GameControler } from './server/GameControler.js'
import {Player} from './server/Player.js'

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

let SOCKET_LIST = {}

let PLAYER_LIST = {}

let ROOM_LIST = {}
ROOM_LIST['mainlobby'] = GameControler('mainlobby', PLAYER_LIST, ROOM_LIST)

let playerFName = ['attractive', 'bald', 'beautiful', 'chubby', 'clean', 'dazzling', 'drab', 'elegant', 'fancy', 'fit', 'flabby', 'glamorous', 'gorgeous', 'handsome', 'long', 'magnificent', 'muscular', 'plain', 'plump', 'quaint', 'scruffy', 'shapely', 'short', 'skinny', 'stocky', 'ugly', 'unkempt', 'unsightly']
let playerBName = ["people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president"]

function pickRand(array) {
    let rand = array[(Math.random() * array.length) | 0]
    return rand
}

let io = socketio(serv,{});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();

    let player = Player(socket.id, SOCKET_LIST)

    let bName = pickRand(playerBName)
    bName = bName.charAt(0).toUpperCase() + bName.slice(1)
    player.name = pickRand(playerFName) + bName

    SOCKET_LIST[socket.id] = socket
    PLAYER_LIST[socket.id] = player
    console.log('socket connection');

    ROOM_LIST.mainlobby.connected.push(socket.id)
    player.room = 'mainlobby'
    socket.emit('joinRoom', 'mainlobby')
    console.log(ROOM_LIST);

    ROOM_LIST.mainlobby.sendRoomStatus()

    socket.on('createNewRoom', function(data){
        let roomExist = false;
        for (let i in ROOM_LIST) {
            let room = ROOM_LIST[i].room
            if (room == data) {
                roomExist = true;
                socket.emit('roomExists','')
            }
        }

        if (roomExist == false) {
            for (let i in ROOM_LIST) {
                let room = ROOM_LIST[i].connected
                for (let j = 0; j < room.length; j++) {
                    if (room[j] == socket.id) room.splice(j, 1);
                }
            }
            let newGC = GameControler(data, PLAYER_LIST, ROOM_LIST)
            newGC.connected.push(socket.id)
            ROOM_LIST[data] = newGC
            player.room = data
            player.cards = newGC.dealCards()
            player.hasTurn = false
            socket.emit('joinRoom', data)
            newGC.turnAssign()
            newGC.sendGameStatus()
            ROOM_LIST.mainlobby.sendRoomStatus()
            console.log(ROOM_LIST);
        }
    })

    socket.on('joinRoom', function(data) {
        let roomExist = false;
        for (let i in ROOM_LIST) {
            let room = ROOM_LIST[i].room
            if (room == data) {
                roomExist = true;
            }
        }
        if (roomExist) {
            for (let i in ROOM_LIST) {
                let room = ROOM_LIST[i].connected
                for (let j = 0; j < room.length; j++) {
                    if (room[j] == socket.id) room.splice(j, 1);
                }
            }
            let room = ROOM_LIST[data]
            room.connected.push(socket.id)
            player.room = data
            player.cards = room.dealCards()
            player.hasTurn = false
            room.turnAssign()
            room.sendGameStatus()
            socket.emit('joinRoom', data)
            ROOM_LIST.mainlobby.sendRoomStatus()
            console.log(ROOM_LIST)
        }
    })

    socket.on('drawCards',function(){
        let room = ROOM_LIST[player.room]
        if (player.hasTurn && !player.hasDrawn) {
            let plusInPlay = room.plusFourInPlay || room.plusTwoInPlay > 0
            room.drawCards(player);
            player.pressedEitt = false
            if (!plusInPlay) {
                player.hasDrawn = true
            }
            room.sendGameStatus();
        }
    });

    socket.on('didntPressEitt', function(playerId) {
        let accusedPlayer = PLAYER_LIST[playerId]
        let room = ROOM_LIST[player.room]
        if (room.lastPlayerId === playerId && accusedPlayer.cards.length === 1 && accusedPlayer.pressedEitt == false) {
            room.drawCards(accusedPlayer, 3)
        }
        room.sendGameStatus()
    })

    socket.on('eitt', function() {
        let room = ROOM_LIST[player.room]
        if (player.cards.length <= 2) {
            player.pressedEitt = true
            room.sendGameStatus()
        }
    })

    socket.on('pass',function(){
        let room = ROOM_LIST[player.room]
        if (player.hasTurn && player.hasDrawn) {
            player.hasDrawn = false
            room.turnSwitch();
            room.sendGameStatus();
        }
    });

    socket.on('playCard',function(data){
        let room = ROOM_LIST[player.room]
        function legitPlay(){
            console.log("Yay! " + player.name + " played a " + card.color + " " + card.value + " in " + player.room);
            // remove played card from player cards
            player.cards.splice(data.index, 1);
            player.hasDrawn = false
            if (card.color == 'black') card.color = data.color;
            room.lastPlayerId = player.id
            room.playCard(card)
            if (player.cards.length === 0) {
                room.roundFinished = true
                room.roundWinner = player.name
            }
            room.turnSwitch();
            room.sendGameStatus();
        }

        function unlegitPlay(){
            console.log("Oh now! We've got a cheater over here! He tried to play a " + card.color + " " + card.value + " on top of a " + room.lastPlayedCard.color + " " + room.lastPlayedCard.value);
        }

        if (!(data.index < player.cards.length)) {
            // we got invalid input
            console.log(data.index + ' is not in range');
            return;
        }
        let card = player.cards[data.index];
        if (room.plusFourInPlay) unlegitPlay();
        else if (room.plusTwoInPlay > 0 && card.value != '+2') unlegitPlay();
        else if (card.color == 'black' && player.hasTurn) legitPlay();
        else if (room.lastPlayedCard.color == 'black' && player.hasTurn) legitPlay();
        else if (room.lastPlayedCard.color == card.color && player.hasTurn) legitPlay();
        else if (room.lastPlayedCard.value == card.value && player.hasTurn) legitPlay();
        else unlegitPlay();
    });

    socket.on('nameChanged',function(data){
        let room = ROOM_LIST[player.room]
        if (data.length > 20) {
            data = data.slice(0, 20);
        }
        console.log('Socket id: ' + socket.id + " changed name to " + data);
        player.name = data;
        room.sendGameStatus();
    });

    socket.on('disconnect',function(){
        let room = ROOM_LIST[player.room].room
        if (player.hasTurn) ROOM_LIST[player.room].turnSwitch();
        let goodbyeID = socket.id
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        for (let i = 0; i < ROOM_LIST[room].connected.length; i++) {
            if (ROOM_LIST[room].connected[i] == goodbyeID) ROOM_LIST[room].connected.splice(i, 1)
        }
        ROOM_LIST[room].sendGameStatus();
        console.log('socket disconnected');
        console.log(ROOM_LIST);
    });
});

