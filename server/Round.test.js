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

    it('disallows playing a card while +4 is in play', () => {
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

    it('disallows playing cards other than +2 while +2 is in play', () => {
        const card = { color: 'blue', value: '+2' }
        const round = Round()
        round.turn.addCardToPlay(card)
        round.playTurn()
        round.turn.addCardToPlay({ color: 'blue', value: '0' })
        round.playTurn()
        expect(round.deck.playedCards.pop()).toEqual(card)
    })

    it('changes turnRotation when reverse card is played', () => {
        const card = { color: 'blue', value: 'R' }
        const round = Round()
        round.turn.addCardToPlay(card)
        round.playTurn()
        expect(round.turnRotation).toBe(-1)
    })

    it('adds to turnSkip when skip card is played', () => {
        const card = { color: 'blue', value: 'S' }
        const round = Round()
        round.turn.addCardToPlay(card)
        round.playTurn()
        expect(round.turn.skip).toBe(2)
    })
})