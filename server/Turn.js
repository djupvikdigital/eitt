export function Turn(playerIndex, playMultiple = false) {
    let self = {
        cardsToPlay: [],
        hasDrawn: false,
        playerIndex: playerIndex,
        plusFourInPlay: false,
        plusTwoInPlay: 0
    }
    return self
}
