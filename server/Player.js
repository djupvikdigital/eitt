export function Player() {
    let self = {
        id: '' + Math.random(),
        cards: [],
        name: '',
        scores: [],
        socket: null,
        isPlaying: false,
        hasDrawn: false,
        pressedEitt: false
    }
    self.emit = function (arg1, arg2) {
        if (this.socket) {
            this.socket.emit(arg1, arg2)
        }
    }
    return self
}