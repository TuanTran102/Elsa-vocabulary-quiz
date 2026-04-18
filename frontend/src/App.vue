<script setup lang="ts">
import { onMounted } from 'vue';
import { useSocket } from '@/composables/useSocket';

const { connect } = useSocket();

onMounted(() => {
  connect();
});
</script>

<template>
  <div class="app-container min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white shadow p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold text-primary">ELSA Quiz</h1>
        <nav>
          <router-link to="/" class="text-gray-600 hover:text-primary transition-colors">Lobby</router-link>
        </nav>
      </div>
    </header>

    <main class="flex-grow container mx-auto p-4">
      <RouterView />
    </main>

    <footer class="bg-white border-t p-4 text-center text-gray-500 text-sm">
      &copy; 2026 ELSA Vocabulary Quiz
    </footer>
  </div>
</template>

<style>
/* Global Styles */
:root {
  --primary-color: #3B82F6;
}
.text-primary {
  color: var(--primary-color);
}
</style>
