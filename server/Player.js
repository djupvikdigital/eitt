export function Player(id, socketList) {
    let self = {
        id: id,
        cards: [],
        name: '',
        room: '',
        hasTurn: false,

    }
    self.emit = function (arg1, arg2) {
        let mySocket = socketList[this.id]
        mySocket.emit(arg1, arg2)
    }
    return self
}