import { CardDeck } from "./CardDeck"

export function Round() {
    let self = {
        deck: CardDeck()
    }
    self.playTurn = function (turn) {
        return this.deck.playCards(turn.cardsToPlay)
    }
    return self
}