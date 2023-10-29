export function CardDeck(numberOfDecks = 1) {
    let colors = ['blue', 'red', 'green', 'yellow'];
    let oneInEachColor = ['0']
    let twoInEachColor = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'R', 'S'];
    let wildCards = ['+4', 'W']
    let cards = []
    for (let i = 0; i < numberOfDecks; i++) {
        for (let color of colors) {
            cards.push({ color: color, value: oneInEachColor[0]})
            for (let j = 0; j < 2; j++) {
                for (let value of twoInEachColor) {
                    cards.push({ color: color, value: value })
                }
            }
        }
        for (let j = 0; j < 4; j++) {
            for (let value of wildCards) {
                cards.push({ color: 'black', value: value })
            }
        }
    }
    let self = {
        colors: colors,
        playedCards: [],
        wildCards: wildCards
    }
    self.drawCard = function() {
        if (this.availableCards.length === 0) {
            const lastPlayedCard = this.playedCards.pop()
            this.availableCards = self.shuffleCards(this.playedCards)
            this.playedCards = [lastPlayedCard]
        }
        return this.availableCards.pop()
    }
    self.drawCards = function (number) {
        let drawnCards = []
        for (let i = 0; i < number; i++) {
            drawnCards[i] = this.drawCard()
        }
        return drawnCards
    }
    self.getLastPlayedCard = function () {
        return this.playedCards[this.playedCards.length - 1]
    }
    self.isLegitCard = function (card) {
        if (typeof card !== 'object' || !Object.hasOwn(card, 'value')) {
            return false
        }
        return true
    }
    self.isLegitColor = function (color) {
        return this.colors.includes(color)
    }
    self.playCard = function(card, playMulVal) {
        if (!card) throw new Error(JSON.stringify(arguments))
        // if (!this.isLegitCard(card)) {
        //     return false
        // }
        if (!wildCards.includes(card.value) && this.playedCards.length > 0) {
            const lastPlayedCard = this.playedCards[this.playedCards.length - 1]
            if (lastPlayedCard.color !== 'black' && card.color !== lastPlayedCard.color && card.value !== lastPlayedCard.value) {
               return false
            }
        }
        if (playMulVal && card.value != playMulVal) {
            return false
        }
        this.playedCards.push(card)
        return true
    }
    self.playCards = function (cards) {
        for (let i = 0; i < cards.length; i++) {
            let gotPlayed = this.playCard(cards[i])
            if (!gotPlayed) {
                return false
            }
        }
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