<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/store/session'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

interface Quiz {
  id: string
  title: string
  description: string
  _count: {
    questions: number
  }
}

const router = useRouter()
const sessionStore = useSessionStore()
const quizzes = ref<Quiz[]>([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)

const fetchQuizzes = async () => {
  loading.value = true
  error.value = ''
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${apiUrl}/v1/quizzes`)
    if (!response.ok) throw new Error('Failed to fetch quizzes')
    const result = await response.json()
    quizzes.value = Array.isArray(result.data) ? result.data : []
  } catch (err: any) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const createSession = async (quizId: string) => {
  creating.value = true
  error.value = ''
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const response = await fetch(`${apiUrl}/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_id: quizId })
    })
    
    if (!response.ok) throw new Error('Failed to create session')
    
    const responseData = await response.json()
    const data = responseData.data
    // data contains { pin, game_room_id, quiz_title, master_token }
    
    sessionStore.setMasterToken(data.master_token)

    sessionStore.setSession({
      pin: data.pin,
      gameRoomId: data.game_room_id,
      quizTitle: data.quiz_title,
      status: 'WAITING',
      players: []
    })
    
    router.push(`/host/${data.pin}`)
  } catch (err: any) {
    error.value = err.message || 'Failed to create session'
  } finally {
    creating.value = false
  }
}

onMounted(fetchQuizzes)
</script>

<template>
  <div class="create-page p-4 max-w-4xl mx-auto">
    <div class="header mb-8 text-center mt-8">
      <h1 class="text-4xl font-bold mb-2 text-primary">Host a Quiz</h1>
      <p class="text-gray-400">Select a vocabulary quiz to start a new session</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <ProgressSpinner />
      <p class="mt-4 text-gray-400">Loading available quizzes...</p>
    </div>

    <Message v-else-if="error" severity="error" class="mb-4">
      {{ error }}
      <Button label="Retry" icon="pi pi-refresh" text @click="fetchQuizzes" class="ml-2" />
    </Message>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card v-for="quiz in quizzes" :key="quiz.id" class="quiz-card transition-all duration-300 hover:scale-105">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="text-xl">{{ quiz.title }}</span>
            <span class="text-sm bg-primary/20 text-primary px-2 py-1 rounded">
              {{ quiz._count?.questions || 0 }} Questions
            </span>
          </div>
        </template>
        <template #content>
          <p class="text-gray-400 text-sm line-clamp-2">{{ quiz.description || 'No description available' }}</p>
        </template>
        <template #footer>
          <Button 
            label="Select Quiz" 
            class="w-full" 
            :loading="creating"
            @click="createSession(quiz.id)" 
          />
        </template>
      </Card>
    </div>

    <div v-if="!loading && quizzes.length === 0" class="text-center py-12 bg-surface-card rounded-lg border border-dashed border-gray-700">
      <i class="pi pi-search text-4xl text-gray-600 mb-4"></i>
      <p class="text-gray-500">No quizzes found. Please contact an admin.</p>
    </div>
  </div>
</template>

<style scoped>
.quiz-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.p-card-content) {
  flex: 1;
}

.text-primary {
  color: var(--p-primary-color);
}

.bg-primary\/20 {
  background-color: rgba(var(--p-primary-color-rgb), 0.2);
}
</style>
