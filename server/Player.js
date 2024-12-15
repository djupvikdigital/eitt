export function Player() {
    let self = {
        id: '' + Math.random(),
        cards: [],
        cardsToPlay: [],
        drawnCards: [],
        name: '',
        playMultiple: false,
        scores: [],
        socket: null,
        isPlaying: false,
        hasDrawn: false,
        pressedEitt: false
    }
    self.addCardToPlay = function (index) {
        if (index < 0 || index >= this.cards.length) {
            return false
        }
        let card = this.cards[index]
        if (this.playMultiple) {
            // disallow adding another card with different value
            if (this.cardsToPlay.length && card.value !== this.cards[this.cardsToPlay[0]].value) {
                return false
            }
            this.cardsToPlay.push(index)
        }
        else {
            this.cardsToPlay = [index]
        }
        return true
    }
    self.emit = function (arg1, arg2) {
        if (this.socket) {
            this.socket.emit(arg1, arg2)
        }
    }
    self.removeCardFromPlay = function (index) {
        if (index < 0 || index >= this.cards.length) {
            return false
        }
        this.cardsToPlay = this.cardsToPlay.filter(function (value) {
            return value !== index
        })
        return true
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