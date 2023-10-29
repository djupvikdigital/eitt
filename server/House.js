export let House = {
    rooms: {},
    getRoomBySocketId: function(socketId) {
        for (let i in this.rooms) {
            let room = this.rooms[i]
            let id = room.getPlayerBySocketId(socketId)
            if (id) return room.name
        }
        return null
    },
    checkIfRoomExists: function(newRoomName) {
        for (let i in this.rooms) {
            let roomName = this.rooms[i].room
            if (roomName == newRoomName) return true
        }
        return false
    },
    isRoomEmpty: function(roomName) {
        if (this.rooms[roomName].getConnectedPlayers().length === 0 && roomName !== 'mainlobby') return true; else return false
    },
    refreshLobby: function() {
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