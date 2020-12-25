//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import socketio from 'socket.io';
import { rootCertificates } from 'tls';
import { fileURLToPath } from 'url';

import {GameControler, generateCard} from './server/GameControler.js'
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
ROOM_LIST['mainlobby'] = GameControler('mainlobby', PLAYER_LIST)

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
        cards.push(generateCard());
    }
    
    socket.id = Math.random();

    let player = Player(socket.id, SOCKET_LIST)
    player.cards = cards;

    let bName = pickRand(playerBName)
    bName = bName.charAt(0).toUpperCase() + bName.slice(1)
    player.name = pickRand(playerFName) + bName

    SOCKET_LIST[socket.id] = socket
    PLAYER_LIST[socket.id] = player
    console.log('socket connection');

    ROOM_LIST.mainlobby.connected.push(socket.id);
    console.log(ROOM_LIST);

    player.room = 'mainlobby'
    socket.emit('joinRoom', 'mainlobby')

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
            let newGC = GameControler(data, PLAYER_LIST)
            newGC.connected.push(socket.id)
            newGC.turnAssign()
            newGC.sendGameStatus()
            ROOM_LIST[data] = newGC
            player.room = data
            socket.emit('joinRoom', data)
            console.log(ROOM_LIST);
        }
    })

    socket.on('drawCards',function(){
        let room = ROOM_LIST[player.room]
        if (player.hasTurn) {
            player.cards = player.cards.concat(room.drawCards());
            if (room.plusFourInPlay) {
                room.plusFourInPlay = false
                room.turnSwitch()
            }
            if (room.plusTwoInPlay > 0) {
                room.plusTwoInPlay = 0;
                room.turnSwitch();
            }
            room.sendGameStatus();
        }
    });

    socket.on('pass',function(){
        let room = ROOM_LIST[player.room]
        if (player.hasTurn) {
            if (room.plusTwoInPlay > 0) {
                player.cards = player.cards.concat(room.drawCards());
                room.plusTwoInPlay = 0;
            }
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
            for(let i in PLAYER_LIST){
                let currentPlayer = PLAYER_LIST[i];
                currentPlayer.emit('lastPlayed',card);
                }
            room.lastPlayedCard = card;
            if (card.color == 'black') card.color = data.color;
            if (card.value == '+4') room.plusFourInPlay = true
            if (card.value == '+2') room.plusTwoInPlay = room.plusTwoInPlay + 1;
            if (card.value == 'R') room.turnRotation = (room.turnRotation * -1);
            if (card.value == 'S') room.turnSkip = 2;
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
        let room = ROOM_LIST[player.room]
        if (player.hasTurn) room.turnSwitch();
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        for (let i = 0; i < room.connected.length; i++) {
            if (room.connected[i] == socket.id) room.connected.splice(i, 1)
        }
        console.log('socket disconnected');
        console.log(ROOM_LIST);
        room.sendGameStatus();
    });
});
