import { CardDeck } from './CardDeck'
import { Turn } from './Turn'

export function Round() {
    let self = {
        deck: CardDeck(),
        plusFourInPlay: false,
        plusTwoInPlay: 0,
        turn: Turn(),
        turnRotation: 1
    }
    self.playTurn = function () {
        let turn = this.turn
        let nextTurn = Turn()
        if (this.plusFourInPlay) {
            return false
        }
        let card = turn.cardsToPlay[0]
        if (this.plusTwoInPlay && card.value !== '+2') {
            return false
        }
        switch(card.value) {
            case '+4':
                this.plusFourInPlay = true
                break;
            case '+2':
                this.plusTwoInPlay = this.plusTwoInPlay + 1
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