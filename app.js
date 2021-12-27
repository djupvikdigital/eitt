//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

import { GameControler } from './server/GameControler.js'

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

let ROOM_LIST = {}
ROOM_LIST['mainlobby'] = GameControler('mainlobby', ROOM_LIST)

let playerFName = ['attractive', 'bald', 'beautiful', 'chubby', 'clean', 'dazzling', 'drab', 'elegant', 'fancy', 'fit', 'flabby', 'glamorous', 'gorgeous', 'handsome', 'long', 'magnificent', 'muscular', 'plain', 'plump', 'quaint', 'scruffy', 'shapely', 'short', 'skinny', 'stocky', 'ugly', 'unkempt', 'unsightly']
let playerBName = ["people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president"]

function pickRand(array) {
    let rand = array[(Math.random() * array.length) | 0]
    return rand
}

let io = new Server(serv,{});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();

    let bName = pickRand(playerBName)
    bName = bName.charAt(0).toUpperCase() + bName.slice(1)
    let name = pickRand(playerFName) + bName

    let style = {};
    style.body = '#47535a';
    style.head = '#f6d7d2';
    style.headGear = 0;

    SOCKET_LIST[socket.id] = socket
    console.log('socket connection');

    let room = ROOM_LIST.mainlobby
    room.connect(socket)
    socket.emit('joinRoom', { room: 'mainlobby' })
    console.log(ROOM_LIST);

    room.sendRoomStatus()

    socket.on('createNewRoom', function(data){
        let roomExist = false;
        if (data == '') return false;
        for (let i in ROOM_LIST) {
            let currentRoom = ROOM_LIST[i].room
            if (currentRoom == data) {
                roomExist = true;
                socket.emit('roomExists','')
            }
        }

        if (roomExist == false) {
            for (let i in ROOM_LIST) {
                ROOM_LIST[i].leave(socket.id)
                if (ROOM_LIST[i].getConnectedPlayers().length === 0 && i !== 'mainlobby') {
                    delete ROOM_LIST[i]
                }
            }
            room = GameControler(data, ROOM_LIST)
            let player = room.connect(socket)
            ROOM_LIST[data] = room
            player.cards = room.dealCards()
            player.name = name
            socket.emit('joinRoom', { playerId: player.id, room: data })
            room.sendGameStatus()
            ROOM_LIST.mainlobby.sendRoomStatus()
            console.log(ROOM_LIST);
        }
    })

    socket.on('joinRoom', function(data) {
        let roomExist = false;
        for (let i in ROOM_LIST) {
            let currentRoom = ROOM_LIST[i].room
            if (currentRoom == data.room) {
                roomExist = true;
            }
        }
        if (roomExist) {
            for (let i in ROOM_LIST) {
                ROOM_LIST[i].leave(socket.id)
                if (ROOM_LIST[i].getConnectedPlayers().length === 0 && i !== 'mainlobby') {
                    delete ROOM_LIST[i]
                }
            }
            room = ROOM_LIST[data.room]
            let player = room.connect(socket, data.playerId)
            if (player.cards.length === 0) {
                player.cards = room.dealCards()
            }
            if (!player.name) {
                player.name = name
            }
            room.sendGameStatus()
            socket.emit('joinRoom', { playerId: player.id, room: data.room })
            ROOM_LIST.mainlobby.sendRoomStatus()
            console.log(ROOM_LIST)
        }
    })

    socket.on('drawCards',function(){
        let player = room.getPlayerBySocketId(socket.id)
        room.drawCards(player);
    });

    socket.on('didntPressEitt', function(playerId) {
        let accusedPlayer = room.getPlayerByPlayerId(playerId)
        if (room.lastPlayerId === playerId && accusedPlayer.cards.length === 1 && accusedPlayer.pressedEitt == false) {
            room.drawCards(accusedPlayer, 3)
        }
    })

    socket.on('eitt', function() {
        let player = room.getPlayerBySocketId(socket.id)
        if (player.cards.length <= 2) {
            player.pressedEitt = true
            room.sendGameStatus()
        }
    })

    socket.on('pass',function(){
        let player = room.getPlayerBySocketId(socket.id)
        if (room.hasTurn(player) && player.hasDrawn) {
            player.hasDrawn = false
            room.turnSwitch();
            room.sendGameStatus();
        }
    });

    socket.on('checkPlusFour', function(){
        let player = room.getPlayerBySocketId(socket.id)
        room.checkPlusFour(player)
    })

    socket.on('playCard',function(data){
        let player = room.getPlayerBySocketId(socket.id)
        if (!player) {
            console.log('Player with socket id ' + socket.id + ' not found in room ' + room.room)
            console.log(JSON.stringify(room.players))
            return
        }
        function legitPlay(){
            console.log("Yay! " + player.name + " played a " + card.color + " " + card.value + " in " + room.room);
        }

        function unlegitPlay(){
            console.log("Oh now! We've got a cheater over here! He tried to play a " + card.color + " " + card.value + " on top of a " + room.lastPlayedCard.color + " " + room.lastPlayedCard.value);
        }

        let card = player.cards[data.index];
        if (room.playCardFromPlayer(player, data.index, data.color)) legitPlay();
        else unlegitPlay();
    });

    socket.on('nameChanged',function(data){
        if (data.name != '') {
            if (data.name.length > 20) {
                data.name = data.name.slice(0, 20);
            }
            console.log('Socket id: ' + socket.id + " changed name to " + data.name);
            name = data.name;
            room.sendGameStatus();
        }
        style.body = data.body;
        style.head = data.head;
        style.headGear = data.headGear
        console.log(style);
    });

    socket.on('newRound',function(){
        room.dealNewRound()
    })

    socket.on('disconnect',function(){
        let player = room.getPlayerBySocketId(socket.id)
        let goodbyeID = socket.id
        delete SOCKET_LIST[socket.id];
        room.disconnect(goodbyeID)
        if (room.getConnectedPlayers().length === 0 && room.room !== 'mainlobby') {
            delete ROOM_LIST[room.room]
        }
        else {
            room.sendGameStatus();
        }
        console.log('socket disconnected');
        console.log(ROOM_LIST);
    });
});

