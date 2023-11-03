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
        let plusFourInPlay = false
        let plusTwoInPlay = 0
        let turnIncrement = 1
        let length = this.players.length
        switch(card.value) {
            case '+4':
                plusFourInPlay = true
                break;
            case '+2':
                plusTwoInPlay = turn.plusTwoInPlay + turn.cardsToPlay.length
                break;
            case 'R':
                let turnRotation = this.turnRotation
                for (let i = 0; i < turn.cardsToPlay.length; i++) {
                    turnRotation = turnRotation * -1
                }
                this.turnRotation = turnRotation
                break;
            case 'S':
                turnIncrement = turnIncrement + turn.cardsToPlay.length
                break;
            default:
                break;
        }
        let gotPlayed = this.deck.playCards(turn.cardsToPlay)
        if (!gotPlayed) {
            return false
        }
        let nextTurn = Turn((turn.playerIndex + turnIncrement * this.turnRotation + length) % length)
        nextTurn.plusFourInPlay = plusFourInPlay
        nextTurn.plusTwoInPlay = plusTwoInPlay
        this.turn = nextTurn
        return gotPlayed
    }
    return self
}