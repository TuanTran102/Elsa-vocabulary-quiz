<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useSocket } from '@/composables/useSocket'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const socket = useSocket()
const toast = useToast()

const pin = route.params.pin as string
const question = ref<any>(null)
const questionIndex = ref(0)
const totalQuestions = ref(0)
const timeRemaining = ref(0)
const selectedAnswerId = ref<string | null>(null)
const hasAnswered = ref(false)
const showDistribution = ref(false)
const distribution = ref<Record<string, number>>({})
const correctAnswerId = ref<string | null>(null)
const showHostDisconnected = ref(false)
const leaderboard = ref<any[]>([])

let timerInterval: any = null

const startTimer = (duration: number) => {
  clearInterval(timerInterval)
  timeRemaining.value = duration
  timerInterval = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      clearInterval(timerInterval)
    }
  }, 1000)
}

const syncSession = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${apiUrl}/v1/sessions/${pin}`)
    if (response.ok) {
      const { data } = await response.json()
      if (data.status === 'IN_PROGRESS' && data.currentQuestion) {
        // Normalize options for current question
        const rawOptions: any[] = data.currentQuestion.options || []
        const normalizedOptions = rawOptions.map((opt: any, index: number) => {
          if (typeof opt === 'string') return { id: opt, text: opt }
          return { id: opt.id || String(opt), text: opt.text || opt.content || String(opt) }
        })

        question.value = {
          ...data.currentQuestion,
          options: normalizedOptions
        }
        questionIndex.value = data.currentQuestionIndex || 0
        totalQuestions.value = data.totalQuestions || 0
        
        // Calculate remaining time
        if (data.questionStartedAt && data.currentQuestion.timeLimitSeconds) {
          const elapsed = Math.floor((Date.now() - new Date(data.questionStartedAt).getTime()) / 1000)
          const remaining = Math.max(0, data.currentQuestion.timeLimitSeconds - elapsed)
          timeRemaining.value = remaining
          if (remaining > 0) startTimer(remaining)
        }
      } else if (data.status === 'COMPLETED') {
        router.push(`/results/${pin}`)
      }
    }
  } catch (error) {
    console.error('Failed to sync session', error)
  }
}

const submitAnswer = (optionId: string) => {
  if (hasAnswered.value || showDistribution.value) return
  
  const selectedOption = question.value?.options.find((o: any) => o.id === optionId)
  if (!selectedOption) return

  selectedAnswerId.value = optionId
  hasAnswered.value = true
  
  socket.emit('submit_answer', {
    question_id: question.value?.id,
    answer: selectedOption.text // Send the actual text as expected by backend
  })
}

const handleHostDisconnect = () => {
  showHostDisconnected.value = true
  clearInterval(timerInterval)
}

const exitQuiz = () => {
  userStore.reset()
  router.push('/join')
}

onMounted(() => {
  if (socket.socket && !socket.socket.connected) {
    socket.connect()
  }
  
  syncSession()

  socket.on('question_started', (data: any) => {
    // Backend options is a JSON array of strings: ["Paris", "London", ...]
    const rawOptions: any[] = data.options || data.question?.options || []
    const normalizedOptions = rawOptions.map((opt: any, index: number) => {
      if (typeof opt === 'string') return { id: opt, text: opt }
      return { id: opt.id || String(opt), text: opt.text || opt.content || String(opt) }
    })

    question.value = {
      id: data.question_id || data.id,
      text: data.text || data.question?.text,
      options: normalizedOptions
    }
    questionIndex.value = (data.question_number || data.questionIndex || 1) - 1
    totalQuestions.value = data.total || data.totalQuestions || 0
    timeRemaining.value = data.time_limit || data.duration || 30
    selectedAnswerId.value = null
    hasAnswered.value = false
    showDistribution.value = false
    distribution.value = {}
    correctAnswerId.value = null
    startTimer(data.time_limit || data.duration || 30)
  })

  socket.on('question_ended', (data: any) => {
    clearInterval(timerInterval)
    timeRemaining.value = 0
    // Map backend fields: { correct_answer, answer_distribution }
    correctAnswerId.value = data.correct_answer || data.correctAnswerId
    distribution.value = data.answer_distribution || data.distribution || {}
    showDistribution.value = true
  })

  socket.on('answer_result', (data: any) => {
    if (data.isCorrect) {
      toast.add({
        severity: 'success',
        summary: 'Correct!',
        detail: `+${data.points} points`,
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Incorrect',
        detail: 'Better luck next time!',
        life: 3000
      })
    }
    userStore.setScore(data.totalScore)
    userStore.setRank(data.rank)
  })

  socket.on('leaderboard_update', (data: any) => {
    leaderboard.value = data.leaderboard
    const me = data.leaderboard.find((p: any) => p.nickname === userStore.nickname)
    if (me) {
      userStore.setRank(me.rank)
      userStore.setScore(me.score)
    }
  })

  socket.on('quiz_completed', () => {
    router.push(`/results/${pin}`)
  })

  socket.on('host_disconnected', handleHostDisconnect)
})

onUnmounted(() => {
  clearInterval(timerInterval)
  socket.off('question_started')
  socket.off('question_ended')
  socket.off('answer_result')
  socket.off('leaderboard_update')
  socket.off('quiz_completed')
  socket.off('host_disconnected')
})

const getOptionClass = (optionId: string) => {
  const classes = []
  if (selectedAnswerId.value === optionId) classes.push('is-selected')
  if (showDistribution.value) {
    if (optionId === correctAnswerId.value) classes.push('is-correct')
    else if (selectedAnswerId.value === optionId) classes.push('is-wrong')
  }
  return classes
}
</script>

<template>
  <div class="play-page min-h-screen bg-slate-900 text-white p-4 flex flex-col items-center">
    <div v-if="question" class="w-full max-w-3xl">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div class="text-xl font-bold bg-slate-800 px-4 py-2 rounded-lg">
          Question {{ questionIndex + 1 }} / {{ totalQuestions }}
        </div>
        <div class="text-2xl font-mono bg-blue-600 px-4 py-2 rounded-full min-w-[60px] text-center shadow-lg shadow-blue-500/25">
          {{ timeRemaining }}
        </div>
      </div>

      <!-- Question Text -->
      <div class="bg-slate-800 p-8 rounded-2xl shadow-xl mb-8 text-center">
        <h1 class="text-2xl md:text-3xl font-bold leading-tight">
          {{ question.text }}
        </h1>
      </div>

      <!-- Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="option in question.options"
          :key="option.id"
          @click="submitAnswer(option.id)"
          :disabled="hasAnswered || showDistribution"
          class="option-button relative overflow-hidden p-6 rounded-xl border-2 transition-all duration-200 text-left text-lg font-semibold"
          :class="getOptionClass(option.id)"
          data-testid="option-button"
        >
          <div class="relative z-10">
            <span>{{ option.text }}</span>
          </div>
        </button>
      </div>

      <!-- Score/Rank Footer -->
      <div class="mt-12 flex justify-center gap-8">
        <div class="text-center">
          <div class="text-slate-400 text-sm uppercase tracking-wider mb-1">Score</div>
          <div class="text-3xl font-bold text-blue-400">{{ userStore.score }}</div>
        </div>
        <div class="text-center">
          <div class="text-slate-400 text-sm uppercase tracking-wider mb-1">Rank</div>
          <div class="text-3xl font-bold text-amber-400">#{{ userStore.rank }}</div>
        </div>
      </div>
    </div>

    <!-- Waiting for next question -->
    <div v-else-if="!showHostDisconnected" class="flex flex-col items-center justify-center h-[60vh]">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p class="text-slate-400 text-xl">Waiting for host to start next question...</p>
    </div>

    <!-- Host Disconnected Dialog -->
    <div v-if="showHostDisconnected" data-testid="host-disconnected-container">
      <Dialog
        v-model:visible="showHostDisconnected"
        header="Host Disconnected"
        :modal="true"
        :closable="false"
        data-testid="host-disconnected-modal"
      >
        <div class="p-4">
          <p class="mb-6">The host has closed the session or lost connection.</p>
          <Button label="Exit Quiz" @click="exitQuiz" class="w-full" />
        </div>
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
.option-button {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(71, 85, 105, 0.5);
}

.option-button:not(:disabled):hover {
  background: rgba(51, 65, 85, 0.8);
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.option-button.is-selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.option-button.is-correct {
  border-color: #22c55e !important;
  background: rgba(34, 197, 94, 0.2) !important;
}

.option-button.is-wrong {
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1) !important;
}

.option-button:disabled {
  cursor: default;
  opacity: 0.8;
}
</style>
