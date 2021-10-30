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
        const controler = setupControlerWithMocks()
        controler.playCard({ value: '+4' })
        let cards = controler.drawCards()
        expect(cards.length).toBe(4)
        cards = controler.drawCards()
        expect(cards.length).toBe(1)
    })

    it('allows round to continue while +2 is in play', () => {
        const controler = setupControlerWithMocks()
        controler.roundFinished = true
        controler.playCard({ value: '+2' })
        expect(controler.roundFinished).toBe(true)
        const cards = controler.drawCards()
        expect(cards.length).toBe(2)
        expect(controler.roundFinished).toBe(false)
    })

    it('gives new cards after round finish with +2', () => {
        const player = setupMockPlayer()
        const controler = setupControlerWithMocks(player)
        controler.roundFinished = true
        controler.playCard({ value: '+2' })
        const cards = controler.drawCards()
        expect(cards.length).toBe(2)
        expect(player.cards.length).toBe(7)
    })
})