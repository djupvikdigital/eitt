import { CardDeck } from './CardDeck.js'
import { Turn } from './Turn.js'

function sortCards(cards) {
    cards.sort(function (a, b) {
        let stringA = '' + a.color + a.value;
        let stringB = '' + b.color + b.value;

        if (stringA < stringB) {
            return -1;
        }

        if (stringA > stringB) {
            return 1;
        }

        return 0;
    })
}

export function Round(deck = CardDeck()) {
    let self = {
        deck: deck,
        players: [],
        previousTurn: null,
        state: 'PLAYING',
        turn: Turn(0),
        turnRotation: 1,
        winner: ''
    }
    self.checkPlusFour = function (player) {
        if (this.turn.plusFourInPlay) {
            const playedCards = this.deck.playedCards
            const index = playedCards.length - 2
            const prevColor = index >= 0 && playedCards[index] ? playedCards[index].color : ''
            if (!this.previousTurn) {
                return false
            }
            const checkedPlayer = this.players[this.previousTurn.playerIndex]
            if (checkedPlayer) {
                const cardsWithPrevColor = checkedPlayer.cards.filter(function (card) {
                    return card.color === prevColor
                })
                if (cardsWithPrevColor.length > 0) {
                    // checked player played +4 while still having previous color
                    // checked player must draw 4 instead, and turn doesn't switch
                    this.drawCards(checkedPlayer, 4)
                    this.turn.plusFourInPlay = false
                }
                else {
                    // checked player is innocent, checking player gets 6 cards
                    this.drawCards(player, 6)
                    this.switchTurn()
                }
            }
        }
    }
    self.drawCards = function (player, number = 1) {
        let switchTurn = false
        if (number === 1) {
            if (!this.hasTurn(player)) {
                return false
            }
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
        sortCards(player.cards)
        player.pressedEitt = false
        if (switchTurn) {
            this.switchTurn()
        }
        return true
    }
    self.hasTurn = function (player) {
        let currentPlayer = this.players[this.turn.playerIndex]
        return currentPlayer && player.id === currentPlayer.id
    }
    self.playTurn = function (color = '') {
        if (this.state !== 'PLAYING' && this.state !== 'FINISHING') {
            return false
        }
        let turn = this.turn
        let player = this.players[turn.playerIndex]
        if (!player.cardsToPlay.length) {
            return false
        }
        let card = player.cards[player.cardsToPlay[0]]
        if (turn.plusFourInPlay) {
            return false
        }
        if (turn.plusTwoInPlay && card.value !== '+2') {
            return false
        }
        let plusFourInPlay = false
        let plusTwoInPlay = 0
        let turnIncrement = 1
        switch(card.value) {
            case '+4':
                plusFourInPlay = true
                break;
            case '+2':
                plusTwoInPlay = turn.plusTwoInPlay + player.cardsToPlay.length
                break;
            case 'R':
                let turnRotation = this.turnRotation
                for (let i = 0; i < player.cardsToPlay.length; i++) {
                    turnRotation = turnRotation * -1
                }
                this.turnRotation = turnRotation
                break;
            case 'S':
                turnIncrement = turnIncrement + player.cardsToPlay.length
                break;
            default:
                break;
        }
        let cards = []
        // retrieve cards from hand
        for (let i = 0; i < player.cardsToPlay.length; i++) {
            cards.push(player.cards[player.cardsToPlay[i]])
        }
        if (card.color === 'black') {
            if (color) {
                if (!this.deck.isLegitColor(color)) {
                    return false
                }
                for (let i = 0; i < cards.length; i++) {
                    cards[i] = Object.assign({}, cards[i], { color: color })
                }
            }
            else {
                return false
            }
        }
        let gotPlayed = this.deck.playCards(cards)
        if (!gotPlayed) {
            return false
        }
        // remove cards from hand
        for (let i = 0; i < player.cardsToPlay.length; i++) {
            player.cards[player.cardsToPlay[i]] = null
        }
        // reset
        player.cardsToPlay = []
        // remove null cards
        player.cards = player.cards.filter(Boolean)
        if (player.cards.length === 0) {
            if (plusFourInPlay || plusTwoInPlay) {
                this.state = 'FINISHING'
            }
            else {
                this.state = 'FINISHED'
            }
            this.winner = player.name
        }
        this.switchTurn(turnIncrement, plusFourInPlay, plusTwoInPlay)
        return gotPlayed
    }
    self.pressEitt = function (player) {
        if (this.hasTurn(player) && player.cards.length === 2) {
            player.pressedEitt = true
        }
        return player.pressedEitt
    }
    self.switchTurn = function (increment = 1, plusFourInPlay = false, plusTwoInPlay = 0) {
        if (this.state === 'FINISHED' || (this.state === 'FINISHING' && !plusFourInPlay && !plusTwoInPlay)) {
            this.state = 'FINISHED'
            // self.addScoresForRound()
            return
        }
        let length = this.players.length
        this.previousTurn = this.turn
        this.turn = Turn((this.turn.playerIndex + increment * this.turnRotation + length) % length)
        this.turn.plusFourInPlay = plusFourInPlay
        this.turn.plusTwoInPlay = plusTwoInPlay
    }
    return self
}