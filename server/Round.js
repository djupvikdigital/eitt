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
        let gotPlayed = false
        for (let i= 0; i < turn.cardsToPlay.length; i++) {
            let card = turn.cardsToPlay[i]
            switch(card.value) {
                case '+4':
                    this.plusFourInPlay = true
                    break;
                default:
                    break;
            }
            gotPlayed = this.deck.playCard(card)
            if (!gotPlayed) {
                return false
            }
        }
        this.turn = Turn()
        return gotPlayed
    }
    return self
}