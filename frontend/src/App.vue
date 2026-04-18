<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-root flex flex-col min-h-screen">
    <header class="app-header glass-effect sticky top-0 z-50 p-4 flex items-center justify-between">
      <div class="logo-container flex items-center gap-2">
        <div class="logo-icon">✨</div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          ELSA Quiz
        </h1>
      </div>
    </header>

    <main class="flex-grow">
      <RouterView />
    </main>

    <footer class="app-footer p-6 text-center text-indigo-200/60 text-sm">
      <p>&copy; 2026 ELSA Vocabulary Quiz. Built for excellence.</p>
    </footer>
  </div>
</template>

<style>
/* Reset and Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #0f172a; /* Slate 900 */
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', sans-serif;
}

.app-root {
  min-height: 100vh;
  color: white;
}

.glass-effect {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
}

/* Tailwind-like utilities if needed, or vanilla equivalent */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-grow { flex-grow: 1; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.min-h-screen { min-height: 100vh; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.sticky { position: sticky; }
.top-0 { top: 0; }
.z-50 { z-index: 50; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
</style>
