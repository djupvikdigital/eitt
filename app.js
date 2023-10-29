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
import { House } from './server/House.js'

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

House.rooms.mainlobby = GameControler('mainlobby')

let io = new Server(serv,{});
io.sockets.on('connection', function(socket){
    
    socket.id = Math.random();

    let name = pickTemporalName();

    let style = applyStandardStyling();

    SOCKET_LIST[socket.id] = socket
    console.log('socket connection');

    let room = House.rooms.mainlobby
    let player = room.connect(socket)
    player.style = style;
    socket.emit('joinRoom', { room: 'mainlobby' })

    House.refreshLobby()
    console.log(House.rooms)

    socket.on('createNewRoom', function(roomName){
        if (House.getRoomBySocketId(socket.id) != 'mainlobby') return
        if (roomName == '') return
        if (House.checkIfRoomExists(roomName)) {
            socket.emit('roomExists','')
            return
        }

        House.rooms[roomName] = GameControler(roomName)
        room = House.rooms[roomName]
        let player = room.connect(socket)
        player.name = name
        player.style = style;
        socket.emit('joinRoom', { playerId: player.id, room: roomName })
        House.rooms[roomName].sendGameStatus()
        House.refreshLobby()
    })

    socket.on('joinRoom', function(data) {
        if (!House.checkIfRoomExists(data.room)) return

        if (data.room !== 'mainlobby' && House.rooms[data.room].players.length >= MAX_PLAYERS) {
            socket.emit('userMessage', "I've got " + MAX_PLAYERS + " players, but you ain't one")
            return
        }
        for (let i in House.rooms) {
            House.rooms[i].leave(socket.id)
            if (House.isRoomEmpty(i)) delete House.rooms[i]
        }
        room = House.rooms[data.room]
        let player = room.connect(socket, data.playerId)
        if (!player.name) {
            player.name = name
        }
        player.style = style;
        room.sendGameStatus()
        socket.emit('joinRoom', { playerId: player.id, room: data.room })
        House.refreshLobby()
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
        if (!room.hasTurn(player) || index < 0 || index >= player.cards.length) {
            return
        }
        room.turn.addCardToPlay(player.cards[data.index])
    })

    socket.on('removeCardFromPlay', function (data) {
        let player = room.getPlayerBySocketId(socket.id)
        if (!room.hasTurn(player) || index < 0 || index >= player.cards.length) {
            return
        }
        room.turn.removeCardFromPlay(data.index)
    })

    socket.on('playCard',function(data){
        if (room.name === 'mainlobby') {
            console.log("Can't play card in mainlobby")
            return
        }
        let player = room.getPlayerBySocketId(socket.id)
        if (!player) {
            console.log('Player with socket id ' + socket.id + ' not found in room ' + room.name)
            console.log(JSON.stringify(room.players))
            return
        }
        function legitPlay(){
            //console.log("Yay! " + player.name + " played a " + card.color + " " + card.value + " in " + room.room);
        }

        function unlegitPlay(){
            if (!room.deck) {
                console.log('Room with name ' + room.name + 'and status' + room.status + ' has no deck')
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
        let goodbyeID = socket.id
        delete SOCKET_LIST[socket.id];
        room.disconnect(goodbyeID)
        if (House.isRoomEmpty(room.name)) delete House.rooms[room.name]; else room.sendGameStatus();
        console.log('socket disconnected');
    });
});

