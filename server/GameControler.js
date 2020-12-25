export function GameControler(room, playerList) {
    let self = {
        room: room,
        connected: [],
        lastPlayedCard: generateCard(),
        plusTwoInPlay: 0,
        plusFourInPlay: false,
        turnRotation: 1,
        turnSkip: 1
    }
    self.drawCards = function () {
        let cards = [];
        let number = 1;
        if (this.lastPlayedCard.value == '+4') {
            number = 4
        }
        else if (this.plusTwoInPlay) {
            number = this.plusTwoInPlay * 2;
        }
        for (let i = 0; i < number; i++) {
            cards.push(generateCard());
        }
        return cards;
    }
    self.turnAssign = function () {
        let hasTurn = false;
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            if (currentPlayer.hasTurn) hasTurn = true;
            currentPlayer.emit('lastPlayed', this.lastPlayedCard)
        }
        if (!hasTurn) {
            let ids = Object.keys(playerList);
            let randomId = ids[Math.floor(Math.random() * ids.length)];
            playerList[randomId].hasTurn = true;
        }
    }
    self.turnSwitch = function () {
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
        if (nextPlayerTurn > (Object.keys(playerList).length - 1)) nextPlayerTurn = (nextPlayerTurn - (Object.keys(playerList).length - 1) - 1);
        if (nextPlayerTurn < 0) nextPlayerTurn = ((Object.keys(playerList).length) + nextPlayerTurn);
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
                name:currentPlayer.name,
                numberOfCards:currentPlayer.cards.length,
                hasTurn:currentPlayer.hasTurn  
            });
        }
        for(let i = 0; i < this.connected.length; i++){
            let currentPlayer = playerList[this.connected[i]]
            let gameStatus = {
                cards: currentPlayer.cards,
                hasTurn: currentPlayer.hasTurn,
                playerList: pack,
            };
            currentPlayer.emit('gameStatus', gameStatus);
        }
    }
    return self
}

export function generateCard() {
    let colors = ['blue', 'red', 'green', 'yellow'];
    let values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'R', 'S', '+4', 'W'];
    let color = 'black';
    let value = values[Math.floor(Math.random() * values.length)];
    if (value !== '+4' && value !== 'W') {
        color = colors[Math.floor(Math.random() * colors.length)];
    }
    return { color, value };
}