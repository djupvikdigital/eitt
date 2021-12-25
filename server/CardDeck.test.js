let CardDeck = require('./CardDeck.js');

describe('CardDeck', () => {
    it('has the correct number of cards', () => {
        const deck = CardDeck()
        expect(deck.availableCards.length).toBe(108)
    })
    it('always returns a card object', () => {
        const deck = CardDeck()
        const length = deck.availableCards.length
        for (let i = 0; i < length; i++) {
            expect(Object.keys(deck.drawCard())).toEqual(['color', 'value'])
        }
    })
    it('reshuffles played cards when no available cards are left', () => {
        const deck = CardDeck()
        const drawnCard = deck.drawCard()
        deck.playedCards = deck.availableCards
        deck.availableCards = []
        deck.playedCards.push(drawnCard)
        deck.drawCard()
        expect(deck.availableCards.length).toBe(106)
        expect(deck.playedCards.length).toBe(1)
        expect(deck.playedCards[0]).toEqual(drawnCard)
    })
    it('allows playing a card with same color', () => {
        const deck = CardDeck()
        const card = { color: 'blue', value: '0' }
        deck.playedCards = [{ color: 'blue', value: '1' }]
        deck.playCard(card)
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
    it('allows playing a card with same value', () => {
        const deck = CardDeck()
        const card = { color: 'blue', value: '0' }
        deck.playedCards = [{ color: 'green', value: '0' }]
        deck.playCard(card)
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
    it('allows playing a wild card', () => {
        const deck = CardDeck()
        const card = { color: 'black', value: 'W' }
        deck.playedCards = [{ color: 'green', value: '0' }]
        deck.playCard(card)
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
    it('allows playing a +4', () => {
        const deck = CardDeck()
        const card = { color: 'black', value: '+4' }
        deck.playedCards = [{ color: 'green', value: '0' }]
        deck.playCard(card)
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
    it('allows playing any color on top of black', () => {
        const deck = CardDeck()
        const card = { color: 'green', value: '0' }
        deck.playedCards = [{ color: 'black', value: 'W' }]
        deck.playCard(card)
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
    it('disallows playing a card with wrong color or value', () => {
        const deck = CardDeck()
        const card = { color: 'blue', value: '0' }
        deck.playedCards = [card]
        deck.playCard({ color: 'green', value: '1' })
        expect(deck.playedCards[deck.playedCards.length - 1]).toEqual(card)
    })
})