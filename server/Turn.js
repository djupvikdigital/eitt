export function Turn(playerIndex, playMultiple = false) {
    let self = {
        cardsToPlay: [],
        hasDrawn: false,
        playerIndex: playerIndex,
        playMultiple: playMultiple,
        plusFourInPlay: false,
        plusTwoInPlay: 0
    }
    self.addCardToPlay = function (player, index) {
        if (!playMultiple && this.cardsToPlay.length) {
            return false
        }
        let card = player.cards[index]
        // disallow adding another card with different value
        if (this.cardsToPlay.length && card.value !== player.cards[this.cardsToPlay[0]].value) {
            return false
        }
        if (this.plusFourInPlay) {
            return false
        }
        if (this.plusTwoInPlay && card.value !== '+2') {
            return false
        }
        this.cardsToPlay.push(index)
        return true
    }
    self.removeCardFromPlay = function (index) {
        this.cardsToPlay.splice(index, 1)
    }
    return self
}
