<template>
  <div class="join-container flex items-center justify-center min-h-screen p-4">
    <div class="glass-card p-8 w-full max-w-md animate-fade-in" style="padding: 20px;">
      <h2 class="text-3xl font-bold text-white text-center" style="margin-bottom: 2rem;">Join Quiz</h2>
      
      <div v-if="step === 'pin'" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label class="text-indigo-100 font-medium">Room PIN</label>
          <InputText 
            v-model="pin" 
            placeholder="Enter PIN" 
            class="w-full text-center text-2xl tracking-widest bg-white/10 text-white border-white/20"
            maxlength="6"
            @keyup.enter="validatePin"
          />
          <small v-if="error" class="text-red-300">{{ error }}</small>
        </div>
        <Button 
          label="Next" 
          icon="pi pi-arrow-right" 
          class="w-full p-button-lg" 
          :loading="loading"
          @click="validatePin"
        />
      </div>

      <div v-else class="animate-slide-up" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label class="text-indigo-100 font-medium">Your Nickname</label>
          <InputText 
            v-model="nickname" 
            placeholder="Enter Nickname" 
            class="w-full bg-white/10 text-white border-white/20"
            maxlength="20"
            @keyup.enter="joinRoom"
          />
        </div>
        <Button 
          label="Join Game" 
          icon="pi pi-check" 
          class="w-full p-button-lg p-button-success" 
          @click="joinRoom"
        />
        <Button 
          label="Back" 
          variant="text"
          class="w-full text-white/70" 
          @click="step = 'pin'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useSocket } from '@/composables/useSocket'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const router = useRouter()
const userStore = useUserStore()
const { emit, connect } = useSocket()

const step = ref<'pin' | 'nickname'>('pin')
const pin = ref('')
const nickname = ref('')
const loading = ref(false)
const error = ref('')

async function validatePin() {
  if (pin.value.length < 6) {
    error.value = 'PIN must be 6 digits'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/v1/sessions/${pin.value}`)
    if (response.ok) {
      step.value = 'nickname'
    } else {
      error.value = 'Invalid room PIN'
    }
  } catch (err) {
    error.value = 'Connection error'
  } finally {
    loading.value = false
  }
}

function joinRoom() {
  if (!nickname.value) return
  
  // Update store PIN early so navigation guard allows it
  userStore.setPin(pin.value)
  userStore.setNickname(nickname.value)
  
  connect()
  emit('join_quiz', { pin: pin.value, nickname: nickname.value })
  
  // Server will respond with join_confirmed which updates store and routes to lobby
  // But we can proactively route if we want, or wait for event.
  // The useSocket has a listener for join_confirmed that routes to lobby.
  // Actually, join_confirmed listener redirects to /lobby/:pin
  router.push(`/lobby/${pin.value}`)
}
</script>

<style scoped>
.join-container {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
