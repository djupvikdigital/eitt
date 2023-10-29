export function Player() {
    let self = {
        id: '' + Math.random(),
        cards: [],
        name: '',
        playCount: 0,
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

export function applyStandardStyling() {
    let self = {
        body: '#47535a',
        head: '#f6d7d2',
        headGear: 0
    }
    return self;
}