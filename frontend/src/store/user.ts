import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = 'master' | 'player' | null

export const useUserStore = defineStore('user', () => {
  const nickname = ref('')
  const role = ref<UserRole>(null)
  const playerId = ref('')
  const pin = ref('')

  function setNickname(val: string) {
    nickname.value = val
  }

  function setRole(val: UserRole) {
    role.value = val
  }

  function setPlayerId(val: string) {
    playerId.value = val
  }

  function setPin(val: string) {
    pin.value = val
  }

  function reset() {
    nickname.value = ''
    role.value = null
    playerId.value = ''
    pin.value = ''
  }

  return {
    nickname,
    role,
    playerId,
    pin,
    setNickname,
    setRole,
    setPlayerId,
    setPin,
    reset
  }
})
