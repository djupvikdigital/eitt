export function Player() {
    let self = {
        id: Math.random(),
        cards: [],
        name: '',
        scores: [],
        socket: null,
        hasDrawn: false,
        hasTurn: false,
        pressedEitt: false
    }
    self.emit = function (arg1, arg2) {
        if (this.socket) {
            this.socket.emit(arg1, arg2)
        }
    }
    return self
}