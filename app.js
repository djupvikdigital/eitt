#!/usr/bin/env node

//express setup
import express from 'express';
import * as http from 'http';
import { dirname } from 'path';
import { exec } from 'child_process';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';

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

let SOCKET_LIST = {}

House.newRoom('mainlobby')

let io = new Server(serv,{});
io.sockets.on('connection', function(socket){

    SOCKET_LIST[socket.id] = socket
    console.log('socket connection');

    House.moveSocketTo(socket, 'mainlobby')
    socket.emit('joinRoom', { room: 'mainlobby' })

    House.refreshLobby()

    socket.on('createNewRoom', function(roomName){
        if (House.getRoomBySocketId(socket.id).name != 'mainlobby' || roomName == '') return
        if (House.checkIfRoomExists(roomName)) {
            socket.emit('roomExists','')
            return
        }

        House.newGameRoom(roomName)
        let playerId = House.moveSocketTo(socket, roomName)
        socket.emit('joinRoom', { playerId: playerId, room: roomName })
        House.refreshLobby()
    })

    socket.on('joinRoom', function(data) {
        if (!House.checkIfRoomExists(data.room)) return
        if (House.isRoomFull(data.room)) {
            socket.emit('userMessage', "I've got " + House.MAX_PLAYERS + " players, but you ain't one")
            return
        }
        let playerId = null
        if (data.playerId) {
            playerId = House.moveSocketTo(socket, data.room, data.playerId)
        } else {
            playerId = House.moveSocketTo(socket, data.room)
        }
        socket.emit('joinRoom', { playerId: playerId, room: data.room })
        House.refreshLobby()
    })

    socket.on('drawCards',function(){
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        room.drawCards(player);
    });

    socket.on('didntPressEitt', function(index) {
        let room = House.getRoomBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        let accusedPlayer = room.players[index]
        let lastPlayerIndex = room.round.previousTurn ? room.round.previousTurn.playerIndex : -1;
        let lastPlayerId = room.round.players[lastPlayerIndex].id
        if (lastPlayerId === accusedPlayer.id && accusedPlayer.cards.length === 1 && accusedPlayer.pressedEitt == false) {
            room.drawCards(accusedPlayer, 3)
        }
    })

    socket.on('eitt', function() {
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        room.pressEitt(player)
    })

    socket.on('pass',function(){
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        if (room.round.hasTurn(player)) {
            room.turnSwitch();
            room.sendGameStatus();
        }
    });

    socket.on('checkPlusFour', function(){
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        room.checkPlusFour(player)
    })

    socket.on('addCardToPlay', function (data) {
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        player.addCardToPlay(data.index)
        let card = player.cards[data.index]
        if (!room.playMultiple && room.round.hasTurn(player) && card && card.color !== 'black') {
            let playerIndex = room.round.turn.playerIndex
            let playedCards = player.cardsToPlay
            room.round.playTurn()
            room.sendGameStatus({ type: 'playTurn', playedCards: playedCards, playerIndex: playerIndex })
            return
        }
        room.sendGameStatus()
    })

    socket.on('removeCardFromPlay', function (data) {
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        player.removeCardFromPlay(data.index)
        room.sendGameStatus()
    })

    socket.on('playTurn', function (data) {
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (!player) {
            console.log('Player with socket id ' + socket.id + ' not found in room ' + room.name)
            console.log(JSON.stringify(room.players))
            return
        }
        if (!room.round.hasTurn(player)) {
            return
        }
        let playerIndex = room.round.turn.playerIndex
        let playedCards = player.cardsToPlay
        if (data && data.color) {
            room.round.playTurn(data.color)
        }
        else {
            room.round.playTurn()
        }
        room.sendGameStatus({ type: 'playTurn', playedCards: playedCards, playerIndex: playerIndex })
    })

    socket.on('playCard',function(data){
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (room.type != 'gameRoom') return
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
        let [room, player] = House.getRoomAndPlayerBySocketId(socket.id)
        if (data.name != '') {
            if (data.name.length > 20) {
                data.name = data.name.slice(0, 20);
            }
            console.log('Socket id: ' + socket.id + " changed name to " + data.name);
            player.name = data.name;
            if ("sendGameStatus" in room) room.sendGameStatus();
        }
        player.style.body = data.body;
        player.style.head = data.head;
        player.style.headGear = data.headGear
    });

    socket.on('newRound',function(){
        let room = House.getRoomBySocketId(socket.id)
        if (room.type != 'gameRoom') return
        room.dealNewRound()
    })

    socket.on('startGame', function (data) {
        let room = House.getRoomBySocketId(socket.id)
        if (room.type != 'gameRoom') return
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
        let room = House.getRoomBySocketId(socket.id)
        room.removePlayer(index)
    })

    socket.on('disconnect',function(){
        let goodbyeID = socket.id
        let room = House.getRoomBySocketId(socket.id)
        delete SOCKET_LIST[socket.id];
        room.disconnect(goodbyeID)
        if (House.isRoomEmpty(room.name)) delete House.rooms[room.name]; else if ("sendGameStatus" in room) room.sendGameStatus();
        console.log('socket disconnected');
    });
});

