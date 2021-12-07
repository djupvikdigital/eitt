import { CardDeck } from './CardDeck.js'

export function GameControler(room, playerList, roomList) {
    let self = {
        room: room,
        connected: [],
        deck: CardDeck(),
        lastPlayerId: 0,
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
        for (let i = 0; i < this.connected.length; i++) {
            let id = this.connected[i]
            let currentPlayer = playerList[id]
            let score = scores[id]
            if (currentPlayer.scores.length > 0) {
                score += currentPlayer.scores[currentPlayer.scores.length - 1]
            }
            currentPlayer.scores.push(score)
            currentPlayer.hasTurn = false
            currentPlayer.pressedEitt = false
        }
        playerList[idWithHighestScore].hasTurn = true
        this.sendGameStatus()
    }
    self.calculateScores = function () {
        let scores = {}
        for (let i = 0; i < this.connected.length; i++) {
            let score = 0
            let id = this.connected[i]
            let currentPlayer = playerList[id]
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
            scores[id] = score
        }
        return scores
    }
    self.dealCards = function () {
        let cards = [];
        for (let i = 0; i < 7; i++) {
            cards.push(this.deck.drawCard());
        }
        return cards
    }
    self.dealNewRound = function (deck = CardDeck()) {
        for (let i = 0; i < this.connected.length; i++) {
            let id = this.connected[i]
            let currentPlayer = playerList[id]
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
        let connected = this.connected
        for(let i = 0; i < connected.length; i++){
            let currentPlayer = playerList[connected[i]]
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
        }
        for (let i = 0; i < number; i++) {
            cards.push(this.deck.drawCard());
        }
        player.cards = player.cards.concat(cards);
        player.pressedEitt = false
        if (turn) {
            this.turnSwitch()
        }
    }
    self.playCard = function (card) {
        this.lastPlayedCard = card
        this.deck.playCard(card)
        if (card.value == '+4') this.plusFourInPlay = true
        else if (card.value == '+2') this.plusTwoInPlay = this.plusTwoInPlay + 1
        else if (card.value == 'R') this.turnRotation = (this.turnRotation * -1)
        else if (card.value == 'S') this.turnSkip = 2
        this.pressedEitt = false
}
    self.turnAssign = function () {
        let hasTurn = false;
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            if (currentPlayer.hasTurn) hasTurn = true;
        }
        if (!hasTurn) {
            let randomId = this.connected[Math.floor(Math.random() * this.connected.length)];
            playerList[randomId].hasTurn = true;
        }
    }
    self.turnSwitch = function () {
        if (this.roundFinished && !this.plusTwoInPlay && !this.plusFourInPlay) {
            self.addScoresForRound()
            let connected = this.connected
            for (let i = 0; i < connected.length; i++) {
                let currentPlayer = playerList[connected[i]]
                currentPlayer.emit('roundWinner', this.roundWinner)
            }
            return
        }
        let nextPlayer = 0;
        let nextPlayerTurn = 99;
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            if (currentPlayer.hasTurn){
                nextPlayerTurn = nextPlayer + (1 * this.turnRotation * this.turnSkip);
                currentPlayer.hasTurn = false;
                this.turnSkip = 1;
            }
            nextPlayer++;
        }
        while(nextPlayerTurn > (this.connected.length - 1)) nextPlayerTurn = nextPlayerTurn - this.connected.length;
        while(nextPlayerTurn < 0) nextPlayerTurn = this.connected.length + nextPlayerTurn
        nextPlayer = 0;
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            if (nextPlayer == nextPlayerTurn) {
                currentPlayer.hasTurn = true;
            }
            nextPlayer++;
        }
    }
    self.sendGameStatus = function () {
        let pack = [];
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            pack.push({
                id:currentPlayer.id,
                name:currentPlayer.name,
                numberOfCards:currentPlayer.cards.length,
                hasTurn:currentPlayer.hasTurn,
                pressedEitt:currentPlayer.pressedEitt,
                scores:currentPlayer.scores
            });
        }
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
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
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
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
