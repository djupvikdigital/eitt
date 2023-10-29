export function Turn(playerIndex, playMultiple = false) {
    let self = {
        cardsToPlay: [],
        playerIndex: playerIndex,
        playMultiple: playMultiple
    }
    self.addCardToPlay = function (card) {
        if (!playMultiple && this.cardsToPlay.length) {
            return false
        }
        // disallow adding another card with different value
        if (this.cardsToPlay.length && card.value !== this.cardsToPlay[0].value) {
            return false
        }
        this.cardsToPlay.push(card)
        return true
    }
    self.removeCardFromPlay = function (index) {
        this.cardsToPlay.splice(index, 1)
    }
    return self
}
