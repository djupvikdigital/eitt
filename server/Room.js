import { Player } from './Player.js'

export function Room(name) {
    let self = {
        name: name,
        players: [],
        type: 'room'
    }
    self.connect = function (socket, playerId) {
        let player = null
        if (playerId) {
            player = this.getPlayerByPlayerId(playerId)
            if (player && player.socket) {
                // this player is already connected
                player = null
            }
        }
        if (!player) {
            player = Player()
            this.players.push(player)
        }
        player.socket = socket
        return player
    }
    self.disconnect = function (socketId) {
        const player = this.getPlayerBySocketId(socketId)
        if (player) {
            for (let i = 0; i < this.players.length; i++) {
                if (player.id === this.players[i].id) {
                    return this.removePlayer(i)
                }
            }
            return true
        }
        return false
    }
    self.getConnectedPlayers = function () {
        return this.players.filter(function (player) {
            return player.socket
        })
    }
    self.getPlayerByPlayerId = function (playerId) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === playerId) {
                return this.players[i]
            }
        }
        return null
    }
    self.getPlayerBySocketId = function (socketId) {
        for (let i = 0; i < this.players.length; i++) {
            let socket = this.players[i].socket
            if (socket && socket.id === socketId) {
                return this.players[i]
            }
        }
        return null
    }
    self.leave = function (socketId) {
        for (let i = 0; i < this.players.length; i++) {
            let socket = this.players[i].socket
            if (socket && socket.id === socketId) {
                return this.removePlayer(i)
            }
        }
        return null
    }
    self.removePlayer = function (index) {
        if (index < 0 || index >= this.players.length) {
            return false
        }
        let player = this.players.splice(index, 1)
        return player[0]
    }
    return self
}