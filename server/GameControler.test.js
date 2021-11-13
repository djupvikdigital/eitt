import { jest } from '@jest/globals'

import { GameControler } from './GameControler'
import { Player } from './Player'

jest.useFakeTimers()

function noop() {
    return
}

function setupControlerWithMocks(player = setupMockPlayer()) {
    const controler = GameControler('', { [player.id]: player }, { 0: {}})
    controler.connected = [player.id]
    return controler
}

function setupMockPlayer() {
    const playerId = 0
    return Player(playerId, { 0: { emit: noop }})
}

describe('GameControler', () => {
    it('sets plusFourInPlay to true', () => {
        const controler = setupControlerWithMocks()
        expect(controler.plusFourInPlay).toBe(false)
        controler.playCard({ value: '+4' })
        expect(controler.plusFourInPlay).toBe(true)
    })

    it('does not draw 4 two times after plusFourInPlay', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.playCard({ value: '+4' })
        controler.drawCards(player)
        expect(player.cards.length).toBe(4)
        controler.drawCards(player)
        expect(player.cards.length).toBe(5)
    })

    it('allows round to continue while +2 is in play', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.roundFinished = true
        controler.playCard({ value: '+2' })
        expect(controler.roundFinished).toBe(true)
        controler.drawCards(player)
        expect(player.cards.length).toBe(7)
        expect(controler.roundFinished).toBe(false)
    })

    it('correctly calculates scores for numbered cards', () => {
        const player = setupMockPlayer()
        const cards = [
            { value: '0' },
            { value: '1' },
            { value: '2' },
            { value: '3' },
            { value: '4' },
            { value: '5' },
            { value: '6' },
            { value: '7' },
            { value: '8' },
            { value: '9' }
        ]
        player.cards = cards
        const controler = setupControlerWithMocks(player)
        const scores = controler.calculateScores()
        expect(scores[0]).toBe(45)
    })

    it('correctly calculates scores for special cards', () => {
        const player = setupMockPlayer()
        const cards = [
            { value: '+2' },
            { color: 'black', value: '+4' },
            { value: 'R' },
            { value: 'S' },
            { color: 'black', value: 'W' }
        ]
        player.cards = cards
        const controler = setupControlerWithMocks(player)
        const scores = controler.calculateScores()
        expect(scores[0]).toBe(160)
    })

    it('draws 3 cards even when plusFourInPlay is true', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.plusFourInPlay = true
        controler.drawCards(player, 3)
        expect(player.cards.length).toBe(3)
    })
})