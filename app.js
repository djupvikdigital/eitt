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

// card shuffler
let nytDeck = []
function newCrewDeck(nytDeck) {
    let farve = ''
    for (let i = 0; i < 4; i++) {
        if (i == 0) farve = 'Rød'
        if (i == 1) farve = 'Grøn'
        if (i == 2) farve = 'Blå'
        if (i == 3) farve = 'Gul'
        for (let a = 0; a < 9; a++) {
            nytDeck.push(farve + ' ' + (a +1))
        }
    }
    for (let i = 0; i < 4; i++) {
        nytDeck.push('Raket ' + (i+1))
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
        room.drawCards(player);
    });

    socket.on('didntPressEitt', function(playerId) {
        let accusedPlayer = PLAYER_LIST[playerId]
        let room = ROOM_LIST[player.room]
        if (room.lastPlayerId === playerId && accusedPlayer.cards.length === 1 && accusedPlayer.pressedEitt == false) {
            room.drawCards(accusedPlayer, 3)
        }
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

    socket.on('checkPlusFour', function(){
        let room = ROOM_LIST[player.room]
        if (room.plusFourInPlay) {
            const playedCards = room.deck.playedCards
            const index = playedCards.length - 2
            const prevColor = index >= 0 && playedCards[index] ? playedCards[index].color : ''
            const checkedPlayer = PLAYER_LIST[room.lastPlayerId]
            if (checkedPlayer) {
                const cardsWithPrevColor = checkedPlayer.cards.filter(function(card){
                    return card.color === prevColor
                })
                if (cardsWithPrevColor.length > 0) {
                    // checked player played +4 while still having previous color
                    // checked player must draw 4 instead, and turn doesn't switch
                    room.drawCards(checkedPlayer, 4)
                    room.plusFourInPlay = false
                }
                else {
                    // checked player is innocent, checking player gets 6 cards
                    room.drawCards(player, 6)
                    room.plusFourInPlay = false
                    room.turnSwitch()
                }
                room.sendGameStatus()
            }
        }
    })

    socket.on('playCard',function(data){
        let room = ROOM_LIST[player.room]
        function legitPlay(){
            console.log("Yay! " + player.name + " played a " + card.color + " " + card.value + " in " + player.room);
            // remove played card from player cards
            player.cards.splice(data.index, 1);
            player.hasDrawn = false
            room.lastPlayerId = player.id
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
        if (card.color == 'black') card.color = data.color;
        if (player.hasTurn && room.playCard(card)) legitPlay();
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

    socket.on('newRound',function(){
        let room = ROOM_LIST[player.room]
        room.dealNewRound()
    })

    //card shuffler

    socket.on('emptyDeck',function(){
        nytDeck = []
        console.log('Deck has been emptied')
    })

    socket.on('addCrewDeck',function(){
        newCrewDeck(nytDeck)
        shuffleArray(nytDeck)
        console.log('New crew deck added')
        console.log(nytDeck)
    })

    socket.on('drawShuffledCard',function(data){
        let newArr = []
        for (let i = 0; i < data; i++) {
            newArr.push(nytDeck.splice(0, 1))
        }
        newArr.sort()
        let string = ''
        for (let i = 0; i < data; i++) {
            string = string + ', ' + newArr.splice(0, 1)
        }
        socket.emit('drewCardz', string)
        console.log(string)
    })

    socket.on('disconnect',function(){
        let room = ROOM_LIST[player.room].room
        if (player.hasTurn) ROOM_LIST[player.room].turnSwitch();
        let goodbyeID = socket.id
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
        for (let i = 0; i < ROOM_LIST[room].connected.length; i++) {
            if (ROOM_LIST[room].connected[i] == goodbyeID) ROOM_LIST[room].connected.splice(i, 1)
        }
        if (ROOM_LIST[room].connected.length === 0 && room !== 'mainlobby') {
            delete ROOM_LIST[room]
        }
        else {
            ROOM_LIST[room].sendGameStatus();
        }
        console.log('socket disconnected');
        console.log(ROOM_LIST);
    });
});

