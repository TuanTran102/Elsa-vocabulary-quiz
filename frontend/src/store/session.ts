import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Player {
  id: string
  nickname: string
}

export interface SessionInfo {
  pin: string
  gameRoomId: string
  quizTitle: string
  status: string
  players: Player[]
}

export const useSessionStore = defineStore('session', () => {
  const pin = ref('')
  const gameRoomId = ref('')
  const quizTitle = ref('')
  const status = ref('waiting')
  const players = ref<Player[]>([])

  function setSession(info: SessionInfo) {
    pin.value = info.pin
    gameRoomId.value = info.gameRoomId
    quizTitle.value = info.quizTitle
    status.value = info.status
    players.value = info.players
  }

  function addPlayer(player: Player) {
    if (!players.value.find(p => p.id === player.id)) {
      players.value.push(player)
    }
  }

  function removePlayer(playerId: string) {
    players.value = players.value.filter(p => p.id !== playerId)
  }

  function setStatus(newStatus: string) {
    status.value = newStatus
  }

  function reset() {
    pin.value = ''
    gameRoomId.value = ''
    quizTitle.value = ''
    status.value = 'waiting'
    players.value = []
  }

  return {
    pin,
    gameRoomId,
    quizTitle,
    status,
    players,
    setSession,
    addPlayer,
    removePlayer,
    setStatus,
    reset
  }
})
