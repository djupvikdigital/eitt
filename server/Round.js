import { CardDeck } from './CardDeck'
import { Turn } from './Turn'

export function Round(deck = CardDeck()) {
    let self = {
        deck: deck,
        players: [],
        state: 'PLAYING',
        turn: Turn(0),
        turnRotation: 1,
        winner: ''
    }
    self.drawCards = function (player, number = 1) {
        let switchTurn = false
        if (number === 1) {
            // allow only one regular draw per turn
            if (this.turn.hasDrawn) {
                return false
            }
            if (this.turn.plusFourInPlay) {
                number = 4
                switchTurn = true
            }
            else if (this.turn.plusTwoInPlay) {
                number = this.turn.plusTwoInPlay * 2
                switchTurn = true
            }
            this.turn.hasDrawn = true
        }
        player.cards = player.cards.concat(this.deck.drawCards(number))
        if (switchTurn) {
            let length = this.players.length
            this.turn = Turn((this.turn.playerIndex + 1 * this.turnRotation + length) % length)
        }
        return true
    }
    self.playTurn = function (color = '') {
        let turn = this.turn
        if (!turn.cardsToPlay.length) {
            return false
        }
        let player = this.players[this.turn.playerIndex]
        let card = player.cards[turn.cardsToPlay[0]]
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
        let cards = []
        // retrieve cards from hand
        for (let i = 0; i < turn.cardsToPlay.length; i++) {
            cards.push(player.cards[turn.cardsToPlay[i]])
        }
        if (card.color === 'black' && color) {
            if (!this.deck.isLegitColor(color)) {
                return false
            }
            for (let i = 0; i < cards.length; i++) {
                cards[i] = Object.assign({}, cards[i], { color: color })
            }
        }
        let gotPlayed = this.deck.playCards(cards)
        if (!gotPlayed) {
            return false
        }
        // remove cards from hand
        for (let i = 0; i < turn.cardsToPlay.length; i++) {
            player.cards[turn.cardsToPlay[i]] = null
        }
        // remove null cards
        player.cards = player.cards.filter(Boolean)
        if (player.cards.length === 0) {
            this.state = 'FINISHED'
            this.winner = player.name
        }
        let nextTurn = Turn((turn.playerIndex + turnIncrement * this.turnRotation + length) % length)
        nextTurn.plusFourInPlay = plusFourInPlay
        nextTurn.plusTwoInPlay = plusTwoInPlay
        this.turn = nextTurn
        return gotPlayed
    }
    return self
}