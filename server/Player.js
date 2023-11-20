export function Player() {
    let self = {
        id: '' + Math.random(),
        cards: [],
        cardsToPlay: [],
        name: '',
        playCount: 0,
        playMultiple: false,
        scores: [],
        socket: null,
        isPlaying: false,
        hasDrawn: false,
        pressedEitt: false
    }
    self.addCardToPlay = function (index) {
        if (!this.playMultiple && this.cardsToPlay.length) {
            return false
        }
        if (index < 0 || index >= this.cards.length) {
            return false
        }
        let card = this.cards[index]
        // disallow adding another card with different value
        if (this.cardsToPlay.length && card.value !== this.cards[this.cardsToPlay[0]].value) {
            return false
        }
        this.cardsToPlay.push(index)
        return true
    }
    self.emit = function (arg1, arg2) {
        if (this.socket) {
            this.socket.emit(arg1, arg2)
        }
    }
    self.removeCardFromPlay = function (index) {
        this.cardsToPlay.splice(index, 1)
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