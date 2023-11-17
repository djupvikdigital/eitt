export function Turn(playerIndex, playMultiple = false) {
    let self = {
        cardsToPlay: [],
        hasDrawn: false,
        playerIndex: playerIndex,
        playMultiple: playMultiple,
        plusFourInPlay: false,
        plusTwoInPlay: 0
    }
    return self
}
