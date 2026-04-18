<template>
  <div class="lobby-container p-4">
    <h1 class="text-3xl font-bold mb-6">Quiz Lobby</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="quiz in availableQuizzes" :key="quiz.id" class="quiz-card">
        <template #title>
          {{ quiz.title }}
        </template>
        <template #content>
          <p>{{ quiz.description }}</p>
        </template>
        <template #footer>
          <Button label="Join Quiz" icon="pi pi-play" @click="joinQuiz(quiz.id)" />
        </template>
      </Card>
    </div>

    <div v-if="availableQuizzes.length === 0" class="text-center py-10">
      <p class="text-gray-500 italic">No quizzes available at the moment. Please check back later.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useQuizStore } from '@/store/quiz';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Button from 'primevue/button';

const store = useQuizStore();
const router = useRouter();

onMounted(() => {
  store.fetchQuizzes();
});

const availableQuizzes = computed(() => store.availableQuizzes);

const joinQuiz = (quizId: string) => {
  router.push(`/quiz/${quizId}`);
};
</script>

<style scoped>
.lobby-container {
  max-width: 1200px;
  margin: 0 auto;
}
.quiz-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
