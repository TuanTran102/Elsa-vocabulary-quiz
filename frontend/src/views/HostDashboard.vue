<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/session'
import { useUserStore } from '@/store/user'
import { useSocket } from '@/composables/useSocket'
import QrcodeVue from 'qrcode.vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const userStore = useUserStore()
const socket = useSocket()
const pin = route.params.pin as string

// Game State
const currentPhase = ref('waiting') // waiting, in_progress, finished
const currentQuestion = ref<any>(null)
const timer = ref(0)
const totalQuestions = ref(0)
const questionIndex = ref(0)
const leaderboard = ref<any[]>([])
const answerDistribution = ref<Record<string, number>>({})
const showEndConfirm = ref(false)

// Chart Data
const chartData = computed(() => {
  if (!currentQuestion.value) return { labels: [], datasets: [] }
  
  const labels = currentQuestion.value.options.map((opt: any) => opt.text)
  const data = currentQuestion.value.options.map((opt: any) => answerDistribution.value[opt.id] || 0)
  
  return {
    labels,
    datasets: [
      {
        label: 'Answers',
        backgroundColor: '#3b82f6',
        data
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 }
    }
  }
}

// Logic
const origin = window.location.origin
const joinUrl = computed(() => `${origin}/join?pin=${pin}`)

const copyPin = () => {
  navigator.clipboard.writeText(pin)
}

const startQuiz = () => {
  socket.emit('start_quiz', { pin })
}

const endQuiz = () => {
  socket.emit('end_quiz', { pin })
  showEndConfirm.value = false
}

const exportResults = () => {
  const headers = ['Nickname', 'Score']
  const rows = leaderboard.value.map(p => [p.nickname, p.score])
  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n" 
    + rows.map(e => e.join(",")).join("\n")

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `results_${pin}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Socket Listeners
onMounted(() => {
  // Mark this client as master so global socket handlers skip redirection
  userStore.setRole('master')
  userStore.setPin(pin)

  // Listen for connection before reclaiming host
  socket.on('connect', () => {
    if (sessionStore.masterToken) {
      socket.emit('reclaim_host', { pin, masterToken: sessionStore.masterToken })
    }
  })
  
  socket.connect()
  
  // If socket is already connected (e.g. joined as player first)
  if (socket.socket?.connected && sessionStore.masterToken) {
    socket.emit('reclaim_host', { pin, masterToken: sessionStore.masterToken })
  }

  // player_joined and player_left are handled globally in useSocket.ts
  // which syncs sessionStore.players automatically

  socket.on('question_started', (data) => {
    currentPhase.value = 'in_progress'
    // Normalize options: backend sends string array, charts need { text } objects
    const rawOptions: any[] = data.options || data.question?.options || []
    const normalizedOptions = rawOptions.map((opt: any, index: number) => {
      if (typeof opt === 'string') return { id: `opt_${index}`, text: opt }
      return { id: opt.id || `opt_${index}`, text: opt.text || opt.content || String(opt) }
    })
    currentQuestion.value = {
      text: data.text || data.question?.text,
      options: normalizedOptions
    }
    timer.value = data.time_limit || data.duration || 30
    totalQuestions.value = data.total || data.totalQuestions || 0
    questionIndex.value = (data.question_number || data.questionIndex || 1) - 1
    answerDistribution.value = {}
    
    const countdown = setInterval(() => {
      if (timer.value > 0) timer.value--
      else clearInterval(countdown)
    }, 1000)
  })

  socket.on('answer_distribution_update', (data) => {
    answerDistribution.value = data
  })

  socket.on('leaderboard_update', (data) => {
    leaderboard.value = data
  })

  socket.on('quiz_completed', (data: any) => {
    currentPhase.value = 'finished'
    // Backend emits { final_leaderboard }
    leaderboard.value = data.final_leaderboard || data.leaderboard || []
  })

  socket.on('error', (err) => {
    console.error('Socket error:', err)
  })
})

onUnmounted(() => {
  socket.off('question_started')
  socket.off('answer_distribution_update')
  socket.off('leaderboard_update')
  socket.off('quiz_completed')
  socket.off('error')
})
</script>

<template>
  <div class="host-dashboard min-h-screen bg-surface-ground p-4">
    <!-- WAITING ROOM -->
    <div v-if="currentPhase === 'waiting'" class="flex flex-col items-center justify-center pt-8">
      <div class="text-center mb-8">
        <h2 class="text-xl text-gray-400 mb-2">Join at {{ origin }}/join</h2>
        <div class="flex items-center gap-4 justify-center">
            <h1 class="text-7xl font-bold text-primary" data-testid="pin-display">{{ pin }}</h1>
            <Button icon="pi pi-copy" text rounded @click="copyPin" v-tooltip="'Copy PIN'" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl items-start">
        <Card class="flex flex-col items-center p-6 text-center">
          <template #content>
            <div class="bg-white p-4 rounded-xl mb-4 inline-block">
              <QrcodeVue :value="joinUrl" :size="250" level="H" />
            </div>
            <p class="text-gray-400">Scan to join the quiz instantly</p>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex justify-between items-center">
              <span>Players</span>
              <Badge :value="sessionStore.players.length" severity="info" />
            </div>
          </template>
          <template #content>
            <div v-if="sessionStore.players.length === 0" class="py-12 text-center text-gray-500 italic">
              Waiting for players to join...
            </div>
            <div v-else class="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              <div v-for="player in sessionStore.players" :key="player.id" 
                class="bg-surface-card p-2 rounded border border-surface-border text-center truncate">
                {{ player.nickname }}
              </div>
            </div>
          </template>
          <template #footer>
            <Button 
                label="Start Quiz" 
                class="w-full text-xl py-3" 
                severity="primary"
                :disabled="sessionStore.players.length === 0"
                @click="startQuiz"
                data-testid="start-quiz-button"
            />
          </template>
        </Card>
      </div>
    </div>

    <!-- IN PROGRESS -->
    <div v-if="currentPhase === 'in_progress'" class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-8 bg-surface-card p-4 rounded-lg">
        <div>
          <h2 class="text-gray-400">Question {{ questionIndex + 1 }} of {{ totalQuestions }}</h2>
          <h1 class="text-3xl font-bold" v-if="currentQuestion">{{ currentQuestion.text }}</h1>
        </div>
        <div class="text-center bg-primary/10 p-3 rounded-xl border border-primary/20 min-w-[100px]">
          <span class="block text-sm text-primary uppercase">Time Left</span>
          <span class="text-4xl font-mono font-bold text-primary">{{ timer }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card class="md:col-span-2">
          <template #title>Answer Distribution</template>
          <template #content>
            <div class="h-[400px]">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </template>
        </Card>

        <Card>
          <template #title>Top Players</template>
          <template #content>
            <div class="space-y-4">
              <div v-for="(player, idx) in leaderboard.slice(0, 5)" :key="player.nickname" 
                class="flex justify-between items-center p-3 rounded bg-surface-hover">
                <div class="flex items-center gap-3">
                  <span class="font-bold text-gray-500 w-4">{{ idx + 1 }}</span>
                  <span>{{ player.nickname }}</span>
                </div>
                <span class="font-mono font-bold text-primary">{{ player.score }}</span>
              </div>
            </div>
          </template>
          <template #footer>
            <Button label="End Quiz" severity="danger" text class="w-full" @click="showEndConfirm = true" data-testid="end-quiz-button" />
          </template>
        </Card>
      </div>
    </div>

    <!-- FINISHED -->
    <div v-if="currentPhase === 'finished'" class="max-w-4xl mx-auto text-center py-8">
      <h1 class="text-5xl font-black mb-12 text-primary">Final Results</h1>
      
      <!-- Podium -->
      <div class="flex justify-center items-end gap-4 mb-12 h-64">
        <div v-if="leaderboard[1]" class="flex flex-col items-center">
          <div class="bg-blue-600/20 p-4 rounded-t-lg w-32 border-x border-t border-blue-600/30 h-32 flex flex-col justify-end pb-4">
            <span class="text-2xl font-bold">2nd</span>
            <span class="truncate w-full px-2">{{ leaderboard[1].nickname }}</span>
          </div>
        </div>
        <div v-if="leaderboard[0]" class="flex flex-col items-center">
            <i class="pi pi-crown text-yield-500 text-4xl mb-2 text-yellow-500"></i>
          <div class="bg-yellow-600/30 p-4 rounded-t-lg w-40 border-x border-t border-yellow-600/40 h-48 flex flex-col justify-end pb-6">
            <span class="text-3xl font-black">1st</span>
            <span class="truncate w-full px-2">{{ leaderboard[0].nickname }}</span>
          </div>
        </div>
        <div v-if="leaderboard[2]" class="flex flex-col items-center">
          <div class="bg-orange-600/20 p-4 rounded-t-lg w-32 border-x border-t border-orange-600/30 h-24 flex flex-col justify-end pb-3">
            <span class="text-xl font-bold">3rd</span>
            <span class="truncate w-full px-2">{{ leaderboard[2].nickname }}</span>
          </div>
        </div>
      </div>

      <Card class="mb-8">
        <template #content>
            <div class="max-h-[300px] overflow-y-auto mb-4">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-gray-500 border-b border-surface-border">
                            <th class="py-2">#</th>
                            <th>Nickname</th>
                            <th class="text-right">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(player, idx) in leaderboard" :key="player.nickname" class="border-b border-surface-border/50">
                            <td class="py-3">{{ idx + 1 }}</td>
                            <td class="font-bold">{{ player.nickname }}</td>
                            <td class="text-right font-mono">{{ player.score }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="flex gap-4">
                <Button label="Export to CSV" icon="pi pi-download" severity="secondary" @click="exportResults" class="flex-1" data-testid="export-button" />
                <Button label="Host Another Quiz" icon="pi pi-plus" severity="primary" @click="router.push('/create')" class="flex-1" data-testid="host-another-button" />
            </div>
        </template>
      </Card>
    </div>

    <!-- End Confirmation Dialog -->
    <Dialog v-model:visible="showEndConfirm" modal header="End Quiz Early?" :style="{ width: '350px' }">
      <p class="m-0">Are you sure you want to end the quiz now? This will stop all players and show final results.</p>
      <template #footer>
        <Button label="No, Cancel" severity="secondary" text @click="showEndConfirm = false" />
        <Button label="Yes, End It" severity="danger" @click="endQuiz" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.text-primary {
  color: var(--p-primary-color);
}
.bg-primary\/10 {
  background-color: rgba(var(--p-primary-color-rgb), 0.1);
}
.bg-surface-hover {
    background-color: var(--p-surface-hover);
}
</style>
