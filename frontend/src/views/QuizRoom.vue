<template>
  <div class="quiz-room p-4 max-w-6xl mx-auto h-screen flex flex-col">
    <!-- Top Bar: Timer and Status -->
    <header class="flex justify-between items-center bg-white/10 p-4 rounded-xl shadow-lg backdrop-blur-md mb-6 border border-white/20">
      <div>
        <h1 class="text-2xl font-bold text-white drop-shadow">Quiz ID: <span class="font-mono text-blue-200">{{ quizId }}</span></h1>
        <Badge :value="quizStore.status" :severity="statusSeverity" class="mt-2 text-sm px-3 py-1 font-bold uppercase tracking-wider" />
      </div>
      <div v-if="quizStore.status === 'in_progress'" class="flex flex-col items-end">
        <span class="text-sm font-bold text-white/80 uppercase tracking-widest mb-1 drop-shadow-sm">Time Remaining</span>
        <div class="w-48 bg-black/20 rounded-full p-1 overflow-hidden">
          <ProgressBar :value="(quizStore.timeRemaining / maxTime) * 100" :showValue="false" :style="{height: '12px'}" :class="progressBarColor" class="rounded-full shadow-inner" />
        </div>
        <span class="text-2xl font-black text-white mt-1 drop-shadow-md tabular-nums">{{ quizStore.timeRemaining }}s</span>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow flex flex-col md:flex-row gap-6 h-full overflow-hidden">
      <!-- Left Column: Question Area / Waiting / Finish -->
      <div class="flex-grow flex flex-col md:w-2/3 max-h-[500px] md:max-h-full transition-all duration-300">
        <!-- Waiting State -->
        <div v-if="quizStore.status === 'waiting'" class="h-full flex-grow flex flex-col items-center justify-center bg-gradient-to-br from-white/10 to-transparent rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl relative overflow-hidden group">
          <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <i class="pi pi-spin pi-spinner text-7xl text-blue-300 mb-8 filter drop-shadow-[0_0_10px_rgba(147,197,253,0.5)]"></i>
          <h2 class="text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-lg text-center">Waiting to Start</h2>
          <p class="text-blue-100 text-xl font-medium text-center max-w-md">The quiz host is getting everything ready. Prepare yourself!</p>
        </div>

        <!-- In Progress State (Question) -->
        <div v-else-if="quizStore.status === 'in_progress'" class="h-full flex-grow flex flex-col bg-white/10 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl overflow-y-auto">
          <div class="mb-10 flex-grow flex items-center justify-center">
            <h2 class="text-4xl md:text-5xl font-black text-white text-center leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
              {{ quizStore.currentQuestion?.text || 'Loading Question...' }}
            </h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-auto">
             <Button
                v-for="(option) in quizStore.currentQuestion?.options || []"
                :key="option.id"
                :label="option.text"
                :disabled="isAnswering || quizStore.timeRemaining === 0"
                @click="submitAnswer(option.id)"
                class="p-button-outlined !border-2 !rounded-2xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-xl font-bold h-24 item-center justify-center w-full answer-button"
                :class="{'!bg-blue-600/40 !border-blue-400 !text-white': selectedOption === option.id, '!border-white/40 !text-white hover:!bg-white/10': selectedOption !== option.id}"
             />
          </div>
        </div>

        <!-- Completed State -->
        <div v-else-if="quizStore.status === 'completed'" class="h-full flex-grow flex flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-3xl p-8 backdrop-blur-md border border-white/20 shadow-2xl text-center">
          <div class="relative">
            <div class="absolute inset-0 animate-ping bg-yellow-400/30 rounded-full blur-xl"></div>
            <i class="pi pi-trophy text-8xl text-yellow-400 mb-8 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] relative z-10 animate-bounce"></i>
          </div>
          <h2 class="text-5xl font-black text-white mb-6 drop-shadow-xl tracking-tight">Quiz Completed!</h2>
          <div class="bg-black/30 px-8 py-4 rounded-2xl border border-white/10 shadow-inner mb-10">
            <p class="text-2xl text-blue-100 font-semibold mb-2">Your Final Score</p>
            <p class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">{{ quizStore.userScore }}</p>
          </div>
          <Button label="Back to Lobby" icon="pi pi-home" size="large" class="!px-8 !py-4 !text-xl !font-bold !rounded-xl shadow-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all hover:-translate-y-1" @click="goHome" />
        </div>
      </div>

      <!-- Right Column: Leaderboard -->
      <div class="md:w-1/3 flex flex-col bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 max-h-[500px] md:max-h-full flex-shrink-0">
         <div class="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 p-5 border-b border-white/10 flex justify-between items-center shadow-md z-10">
            <h3 class="text-2xl font-black text-white flex items-center gap-3 drop-shadow-md">
              <i class="pi pi-chart-bar text-blue-300"></i> Leaderboard
            </h3>
            <Badge :value="sortedLeaderboard.length" severity="info" class="!bg-blue-500/50" />
         </div>
         <div class="flex-grow overflow-y-auto p-5 custom-scrollbar relative">
            <div class="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 pointer-events-none z-0"></div>
            <TransitionGroup name="list" tag="ul" class="flex flex-col gap-3 relative z-10 w-full min-h-min" appear>
               <li v-for="(entry, idx) in sortedLeaderboard" :key="entry.userId" class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 w-full hover:bg-white/10" 
                   :class="rowClass(idx)">
                 <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] shrink-0"
                      :class="rankBadgeClass(idx)">
                   {{ idx + 1 }}
                 </div>
                 <div class="flex-grow font-bold text-white truncate text-lg">{{ entry.username }}</div>
                 <div class="font-black text-xl tabular-nums drop-shadow-md" :class="scoreClass(idx)">{{ entry.score }}</div>
               </li>
            </TransitionGroup>
            <div v-if="!sortedLeaderboard.length" class="absolute inset-0 flex items-center justify-center text-white/40 italic font-medium text-lg z-10">Waiting for players...</div>
         </div>
      </div>
    </main>
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { useToast } from 'primevue/usetoast'; // Not strictly needed for UI visually, but can be added
import { useQuizStore } from '@/store/quiz';
import { useSocket } from '@/composables/useSocket';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import Badge from 'primevue/badge';
import Toast from 'primevue/toast';

const route = useRoute();
const router = useRouter();
const quizStore = useQuizStore();
const { emit } = useSocket();

const quizId = route.params.id as string;
const isAnswering = ref(false);
const selectedOption = ref<string | null>(null);
const maxTime = ref(30);

const sortedLeaderboard = computed(() => {
  return [...quizStore.leaderboard].sort((a, b) => b.score - a.score);
});

const statusSeverity = computed(() => {
  switch(quizStore.status) {
    case 'waiting': return 'warning';
    case 'in_progress': return 'success';
    case 'completed': return 'info';
    default: return 'info';
  }
});

const progressBarColor = computed(() => {
  if (!quizStore.timeRemaining) return '';
  const ratio = quizStore.timeRemaining / maxTime.value;
  if (ratio > 0.5) return '[&>div]:!bg-emerald-400';
  if (ratio > 0.2) return '[&>div]:!bg-amber-400';
  return '[&>div]:!bg-rose-500 [&>div]:animate-pulse';
});

const submitAnswer = (optionId: string) => {
  if (isAnswering.value || quizStore.timeRemaining === 0) return;
  isAnswering.value = true;
  selectedOption.value = optionId;
  emit('submit_answer', { optionId });
};

const goHome = () => {
    quizStore.setStatus('waiting');
    router.push('/');
}

watch(() => quizStore.currentQuestion, () => {
  isAnswering.value = false;
  selectedOption.value = null;
});

// Helper for UI styling
const rowClass = (idx: number) => {
    if (idx === 0) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
    if (idx === 1) return 'bg-gradient-to-r from-slate-400/20 to-slate-300/10 border-slate-400/30';
    if (idx === 2) return 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-orange-500/30';
    return 'bg-white/5 border-white/5 shadow-sm';
};

const rankBadgeClass = (idx: number) => {
    if (idx === 0) return 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-yellow-500/50';
    if (idx === 1) return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-slate-400/50';
    if (idx === 2) return 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900 shadow-orange-500/50';
    return 'bg-white/10 text-white shadow-black/50';
};

const scoreClass = (idx: number) => {
    if (idx === 0) return 'text-yellow-400';
    if (idx === 1) return 'text-slate-300';
    if (idx === 2) return 'text-orange-400';
    return 'text-blue-200/80';
};
</script>

<style scoped>
.quiz-room {
    font-family: 'Inter', 'Roboto', 'Helvetica Neue', sans-serif;
}
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scaleY(0.01) translate(30px, 0);
}
.list-leave-active {
  position: absolute;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
