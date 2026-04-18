<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import Button from 'primevue/button'
import confetti from 'canvas-confetti'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const pin = route.params.pin as string
const leaderboard = ref<any[]>([])
const loading = ref(true)

const fetchFinalResults = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${apiUrl}/v1/sessions/${pin}`)
    if (response.ok) {
      const { data } = await response.json()
      leaderboard.value = data.leaderboard || []
    }
  } catch (error) {
    console.error('Failed to fetch results', error)
  } finally {
    loading.value = false
  }
}

const triggerConfetti = () => {
  if (userStore.rank <= 3) {
    const duration = 5 * 1000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#fbbf24', '#22c55e']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#fbbf24', '#22c55e']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }
}

const playAgain = () => {
  userStore.reset()
  router.push('/join')
}

onMounted(async () => {
  await fetchFinalResults()
  triggerConfetti()
})
</script>

<template>
  <div class="results-page min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
    <div v-if="!loading" class="w-full max-w-2xl text-center">
      <!-- Hero Section -->
      <div class="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 class="text-4xl font-black mb-2 tracking-tight">QUIZ COMPLETED!</h1>
        <p class="text-slate-400 text-xl">Fantastic effort, {{ userStore.nickname }}!</p>
      </div>

      <!-- User Stats Card -->
      <div class="grid grid-cols-2 gap-4 mb-12">
        <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div class="text-slate-400 text-sm uppercase tracking-wider mb-1">Final Rank</div>
          <div class="text-5xl font-black text-amber-400">#{{ userStore.rank }}</div>
        </div>
        <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div class="text-slate-400 text-sm uppercase tracking-wider mb-1">Final Score</div>
          <div class="text-5xl font-black text-blue-400">{{ userStore.score }}</div>
        </div>
      </div>

      <!-- Podium Top 3 -->
      <div class="flex items-end justify-center gap-2 mb-12 h-48">
        <template v-for="item in leaderboard.slice(0, 3)" :key="item.nickname">
          <!-- 2nd place -->
          <div v-if="item.rank === 2" class="podium-item is-silver h-[70%]" data-testid="podium-item">
            <div class="name truncate px-2">{{ item.nickname }}</div>
            <div class="rank">2</div>
          </div>
          <!-- 1st place -->
          <div v-if="item.rank === 1" class="podium-item is-gold h-full" data-testid="podium-item">
            <div class="name truncate px-2 font-bold">{{ item.nickname }}</div>
            <div class="rank">1</div>
          </div>
          <!-- 3rd place -->
          <div v-if="item.rank === 3" class="podium-item is-bronze h-[50%]" data-testid="podium-item">
            <div class="name truncate px-2">{{ item.nickname }}</div>
            <div class="rank">3</div>
          </div>
        </template>
      </div>

      <!-- Leaderboard List -->
      <div class="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 mb-8">
        <div class="p-4 border-b border-slate-700 font-bold uppercase tracking-widest text-sm text-slate-400">
          Full Leaderboard
        </div>
        <div class="max-h-64 overflow-y-auto custom-scrollbar">
          <div
            v-for="entry in leaderboard"
            :key="entry.nickname"
            class="flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
            :class="{ 'is-current-user bg-blue-500/10': entry.nickname === userStore.nickname }"
            :data-testid="'leaderboard-item-' + entry.nickname"
          >
            <div class="flex items-center gap-4">
              <span class="w-8 font-mono text-slate-500">#{{ entry.rank }}</span>
              <span class="font-semibold">{{ entry.nickname }}</span>
              <span v-if="entry.nickname === userStore.nickname" class="text-[10px] bg-blue-500 px-2 py-0.5 rounded-full uppercase">You</span>
            </div>
            <div class="font-mono font-bold text-blue-400">
              {{ entry.score }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <Button
        label="Play Again"
        icon="pi pi-replay"
        class="p-button-lg p-button-rounded px-8"
        @click="playAgain"
        data-testid="play-again-button"
      />
    </div>

    <!-- Loading State -->
    <div v-else class="flex flex-col items-center justify-center h-[60vh]">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p class="text-slate-400 text-xl">Calculating final standings...</p>
    </div>
  </div>
</template>

<style scoped>
.podium-item {
  @apply flex flex-col items-center justify-end w-24 rounded-t-xl text-white pb-4 shadow-lg transition-all duration-500;
}

.podium-item .name {
  @apply text-xs mb-2 w-full text-center;
}

.podium-item .rank {
  @apply text-3xl font-black;
}

.is-gold {
  background: linear-gradient(to top, #d97706, #fbbf24);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}

.is-silver {
  background: linear-gradient(to top, #4b5563, #9ca3af);
}

.is-bronze {
  background: linear-gradient(to top, #7c2d12, #b45309);
}

.is-current-user {
  position: relative;
}

.is-current-user::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>
