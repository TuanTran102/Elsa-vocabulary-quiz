import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = 'master' | 'player' | null

export const useUserStore = defineStore('user', () => {
  const nickname = ref('')
  const role = ref<UserRole>(null)
  const playerId = ref('')
  const pin = ref('')
  const score = ref(0)
  const rank = ref(0)

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

  function setScore(val: number) {
    score.value = val
  }

  function setRank(val: number) {
    rank.value = val
  }

  function reset() {
    nickname.value = ''
    role.value = null
    playerId.value = ''
    pin.value = ''
    score.value = 0
    rank.value = 0
  }

  return {
    nickname,
    role,
    playerId,
    pin,
    score,
    rank,
    setNickname,
    setRole,
    setPlayerId,
    setPin,
    setScore,
    setRank,
    reset
  }
})
