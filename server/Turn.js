export function Turn(playerIndex) {
    let self = {
        cardsToPlay: [],
        hasDrawn: false,
        playerIndex: playerIndex,
        plusFourInPlay: false,
        plusTwoInPlay: 0
    }
    self.getDrawCount = function () {
        let drawCount = 1
        if (this.plusFourInPlay) {
            drawCount = 4
        }
        else if (this.plusTwoInPlay) {
            drawCount = this.plusTwoInPlay * 2
        }
        return drawCount
    }
    return self
}
