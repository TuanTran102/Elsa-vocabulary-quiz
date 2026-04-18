import { io, Socket } from 'socket.io-client'
import { useSessionStore } from '@/store/session'
import { useUserStore } from '@/store/user'
import router from '@/router'

let socket: Socket | null = null

export function useSocket() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  if (!socket) {
    socket = io(apiUrl, {
      autoConnect: false,
    })

    // Global Listeners
    socket.on('player_joined', (player) => {
      const sessionStore = useSessionStore()
      sessionStore.addPlayer(player)
    })

    socket.on('player_left', ({ playerId }) => {
      const sessionStore = useSessionStore()
      sessionStore.removePlayer(playerId)
    })

    socket.on('quiz_started', () => {
      const userStore = useUserStore()
      if (userStore.pin) {
        router.push(`/play/${userStore.pin}`)
      }
    })

    socket.on('join_confirmed', ({ player, session }) => {
      const userStore = useUserStore()
      const sessionStore = useSessionStore()
      
      userStore.setPlayerId(player.id)
      userStore.setNickname(player.nickname)
      userStore.setPin(session.pin)
      
      sessionStore.setSession(session)
    })

    socket.on('host_disconnected', () => {
      // Could be handled in component, but let's notify
      console.warn('Host disconnected')
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
