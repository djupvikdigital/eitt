import { CardDeck } from './CardDeck.js'
import { Player } from './Player.js'

function add(a, b) {
    return a + b
}

const START_SCORE_AVERAGE = 0
const START_SCORE_MEDIAN = 1
const START_SCORE_MIN = 2
const START_SCORE_MAX = 3
const START_SCORE_ZERO = 4

export function GameControler(room, roomList) {
    let self = {
        room: room,
        deck: null,
        lastPlayedIndex: -1,
        lastPlayerId: 0,
        players: [],
        plusTwoInPlay: 0,
        plusFourInPlay: false,
        roundWinner: '',
        startNeutral: false,
        playMultiple: false,
        startScore: START_SCORE_AVERAGE,
        state: 'NOT_STARTED',
        turn: 0,
        turnRotation: 1,
        turnSkip: 1,
        playMulVal: null
    }
    self.addScoresForRound = function () {
        let scores = this.calculateScores()
        let idWithHighestScore = 0
        let highestScore = 0
        let players = this.getPlayingPlayers()
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
                this.turn = i
            }
            currentPlayer.pressedEitt = false
        }
        if (highestScore >= 500) this.state = 'FINISHED'
        this.sendGameStatus()
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
    self.checkPlusFour = function (player) {
        if (this.plusFourInPlay) {
            const playedCards = this.deck.playedCards
            const index = playedCards.length - 2
            const prevColor = index >= 0 && playedCards[index] ? playedCards[index].color : ''
            const checkedPlayer = this.getPlayerByPlayerId(this.lastPlayerId)
            if (checkedPlayer) {
                const cardsWithPrevColor = checkedPlayer.cards.filter(function(card){
                    return card.color === prevColor
                })
                if (cardsWithPrevColor.length > 0) {
                    // checked player played +4 while still having previous color
                    // checked player must draw 4 instead, and turn doesn't switch
                    this.drawCards(checkedPlayer, 4)
                    this.plusFourInPlay = false
                }
                else {
                    // checked player is innocent, checking player gets 6 cards
                    this.drawCards(player, 6)
                    this.plusFourInPlay = false
                    this.turnSwitch()
                }
                this.sendGameStatus()
            }
        }
    }
    self.connect = function (socket, playerId) {
        let player = null
        if (playerId) {
            player = this.getPlayerByPlayerId(playerId)
            if (player && player.socket) {
                // this player is already connected
                player = null
            }
        }
        if (!player) {
            player = Player()
            this.players.push(player)
        }
        player.socket = socket
        return player
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
    self.getConnectedPlayers = function () {
        return this.players.filter(function (player) {
            return player.socket
        })
    }
    self.getPlayingPlayers = function () {
        return this.players.filter(function (player) {
            return player.isPlaying
        })
    }
    self.getPlayerByPlayerId = function (playerId) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === playerId) {
                return this.players[i]
            }
        }
        return null
    }
    self.getPlayerBySocketId = function (socketId) {
        for (let i = 0; i < this.players.length; i++) {
            let socket = this.players[i].socket
            if (socket && socket.id === socketId) {
                return this.players[i]
            }
        }
        return null
    }
    self.getPlayerWithTurn = function () {
        let playingPlayers = this.getPlayingPlayers()
        let length = playingPlayers.length
        return length > 0 ? playingPlayers[this.turn % length] : null
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
        return false
    }
    self.removePlayer = function (index) {
        if (index < 0 || index >= this.players.length) {
            return false
        }
        if (this.turn === index && this.turnRotation === -1) {
            // switch turn if leaving player has turn
            this.turnSwitch()
        }
        else if (this.turn > index) {
            // make sure later player doesn't lose turn
            this.turn = this.turn - 1
        }
        this.players.splice(index, 1)
        if (this.getPlayingPlayers().length === 0) {
            this.state = 'NOT_STARTED'
        }
        let length = this.players.length
        this.turn = this.turn % length
        this.sendGameStatus()
        return true
}
    self.sortCards = function (cards) {
        cards.sort(function(a, b){
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
        let i = 0
        while (i < this.players.length) {
            let currentPlayer = this.players[i]
            if (currentPlayer.socket) {
                let cards = deck.drawCards(7)
                this.sortCards(cards)
                currentPlayer.cards = cards
                currentPlayer.isPlaying = true
                i++
            }
            else {
                // Remove disconnected player
                this.removePlayer(i)
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            if (typeof currentPlayer.scores[currentPlayer.scores.length -1] === 'undefined') {
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
        this.deck = deck
        this.state = 'PLAYING'
        if (this.startNeutral) {
            // avoid special card having effect
            this.deck.playCard(card)
        }
        else {
            this.playCard(card)
        }
        if (card.value !== 'R' || this.startNeutral) {
            // let dealer start if starting with reverse card unless starting neutral
            this.turnSwitch()
        }
    this.sendGameStatus()
        return true
    }
    self.drawCards = function (player, number = 1) {
        let turn = false
        if (number === 1) {
            if (!this.hasTurn(player) || player.hasDrawn || this.playMulVal) {
                return
            }
            if (this.plusFourInPlay) {
                number = 4
                this.plusFourInPlay = false
                turn = true
            }
            else if (this.plusTwoInPlay) {
                number = this.plusTwoInPlay * 2;
                this.plusTwoInPlay = 0
                turn = true
            }
            else {
                player.hasDrawn = true
            }
        }
        player.cards = player.cards.concat(this.deck.drawCards(number));
        this.sortCards(player.cards);
        player.pressedEitt = false
        if (turn) {
            this.turnSwitch()
        }
        this.sendGameStatus()
    }
    self.playCard = function (card) {
        if (this.state !== 'PLAYING' && this.state !== 'ROUND_FINISHING') {
            return false
        }
        if (this.plusFourInPlay) {
            return false
        }
        if (this.plusTwoInPlay > 0 && card.value !== '+2') {
            return false
        }
        if (this.plusTwoInPlay === 0 && this.state === 'ROUND_FINISHING') {
            return false
        }
        const gotPlayed = this.deck.playCard(card, this.playMulVal)
        if (!gotPlayed) {
            return false
        }
        if (card.value == '+4') this.plusFourInPlay = true
        else if (card.value == '+2') this.plusTwoInPlay = this.plusTwoInPlay + 1
        else if (card.value == 'R') this.turnRotation = (this.turnRotation * -1)
        else if (card.value == 'S') this.turnSkip = this.turnSkip + 1
        return true
    }
    self.playCardFromPlayer = function (player, index, color = '') {
        if (!this.hasTurn(player) || index < 0 || index >= player.cards.length) {
            return false
        }
        let card = player.cards[index]
        if (card.color === 'black' && color) {
            if (!this.deck.colors.includes(color)) {
                return false
            }
            card = Object.assign({}, card, { color: color })
        }
        const gotPlayed = this.playCard(card)
        if (!gotPlayed) {
            return false
        }
        this.lastPlayedIndex = index
        player.playCount++
        if (this.playMultiple) {
            this.playMulVal = card.value
        }
        // remove played card from player cards
        player.cards.splice(index, 1)
        player.hasDrawn = false
        this.lastPlayerId = player.id
        if (player.cards.length === 0) {
            if (card.value === '+2' || card.value === '+4') {
                this.state = 'ROUND_FINISHING'
            }
            else {
                this.state = 'ROUND_FINISHED'
            }
            this.roundWinner = player.name
        }
        if (!this.playMultiple || this.deck.wildCards.includes(card.value) || this.state == 'ROUND_FINISHED') {
            this.turnSwitch()
        }
        this.sendGameStatus()
        return true
    }
    self.pressEitt = function (player) {
        if ((this.hasTurn(player) && player.cards.length === 2) || (this.lastPlayerId === player.id && player.cards.length === 1)) {
            player.pressedEitt = true
            this.sendGameStatus()
        }
        return player.pressedEitt
    }
    self.turnSwitch = function () {
        if (this.state === 'ROUND_FINISHED' || (this.state === 'ROUND_FINISHING' && !this.plusTwoInPlay && !this.plusFourInPlay)) {
            this.state = 'ROUND_FINISHED'
            self.addScoresForRound()
            return
        }
        let length = this.getPlayingPlayers().length
        this.turn = (this.turn + (1 * this.turnRotation * this.turnSkip) + length) % length
        this.turnSkip = 1;
        this.playMulVal = null
    }
    self.sendGameStatus = function () {
        let pack = [];
        let lastPlayerIndex = -1;
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            if (currentPlayer.id === this.lastPlayerId) {
                lastPlayerIndex = i;
            }
            pack.push({
                name:currentPlayer.name,
                numberOfCards:currentPlayer.cards.length,
                connected:Boolean(currentPlayer.socket),
                hasTurn:this.hasTurn(currentPlayer),
                isPlaying:currentPlayer.isPlaying,
                pressedEitt:currentPlayer.pressedEitt,
                scores:currentPlayer.scores,
                style:currentPlayer.style
            });
        }
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            let drawCount = 1
            if (this.plusFourInPlay) {
                drawCount = 4
            }
            else if (this.plusTwoInPlay) {
                drawCount = this.plusTwoInPlay * 2
            }
            let hasTurn = this.hasTurn(currentPlayer)
            let gameStatus = {
                id: currentPlayer.id,
                index: i,
                canPass: (this.playMulVal && hasTurn) || currentPlayer.hasDrawn,
                cards: currentPlayer.cards,
                drawCount: drawCount,
                hasTurn: hasTurn,
                playCount: currentPlayer.playCount,
                playerList: pack,
                plusFourInPlay: this.plusFourInPlay,
                lastPlayedCard: this.deck && this.deck.getLastPlayedCard(),
                lastPlayedIndex: this.lastPlayedIndex,
                lastPlayerIndex: lastPlayerIndex,
                roundWinner: this.roundWinner,
                state: this.state,
            };
            currentPlayer.emit('gameStatus', gameStatus);
        }
    }
    self.sendRoomStatus = function () {
        let pack = [];
        for(let i in roomList){
            let currentRoom = roomList[i]
            pack.push({
                room:currentRoom.room,
                state:currentRoom.state
            });
        }
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            currentPlayer.emit('roomStatus', pack);
        }
    }
    return self
}

GameControler.START_SCORE_AVERAGE = START_SCORE_AVERAGE
GameControler.START_SCORE_MEDIAN = START_SCORE_MEDIAN
GameControler.START_SCORE_MIN = START_SCORE_MIN
GameControler.START_SCORE_MAX = START_SCORE_MAX
GameControler.START_SCORE_ZERO = START_SCORE_ZERO
