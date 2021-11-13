import { CardDeck } from './CardDeck'

describe('CardDeck', () => {
    it('has the correct number of cards', () => {
        const deck = CardDeck()
        expect(deck.availableCards.length).toBe(108)
    })
    it('reshuffles played cards when no available cards are left', () => {
        const deck = CardDeck()
        const drawnCard = deck.drawCard()
        deck.playedCards = deck.availableCards
        deck.availableCards = []
        deck.playCard(drawnCard)
        deck.drawCard()
        expect(deck.availableCards.length).toBe(106)
        expect(deck.playedCards.length).toBe(1)
        expect(deck.playedCards[0]).toEqual(drawnCard)
    })
})