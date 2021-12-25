module.exports = function CardDeck() {
    let colors = ['blue', 'red', 'green', 'yellow'];
    let oneInEachColor = ['0']
    let twoInEachColor = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'R', 'S'];
    let wildCards = ['+4', 'W']
    let cards = []
    for (let color of colors) {
        cards.push({ color: color, value: oneInEachColor[0]})
        for (let i = 0; i < 2; i++) {
            for (let value of twoInEachColor) {
                cards.push({ color: color, value: value })
            }
        }
    }
    for (let i = 0; i < 4; i++) {
        for (let value of wildCards) {
            cards.push({ color: 'black', value: value })
        }
    }
    let self = {
        colors: colors,
        playedCards: []
    }
    self.drawCard = function() {
        if (this.availableCards.length === 0) {
            const lastPlayedCard = this.playedCards.pop()
            this.availableCards = self.shuffleCards(this.playedCards)
            this.playedCards = [lastPlayedCard]
        }
        return this.availableCards.pop()
    }
    self.playCard = function(card) {
        if (!wildCards.includes(card.value) && this.playedCards.length > 0) {
            const lastPlayedCard = this.playedCards[this.playedCards.length - 1]
            if (lastPlayedCard.color !== 'black' && card.color !== lastPlayedCard.color && card.value !== lastPlayedCard.value) {
                return false
            }
        }
        this.playedCards.push(card)
        return true
    }
    self.shuffleCards = function(array) {
        let currentIndex = array.length
        let randomIndex = 0
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
        }
        return array
    }
    self.availableCards = self.shuffleCards(cards)
    return self
}