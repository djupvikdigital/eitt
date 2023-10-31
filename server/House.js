import { GameControler } from './GameControler.js'
import { Room } from './Room.js'
import { pickTemporalName } from './Naming.js'
import { applyStandardStyling } from './Player.js'

export let House = {
    rooms: {},
    MAX_PLAYERS: 99,
    newRoom(roomName) {
        this.rooms[roomName] = Room(roomName)
    },
    newGameRoom(roomName) {
        this.rooms[roomName] = GameControler(roomName)
    },
    getRoomBySocketId: function(socketId) {
        for (let i in this.rooms) {
            let room = this.rooms[i]
            let player = room.getPlayerBySocketId(socketId)
            if (player) return room
        }
        return null
    },
    getRoomAndPlayerBySocketId: function(socketId) {
        let room = this.getRoomBySocketId(socketId)
        let player = room.getPlayerBySocketId(socketId)
        return [room, player]
    },
    moveSocketTo: function(socket, roomName, playerId) {
        let leavingPlayer = null
        let joiningRoom = this.rooms[roomName]
        for (let i in this.rooms) {
            leavingPlayer = this.rooms[i].leave(socket.id)
            if (leavingPlayer != null) break
        }
        let joiningPlayer = joiningRoom.connect(socket, playerId)
        if (leavingPlayer != null) {
            joiningPlayer.name = leavingPlayer.name
            joiningPlayer.style = leavingPlayer.style
        } else {
            joiningPlayer.name = pickTemporalName()
            joiningPlayer.style = applyStandardStyling()
        }
        if ("sendGameStatus" in joiningRoom) joiningRoom.sendGameStatus()
        return joiningPlayer.id
    },
    checkIfRoomExists: function(roomName) {
        for (let i in this.rooms) {
            if (this.rooms[i].name == roomName) return true
        }
        return false
    },
    isRoomEmpty: function(roomName) {
        return (this.rooms[roomName].getConnectedPlayers().length === 0 && roomName !== 'mainlobby')
    },
    isRoomFull: function(roomName) {
        return (roomName !== 'mainlobby' && this.rooms[roomName].players.length >= this.MAX_PLAYERS)
    },
    refreshLobby: function() {
        for (let i in this.rooms) {
            if (this.isRoomEmpty(i)) delete this.rooms[i]
        }
        let pack = [];
        for(let i in this.rooms){
            let room = this.rooms[i]
            pack.push({
                room:room.name,
                state:room.state
            });
        }
        let mainlobby = this.rooms.mainlobby
        for(let i = 0; i < mainlobby.players.length; i++){
            let player = mainlobby.players[i]
            player.emit('roomStatus', pack);
        }
    }
}