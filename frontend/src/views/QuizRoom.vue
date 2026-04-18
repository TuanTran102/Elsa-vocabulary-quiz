<template>
  <div class="quiz-room p-4 text-center">
    <h1 class="text-3xl font-bold mb-4">Quiz Room</h1>
    <p class="text-xl">Welcome to Quiz ID: {{ quizId }}</p>
    <div class="mt-8">
      <Message severity="info">Wait for the room implementation in the next task.</Message>
    </div>
    <Button label="Back to Lobby" icon="pi pi-arrow-left" class="mt-4" @click="$router.push('/')" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import Message from 'primevue/message';
import Button from 'primevue/button';

const route = useRoute();
const quizId = route.params.id;
</script>
