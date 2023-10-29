#!/usr/bin/env node

//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { exec } from 'child_process';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

import { GameControler } from './server/GameControler.js'
import { pickTemporalName } from './server/Naming.js'
import { applyStandardStyling } from './server/Player.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app = express();
let serv = http.Server(app);

app.get('/',function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});

app.post('/restart', function(req, res){
    console.log('did we get this far?')
    exec('git pull', (err, stdout, stderr) => {
        console.log('and this far?')
    if (err) {
        //some err occurred
        console.error(err)
    } else {
    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
    }
    console.log('Even this far??')
    res.send('Success!')
    });
})
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started!');

const MAX_PLAYERS = 99

let SOCKET_LIST = {}

let ROOM_LIST = {}
ROOM_LIST['mainlobby'] = GameControler('mainlobby', ROOM_LIST)

let io = new Server(serv,{});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();

    let name = pickTemporalName();

    let style = applyStandardStyling();

    SOCKET_LIST[socket.id] = socket
    console.log('socket connection');

    let room = ROOM_LIST.mainlobby
    let player = room.connect(socket)
    player.style = style;
    socket.emit('joinRoom', { room: 'mainlobby' })

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
            player.name = name
            player.style = style;
            //console.log(player);
            socket.emit('joinRoom', { playerId: player.id, room: data })
            room.sendGameStatus()
            ROOM_LIST.mainlobby.sendRoomStatus()
            //console.log(ROOM_LIST);
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
            if (data.room !== 'mainlobby' && ROOM_LIST[data.room].players.length >= MAX_PLAYERS) {
                socket.emit('userMessage', "I've got " + MAX_PLAYERS + " players, but you ain't one")
                return
            }
            for (let i in ROOM_LIST) {
                ROOM_LIST[i].leave(socket.id)
                if (ROOM_LIST[i].getConnectedPlayers().length === 0 && i !== 'mainlobby') {
                    delete ROOM_LIST[i]
                }
            }
            room = ROOM_LIST[data.room]
            let player = room.connect(socket, data.playerId)
            if (!player.name) {
                player.name = name
            }
            player.style = style;
            room.sendGameStatus()
            socket.emit('joinRoom', { playerId: player.id, room: data.room })
            ROOM_LIST.mainlobby.sendRoomStatus()
            //console.log(ROOM_LIST)
        }
    })

    socket.on('drawCards',function(){
        let player = room.getPlayerBySocketId(socket.id)
        room.drawCards(player);
    });

    socket.on('didntPressEitt', function(index) {
        let accusedPlayer = room.players[index]
        if (room.lastPlayerId === accusedPlayer.id && accusedPlayer.cards.length === 1 && accusedPlayer.pressedEitt == false) {
            room.drawCards(accusedPlayer, 3)
        }
    })

    socket.on('eitt', function() {
        room.pressEitt(room.getPlayerBySocketId(socket.id))
    })

    socket.on('pass',function(){
        let player = room.getPlayerBySocketId(socket.id)
        if (room.hasTurn(player) && (room.playMulVal || player.hasDrawn)) {
            player.hasDrawn = false
            room.turnSwitch();
            room.sendGameStatus();
        }
    });

    socket.on('checkPlusFour', function(){
        let player = room.getPlayerBySocketId(socket.id)
        room.checkPlusFour(player)
    })

    socket.on('addCardToPlay', function (data) {
        let player = room.getPlayerBySocketId(socket.id)
        if (!this.hasTurn(player) || index < 0 || index >= player.cards.length) {
            return
        }
        room.turn.addCardToPlay(player.cards[data.index])
    })

    socket.on('removeCardFromPlay', function (data) {
        let player = room.getPlayerBySocketId(socket.id)
        if (!this.hasTurn(player) || index < 0 || index >= player.cards.length) {
            return
        }
        room.turn.removeCardFromPlay(data.index)
    })

    socket.on('playCard',function(data){
        if (room.room === 'mainlobby') {
            console.log("Can't play card in mainlobby")
            return
        }
        let player = room.getPlayerBySocketId(socket.id)
        if (!player) {
            console.log('Player with socket id ' + socket.id + ' not found in room ' + room.room)
            console.log(JSON.stringify(room.players))
            return
        }
        function legitPlay(){
            //console.log("Yay! " + player.name + " played a " + card.color + " " + card.value + " in " + room.room);
        }

        function unlegitPlay(){
            if (!room.deck) {
                console.log('Room with name ' + room.room + 'and status' + room.status + ' has no deck')
                console.error(room)
                return
            }
            let lastPlayedCard = room.deck.getLastPlayedCard()
            if (!lastPlayedCard) {
                console.log('No last played card in deck')
                console.log(deck)
                return
            }
        }

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

    socket.on('startGame', function (data) {
        if (data.playerId === room.players[0].id) {
            let startScore = Number(data.startScore)
            room.startNeutral = Boolean(data.startNeutral)
            room.playMultiple = Boolean(data.playMultiple)
            if (!isNaN(startScore) && startScore >= 0 && startScore <= 4) {
                room.startScore = startScore
            }
            room.startNewGame()
        }
    })

    socket.on('removePlayer', function(index) {
        room.removePlayer(index)
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
        //console.log(ROOM_LIST);
    });
});

