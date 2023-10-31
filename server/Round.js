import { CardDeck } from './CardDeck'
import { Turn } from './Turn'

export function Round() {
    let self = {
        deck: CardDeck(),
        turn: Turn(),
        turnRotation: 1
    }
    self.playTurn = function () {
        let turn = this.turn
        let nextTurn = Turn()
        if (!turn.cardsToPlay.length) {
            return false
        }
        let card = turn.cardsToPlay[0]
        switch(card.value) {
            case '+4':
                nextTurn.plusFourInPlay = true
                break;
            case '+2':
                nextTurn.plusTwoInPlay = turn.plusTwoInPlay + turn.cardsToPlay.length
                break;
            case 'R':
                this.turnRotation = this.turnRotation * -1
                break;
            case 'S':
                nextTurn.skip = nextTurn.skip + turn.cardsToPlay.length
                break;
            default:
                break;
        }
        let gotPlayed = this.deck.playCards(turn.cardsToPlay)
        if (!gotPlayed) {
            return false
        }
        this.turn = nextTurn
        return gotPlayed
    }
    return self
}