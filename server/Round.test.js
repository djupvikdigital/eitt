import { CardDeck } from './CardDeck'
import { Round } from './Round'
import { Turn } from './Turn'

describe('Round', () => {
    it('can play a turn', () => {
        let card = { color: 'blue', value: 1 }
        let round = Round()
        round.turn.addCardToPlay(card)
        round.playTurn()
        let playedCard = round.deck.playedCards[round.deck.playedCards.length - 1]
        expect(playedCard).toEqual(card)
    })

    it('playing +4 makes playing another card impossible', () => {
        let card = { color: 'black', value: '+4' }
        let round = Round()
        round.turn.addCardToPlay(card)
        let played = round.playTurn()
        expect(played).toBe(true)
        card = { color: 'green', value: 1 }
        round.turn.addCardToPlay(card)
        played = round.playTurn()
        expect(played).toBe(false)
    })
})