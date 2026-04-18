import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '@/store/session'

describe('Session Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have initial state', () => {
    const store = useSessionStore()
    expect(store.pin).toBe('')
    expect(store.gameRoomId).toBe('')
    expect(store.quizTitle).toBe('')
    expect(store.status).toBe('waiting')
    expect(store.players).toEqual([])
  })

  it('should set session info', () => {
    const store = useSessionStore()
    store.setSession({
      pin: '123456',
      gameRoomId: 'room1',
      quizTitle: 'Vocab Quiz',
      status: 'waiting',
      players: []
    })
    expect(store.pin).toBe('123456')
    expect(store.quizTitle).toBe('Vocab Quiz')
  })

  it('should add player and prevent duplicates', () => {
    const store = useSessionStore()
    store.addPlayer({ id: 'p1', nickname: 'Alice' })
    store.addPlayer({ id: 'p2', nickname: 'Bob' })
    store.addPlayer({ id: 'p1', nickname: 'Alice' }) // Duplicate ID

    expect(store.players).toHaveLength(2)
    expect(store.players[0].nickname).toBe('Alice')
    expect(store.players[1].nickname).toBe('Bob')
  })

  it('should remove player', () => {
    const store = useSessionStore()
    store.addPlayer({ id: 'p1', nickname: 'Alice' })
    store.addPlayer({ id: 'p2', nickname: 'Bob' })
    
    store.removePlayer('p1')
    
    expect(store.players).toHaveLength(1)
    expect(store.players[0].id).toBe('p2')
  })

  it('should set status', () => {
    const store = useSessionStore()
    store.setStatus('in_progress')
    expect(store.status).toBe('in_progress')
  })

  it('should reset state', () => {
    const store = useSessionStore()
    store.setSession({
      pin: '123456',
      gameRoomId: 'room1',
      quizTitle: 'Test',
      status: 'in_progress',
      players: [{ id: '1', nickname: 'A' }]
    })
    
    store.reset()
    
    expect(store.pin).toBe('')
    expect(store.gameRoomId).toBe('')
    expect(store.players).toEqual([])
    expect(store.status).toBe('waiting')
  })
})
