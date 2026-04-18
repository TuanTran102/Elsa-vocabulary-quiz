import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useUserStore } from '@/store/user'

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have initial state', () => {
    const store = useUserStore()
    expect(store.nickname).toBe('')
    expect(store.role).toBeNull()
    expect(store.playerId).toBe('')
    expect(store.pin).toBe('')
  })

  it('should set nickname', () => {
    const store = useUserStore()
    store.setNickname('Alice')
    expect(store.nickname).toBe('Alice')
  })

  it('should set role', () => {
    const store = useUserStore()
    store.setRole('player')
    expect(store.role).toBe('player')
  })

  it('should set playerId', () => {
    const store = useUserStore()
    store.setPlayerId('123')
    expect(store.playerId).toBe('123')
  })

  it('should set pin', () => {
    const store = useUserStore()
    store.setPin('654321')
    expect(store.pin).toBe('654321')
  })

  it('should reset state', () => {
    const store = useUserStore()
    store.setNickname('Alice')
    store.setRole('master')
    store.setPlayerId('123')
    store.setPin('111111')
    
    store.reset()
    
    expect(store.nickname).toBe('')
    expect(store.role).toBeNull()
    expect(store.playerId).toBe('')
    expect(store.pin).toBe('')
  })
})
