import { CardDeck } from './CardDeck.js'
import { Turn } from './Turn.js'
import { Room } from './Room.js'
import { Round } from './Round.js'

function add(a, b) {
    return a + b
}

const START_SCORE_AVERAGE = 0
const START_SCORE_MEDIAN = 1
const START_SCORE_MIN = 2
const START_SCORE_MAX = 3
const START_SCORE_ZERO = 4

export function GameControler(name) {
    let self = Room(name)
    self.type = 'gameRoom'
    self.deck = null,
    self.lastPlayedIndex = -1,
    self.lastPlayerId = 0,
    self.plusTwoInPlay = 0,
    self.plusFourInPlay = false,
    self.round = Round()
    self.roundWinner = '',
    self.startNeutral = false,
    self.playMultiple = false,
    self.startScore = START_SCORE_AVERAGE,
    self.state = 'NOT_STARTED',
    self.turnRotation = 1,
    self.turnSkip = 1,
    self.playMulVal = null
    self.addScoresForRound = function () {
        let scores = this.calculateScores()
        let idWithHighestScore = 0
        let highestScore = 0
        let players = this.getPlayingPlayers()
        if (!players.length) {
            return
        }
        let roundNumber = players[0].scores.length
        for (let id in scores) {
            let score = scores[id]
            if (score >= highestScore) {
                highestScore = score
                idWithHighestScore = id
            }
        }
        for (let i = 0; i < players.length; i++) {
            let currentPlayer = players[i]
            let id = currentPlayer.id
            let score = scores[id]
            currentPlayer.scores[roundNumber] = score
            if (id === idWithHighestScore) {
                this.round.turn = Turn(i)
            }
            currentPlayer.pressedEitt = false
            if (this.calculateTotal(currentPlayer.scores)) this.state = 'FINISHED'
        }
    }
    self.calculateScores = function () {
        let players = this.getPlayingPlayers()
        let scores = {}
        for (let i = 0; i < players.length; i++) {
            let score = 0
            let currentPlayer = players[i]
            for (let j = 0; j < currentPlayer.cards.length; j++) {
                let card = currentPlayer.cards[j]
                if (isNaN(Number(card.value.slice(0, 1)))) {
                    if (card.color === 'black') {
                        score += 50
                    }
                    else {
                        score += 20
                    }
                }
                else {
                    score += Number(card.value)
                }
            }
            scores[currentPlayer.id] = score
        }
        return scores
    }
    self.calculateTotal = function (scores) {
        let thisScore = 0
        for (let i = 0; i < scores.length; i++) {
            thisScore += scores[i]
        }
        return thisScore >= 500
    }
    self.checkPlusFour = function (player) {
        let action = this.round.checkPlusFour(player)
        this.sendGameStatus(action)
    }
    self.disconnect = function (socketId) {
        const player = this.getPlayerBySocketId(socketId)
        if (player) {
            if (player.isPlaying) {
                player.socket = null
            }
            else {
                for (let i = 0; i < this.players.length; i++) {
                    if (player.id === this.players[i].id) {
                        return this.removePlayer(i)
                    }
                }
            }
            return true
        }
        return false
    }
    self.getPlayingPlayers = function () {
        return this.players.filter(function (player) {
            return player.isPlaying
        })
    }
    self.getPlayerWithTurn = function () {
        let playingPlayers = this.getPlayingPlayers()
        let length = playingPlayers.length
        return length > 0 ? playingPlayers[this.round.turn.playerIndex % length] : null
    }
    self.hasTurn = function (player) {
        let playerWithTurn = this.getPlayerWithTurn()
        if (!playerWithTurn) {
            return false
        }
        return playerWithTurn.id === player.id
    }
    self.leave = function (socketId) {
        for (let i = 0; i < this.players.length; i++) {
            let socket = this.players[i].socket
            if (socket && socket.id === socketId) {
                return this.removePlayer(i)
            }
        }
        return null
    }
    self.removePlayer = function (index) {
        if (index < 0 || index >= this.players.length) {
            return false
        }
        if (this.round.turn.playerIndex === index && this.turnRotation === -1) {
            // switch turn if leaving player has turn
            this.turnSwitch()
        }
        else if (this.round.turn.playerIndex > index) {
            // make sure later player doesn't lose turn
            this.round.turn.playerIndex = this.round.turn.playerIndex - 1
        }
        let player = this.players.splice(index, 1)
        this.round.players.splice(index, 1)
        if (this.getPlayingPlayers().length === 0) {
            this.state = 'NOT_STARTED'
        }
        let length = this.players.length
        this.round.turn.playerIndex = this.round.turn.playerIndex % length
        this.sendGameStatus()
        return player[0]
    }
    self.startNewGame = function () {
        this.state = 'NOT_STARTED'
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].scores = []
        }
        return this.dealNewRound()
    }
    self.dealNewRound = function (deck) {
        if (this.state !== 'NOT_STARTED' && this.state !== 'ROUND_FINISHED') {
            return false
        }
        let players = this.getPlayingPlayers()
        let playerScores = []
        let numberOfPlayers = players.length
        for (let i = 0; i < numberOfPlayers; i++) {
            playerScores[i] = players[i].scores.reduce(add, 0)
        }
        let sumOfScores = playerScores.reduce(add, 0)
        let numberOfDecks = Math.ceil(this.players.length * 7 / 100)
        if (!deck) {
            deck = CardDeck(numberOfDecks)
        }
        this.round = Round(deck)
        let i = 0
        while (i < this.players.length) {
            let currentPlayer = this.players[i]
            if (currentPlayer.socket) {
                currentPlayer.cards = []
                this.round.drawCards(currentPlayer, 7)
                currentPlayer.isPlaying = true
                if (this.playMultiple) {
                    currentPlayer.playMultiple = true
                }
                i++
            }
            else {
                // Remove disconnected player
                this.removePlayer(i)
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            if (typeof currentPlayer.scores[currentPlayer.scores.length - 1] === 'undefined') {
                let score = 0
                if (this.startScore === START_SCORE_AVERAGE) {
                    score = Math.round(sumOfScores / numberOfPlayers)
                }
                else if (this.startScore === START_SCORE_MEDIAN) {
                    let middleIndex = Math.floor(playerScores.length / 2)
                    if (playerScores.length % 2 === 1) {
                        // length is odd
                        score = playerScores[middleIndex]
                    }
                    else {
                        // length is even
                        score = Math.round((playerScores[middleIndex - 1] + playerScores[middleIndex]) / 2)
                    }
                }
                else if (this.startScore === START_SCORE_MIN) {
                    score = Math.min(...playerScores)
                }
                else if (this.startScore === START_SCORE_MAX) {
                    score = Math.max(...playerScores)
                }
                currentPlayer.scores[this.players[0].scores.length - 1] = score
            }
        }
        this.playMulVal = null
        this.plusFourInPlay = false
        this.plusTwoInPlay = 0
        this.turnRotation = 1
        this.turnSkip = 1
        let card = deck.drawCard()
        while (card.value === '+4' || (this.startNeutral && card.value === 'W')) {
            // can't start with a +4 (or a W when starting neutral), try again
            deck.availableCards.push(card)
            deck.shuffleCards(deck.availableCards)
            card = deck.drawCard()
        }
        this.round.players = this.players.slice(0)
        this.state = 'PLAYING'
        this.round.deck.playCard(card)
        let plusTwoInPlay = 0
        let turnIncrement = 1
        if (!this.startNeutral) {
            switch (card.value) {
                case '+2':
                    plusTwoInPlay = 1
                    break;
                case 'S':
                    turnIncrement = 2
                    break;
                case 'R':
                    turnIncrement = 0
                    this.round.turnRotation = -1
                    break;
                default:
                    break;
            }
        }
        this.round.switchTurn(turnIncrement, false, plusTwoInPlay)
        this.sendGameStatus()
        return true
    }
    self.drawCards = function (player, number = 1) {
        let drawCount = this.round.turn.getDrawCount()
        let result = this.round.drawCards(player, number);
        if (!result) {
            return false
        }
        player.drawnCards = result
        let playerIndex = 0;
        for (let i = 0; i < this.round.players.length; i++) {
            if (this.round.players[i].id == player.id) {
                playerIndex = i;
                break;
            }
        }
        if (number > 1) {
            drawCount = number
        }
        this.sendGameStatus({ type: 'drawCards', drawCount: drawCount, playerIndex: playerIndex })
    }
    self.pressEitt = function (player) {
        let pressedEitt = this.round.pressEitt(player)
        this.sendGameStatus()
        return pressedEitt
    }
    self.turnSwitch = function () {
        if (this.round.state === 'FINISHED' && this.state !== 'ROUND_FINISHED') {
            this.state = 'ROUND_FINISHED'
            self.addScoresForRound()
            self.sendGameStatus()
            return
        }
        this.round.switchTurn()
    }
    self.sendGameStatus = function (action) {
        if (this.round.state === 'FINISHED' && this.state !== 'ROUND_FINISHED') {
            this.state = 'ROUND_FINISHED'
            self.addScoresForRound()
        }
        let pack = [];
        let lastPlayerIndex = this.round.previousTurn ? this.round.previousTurn.playerIndex : -1;
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            pack.push({
                name: currentPlayer.name,
                numberOfCards: currentPlayer.cards.length,
                connected: Boolean(currentPlayer.socket),
                hasTurn: this.hasTurn(currentPlayer),
                isPlaying: currentPlayer.isPlaying,
                pressedEitt: currentPlayer.pressedEitt,
                scores: currentPlayer.scores,
                style: currentPlayer.style
            });
        }
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            let hasTurn = this.hasTurn(currentPlayer)
            let gameStatus = {
                id: currentPlayer.id,
                index: i,
                action: action ? action : null,
                canPass: this.round.turn.hasDrawn,
                cards: currentPlayer.cards,
                cardsToPlay: currentPlayer.cardsToPlay,
                drawCount: this.round.turn.getDrawCount(),
                hasTurn: hasTurn,
                playMultiple: this.playMultiple,
                playerList: pack,
                plusFourInPlay: this.round.turn.plusFourInPlay,
                lastPlayedCards: this.round.deck.getLastPlayedCards(),
                lastPlayedIndex: this.lastPlayedIndex,
                lastPlayerIndex: lastPlayerIndex,
                roundWinner: this.round.winner,
                state: this.state,
                drawnCards: currentPlayer.drawnCards,
            };
            currentPlayer.emit('gameStatus', gameStatus);
        }
    }
    return self
}

GameControler.START_SCORE_AVERAGE = START_SCORE_AVERAGE
GameControler.START_SCORE_MEDIAN = START_SCORE_MEDIAN
GameControler.START_SCORE_MIN = START_SCORE_MIN
GameControler.START_SCORE_MAX = START_SCORE_MAX
GameControler.START_SCORE_ZERO = START_SCORE_ZERO
