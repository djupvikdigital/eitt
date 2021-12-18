import { CardDeck } from './CardDeck.js'
import { Player } from './Player.js'

export function GameControler(room, roomList) {
    let self = {
        room: room,
        connected: [],
        deck: CardDeck(),
        lastPlayerId: 0,
        players: [],
        plusTwoInPlay: 0,
        plusFourInPlay: false,
        roundFinished: false,
        roundWinner: '',
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
            currentPlayer.hasTurn = id === idWithHighestScore
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
            player.socket = null
            return true
        }
        return false
    }
    self.getConnectedPlayers = function () {
        return this.players.filter(function (player) {
            return player.socket
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
    self.leave = function (socketId) {
        for (let i = 0; i < this.players.length; i++) {
            let socket = this.players[i].socket
            if (socket && socket.id === socketId) {
                this.players.splice(i, 1)
                return true
            }
        }
        return false
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
    self.dealCards = function () {
        let cards = [];
        for (let i = 0; i < 7; i++) {
            cards.push(this.deck.drawCard());
        }
        this.sortCards(cards);
        return cards
    }
    self.dealNewRound = function (deck = CardDeck()) {
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            currentPlayer.cards = this.dealCards()
        }
        this.plusFourInPlay = false
        this.plusTwoInPlay = 0
        this.roundFinished = false
        this.turnRotation = 1
        this.turnSkip = 1
        this.deck = deck
        let card = this.deck.drawCard()
        while (card.value === '+4') {
            // can't start with a +4, try again
            this.deck = CardDeck()
            card = this.deck.drawCard()
        }
        this.playCard(card)
        if (card.value !== 'R') {
            // let dealer start if starting with reverse card
            this.turnSwitch()
        }
        for (let i = 0; i < this.players.length; i++) {
            let currentPlayer = this.players[i]
            currentPlayer.emit('newRound');
        }
        this.sendGameStatus()
    }
    self.drawCards = function (player, number = 1) {
        let cards = [];
        let turn = false
        if (number === 1) {
            if (!player.hasTurn || player.hasDrawn) {
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
        for (let i = 0; i < number; i++) {
            cards.push(this.deck.drawCard());
        }
        player.cards = player.cards.concat(cards);
        this.sortCards(player.cards);
        player.pressedEitt = false
        if (turn) {
            this.turnSwitch()
        }
        this.sendGameStatus()
    }
    self.playCard = function (card) {
        if (this.plusFourInPlay || (this.plusTwoInPlay > 0 && card.value !== '+2')) {
            return false
        }
        const gotPlayed = this.deck.playCard(card)
        if (!gotPlayed) {
            return false
        }
        this.lastPlayedCard = card
        if (card.value == '+4') this.plusFourInPlay = true
        else if (card.value == '+2') this.plusTwoInPlay = this.plusTwoInPlay + 1
        else if (card.value == 'R') this.turnRotation = (this.turnRotation * -1)
        else if (card.value == 'S') this.turnSkip = 2
        this.pressedEitt = false
        return true
    }
    self.playCardFromPlayer = function (player, index, color = '') {
        if (!player.hasTurn || index < 0 || index >= player.cards.length) {
            return false
        }
        const card = player.cards[index]
        if (card.color === 'black' && color) {
            if (!this.deck.colors.includes(color)) {
                return false
            }
            card.color = color
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
            this.roundFinished = true
            this.roundWinner = player.name
        }
        this.turnSwitch()
        this.sendGameStatus()
        return true
    }
    self.turnAssign = function () {
        let hasTurn = false;
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            if (currentPlayer.hasTurn) hasTurn = true;
        }
        if (!hasTurn) {
            let randomPlayer = this.players[Math.floor(Math.random() * this.players.length)];
            randomPlayer.hasTurn = true;
        }
    }
    self.turnSwitch = function () {
        if (this.roundFinished && !this.plusTwoInPlay && !this.plusFourInPlay) {
            self.addScoresForRound()
            for (let i = 0; i < this.players.length; i++) {
                let currentPlayer = this.players[i]
                currentPlayer.emit('roundWinner', this.roundWinner)
            }
            return
        }
        let length = this.players.length
        for (let i = 0; i < length; i++) {
            let currentPlayer = this.players[i]
            if (currentPlayer.hasTurn){
                let nextPlayerTurn = (i + (1 * this.turnRotation * this.turnSkip) + length) % length;
                currentPlayer.hasTurn = false;
                this.players[nextPlayerTurn].hasTurn = true
                this.turnSkip = 1;
                break
            }
        }
    }
    self.sendGameStatus = function () {
        let pack = [];
        for(let i = 0; i < this.players.length; i++){
            let currentPlayer = this.players[i]
            pack.push({
                id:currentPlayer.id,
                name:currentPlayer.name,
                numberOfCards:currentPlayer.cards.length,
                hasTurn:currentPlayer.hasTurn,
                pressedEitt:currentPlayer.pressedEitt,
                scores:currentPlayer.scores
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
                cards: currentPlayer.cards,
                drawCount: drawCount, 
                hasTurn: currentPlayer.hasTurn,
                playerList: pack,
                lastPlayedCard: this.lastPlayedCard
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
    let card = self.deck.drawCard()
    while (card.value === '+4') {
        // can't start with a +4, try again
        self.deck = CardDeck()
        card = self.deck.drawCard()
    }
    self.playCard(card)
    return self
}
