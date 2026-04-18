<template>
  <div class="lobby-container min-h-screen p-6 text-white">
    <div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-4xl font-bold tracking-tight text-white/90">{{ sessionStore.quizTitle }}</h1>
        <p class="text-indigo-200 text-lg">Waiting for host to start the game...</p>
      </div>

      <!-- PIN Display -->
      <div class="glass-container p-8 text-center rounded-3xl">
        <span class="text-sm font-semibold uppercase tracking-widest text-indigo-200">Room PIN</span>
        <div class="text-7xl font-black mt-2 tracking-tighter text-white drop-shadow-lg">
          {{ formatPin(sessionStore.pin) }}
        </div>
      </div>

      <!-- Players List -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-2">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <i class="pi pi-users"></i>
            Players Joined
          </h2>
          <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
            {{ sessionStore.players.length }} Players
          </span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <TransitionGroup name="player-list">
            <div 
              v-for="player in sessionStore.players" 
              :key="player.id"
              class="player-card glass-button p-4 rounded-xl flex items-center gap-3 animate-pop-in"
            >
              <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
                {{ player.nickname[0].toUpperCase() }}
              </div>
              <span class="font-medium truncate">{{ player.nickname }}</span>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty state -->
        <div v-if="sessionStore.players.length === 0" class="text-center py-12 text-white/40 italic">
          No players have joined yet...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '@/store/session'

const sessionStore = useSessionStore()

function formatPin(pin: string) {
  if (!pin) return '------'
  return pin.match(/.{1,3}/g)?.join(' ') || pin
}
</script>

<style scoped>
.lobby-container {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
}

.glass-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.glass-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-pop-in {
  animation: popIn 0.4s ease-out;
}

/* Transition Group Animations */
.player-list-enter-active,
.player-list-leave-active {
  transition: all 0.5s ease;
}
.player-list-enter-from,
.player-list-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
