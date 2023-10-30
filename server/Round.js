import { CardDeck } from './CardDeck'
import { Turn } from './Turn'

export function Round() {
    let self = {
        deck: CardDeck(),
        plusFourInPlay: false,
        turn: Turn()
    }
    self.playTurn = function () {
        let turn = this.turn
        if (this.plusFourInPlay) {
            return false
        }
        let card = turn.cardsToPlay[0]
        switch(card.value) {
            case '+4':
                this.plusFourInPlay = true
                break;
            default:
                break;
        }
        let gotPlayed = this.deck.playCards(turn.cardsToPlay)
        if (!gotPlayed) {
            return false
        }
        this.turn = Turn()
        return gotPlayed
    }
    return self
}