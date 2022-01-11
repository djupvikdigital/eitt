import { CardDeck } from './CardDeck.js'
import { Player } from './Player.js'

export function GameControler(room, roomList) {
    let self = {
        room: room,
        deck: null,
        lastPlayerId: 0,
        players: [],
        plusTwoInPlay: 0,
        plusFourInPlay: false,
        roundWinner: '',
        state: 'NOT_STARTED',
        turn: 0,
        turnRotation: 1,
        turnSkip: 1
    }
    self.addScoresForRound = function () {
        let scores = this.calculateScores()
        let idWithHighestScore = 0
        let highestScore = 0
        for (let id in scores) {
            let score = scores[id]
            if (score >= highestScore) {
                highestScore = score
                idWithHighestScore = id
            }
        }
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            let id = currentPlayer.id
            let score = scores[id]
            currentPlayer.scores.push(score)
            if (id === idWithHighestScore) {
                this.turn = i
            }
            currentPlayer.pressedEitt = false
        }
        this.sendGameStatus()
    }
    self.calculateScores = function () {
        let scores = {}
        for (let i = 0; i < this.players.length; i++) {
            let score = 0
            let currentPlayer = this.players[i]
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
    self.dealNewRound = function (deck = CardDeck()) {
        if (this.state !== 'NOT_STARTED' && this.state !== 'ROUND_FINISHED') {
            return false
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
        this.plusFourInPlay = false
        this.plusTwoInPlay = 0
        this.turnRotation = 1
        this.turnSkip = 1
        let card = deck.drawCard()
        while (card.value === '+4') {
            // can't start with a +4, try again
            deck.availableCards.push(card)
            deck.shuffleCards(deck.availableCards)
            card = deck.drawCard()
        }
        this.deck = deck
        this.state = 'PLAYING'
        this.playCard(card)
        if (card.value !== 'R') {
            // let dealer start if starting with reverse card
            this.turnSwitch()
        }
        this.sendGameStatus()
        return true
    }
    self.drawCards = function (player, number = 1) {
        let turn = false
        if (number === 1) {
            if (!this.hasTurn(player) || player.hasDrawn) {
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
        const gotPlayed = this.deck.playCard(card)
        if (!gotPlayed) {
            return false
        }
        if (card.value == '+4') this.plusFourInPlay = true
        else if (card.value == '+2') this.plusTwoInPlay = this.plusTwoInPlay + 1
        else if (card.value == 'R') this.turnRotation = (this.turnRotation * -1)
        else if (card.value == 'S') this.turnSkip = 2
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
        this.turnSwitch()
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
    }
    self.sendGameStatus = function () {
        let pack = [];
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
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
            let gameStatus = {
                id: currentPlayer.id,
                index: i,
                cards: currentPlayer.cards,
                drawCount: drawCount,
                hasDrawn: currentPlayer.hasDrawn,
                hasTurn: this.hasTurn(currentPlayer),
                playerList: pack,
                plusFourInPlay: this.plusFourInPlay,
                lastPlayedCard: this.deck && this.deck.getLastPlayedCard(),
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
                room:currentRoom.room
            });
        }
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            currentPlayer.emit('roomStatus', pack);
        }
    }
    return self
}
