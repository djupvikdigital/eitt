import { CardDeck } from './CardDeck'
import { Turn } from './Turn'

export function Round() {
    let self = {
        deck: CardDeck(),
        players: [],
        turn: Turn(0),
        turnRotation: 1
    }
    self.playTurn = function () {
        let turn = this.turn
        if (!turn.cardsToPlay.length) {
            return false
        }
        let card = turn.cardsToPlay[0]
        let turnIncrement = 1
        if (card.value === 'S') {
            turnIncrement = turnIncrement + turn.cardsToPlay.length
        }
        let length = this.players.length
        let nextTurn = Turn((turn.playerIndex + turnIncrement * this.turnRotation + length) % length)
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