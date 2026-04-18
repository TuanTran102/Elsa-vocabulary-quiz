import { io, Socket } from 'socket.io-client'
import { useSessionStore } from '@/store/session'
import { useUserStore } from '@/store/user'
import router from '@/router'

let socket: Socket | null = null

export function useSocket() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  if (!socket) {
    socket = io(`${apiUrl}/live-quiz`, {
      autoConnect: false,
    })

    socket.on('connect', () => {
      const userStore = useUserStore()
      if (userStore.pin && userStore.nickname && userStore.role === 'player') {
        socket.emit('join_quiz', { pin: userStore.pin, nickname: userStore.nickname })
      }
    })

    // Global Listeners
    socket.on('player_joined', (data) => {
      const sessionStore = useSessionStore()
      // Sync the entire players array from the server to avoid state mismatches
      if (data.players && Array.isArray(data.players)) {
        // Map backend player shape (nickname, socketId) to frontend Player shape (id, nickname)
        sessionStore.players.splice(0, sessionStore.players.length, 
          ...data.players.map((p: any) => ({ id: p.socketId || p.id || p.nickname, nickname: p.nickname }))
        )
      } else {
        // Fallback: add the single player if no array is provided
        sessionStore.addPlayer({ id: data.id || data.nickname, nickname: data.nickname })
      }
    })

    socket.on('player_left', ({ playerId }) => {
      const sessionStore = useSessionStore()
      sessionStore.removePlayer(playerId)
    })

    socket.on('quiz_started', () => {
      const userStore = useUserStore()
      const sessionStore = useSessionStore()
      // Only redirect players (not master) to the play page
      // Master stays on HostDashboard to control the game
      if (userStore.role !== 'master' && userStore.pin) {
        router.push(`/play/${userStore.pin}`)
      } else if (!userStore.role && sessionStore.pin) {
        // Fallback: use sessionStore pin if userStore.pin not set
        router.push(`/play/${sessionStore.pin}`)
      }
    })

    socket.on('join_confirmed', ({ playerId, nickname, players }) => {
      const userStore = useUserStore()
      const sessionStore = useSessionStore()
      
      userStore.setPlayerId(playerId)
      userStore.setNickname(nickname)
      
      // Populate the players list from the server response
      if (players && Array.isArray(players)) {
        const mapped = players.map((p: any) => ({ 
          id: p.socketId || p.id || p.nickname, 
          nickname: p.nickname 
        }))
        sessionStore.players.splice(0, sessionStore.players.length, ...mapped)
      }
    })

    socket.on('quiz_completed', () => {
      const userStore = useUserStore()
      if (userStore.role !== 'master' && userStore.pin) {
        router.push(`/results/${userStore.pin}`)
      }
    })

    socket.on('host_disconnected', () => {
      console.warn('Host disconnected')
      // Optional: global redirect or toast
    })
  }

  const connect = () => {
    socket?.connect()
  }

  const disconnect = () => {
    socket?.disconnect()
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    socket?.on(event, callback)
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socket?.off(event, callback)
  }

  const emit = (event: string, data: any) => {
    socket?.emit(event, data)
  }

  return {
    socket,
    connect,
    disconnect,
    on,
    off,
    emit,
  }
}
