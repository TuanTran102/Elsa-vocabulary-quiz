<template>
  <div class="home-container relative w-full min-h-[calc(100vh-160px)] flex items-center justify-center p-4 md:p-6 text-white overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl my-4">
    <!-- Animated background elements -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="bubble bubble-1"></div>
      <div class="bubble bubble-2"></div>
      <div class="bubble bubble-3"></div>
    </div>

    <div class="relative z-10 max-w-3xl w-full text-center flex flex-col gap-12 md:gap-24 animate-fade-in py-8">
      <header class="space-y-4 md:space-y-6">
        <div class="inline-block p-1 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent">
          <div class="px-4 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm text-xs md:text-sm font-semibold tracking-widest uppercase">
            Real-time Vocabulary Quiz
          </div>
        </div>
        <h1 class="text-6xl md:text-8xl font-black tracking-normal leading-none uppercase pb-2 flex flex-col">
          <span>Elsa</span>
          <span class="text-indigo-300" style="margin-top: 15px;">Quest</span>
        </h1>
        <p class="text-lg md:text-xl text-indigo-100/80 max-w-md mx-auto leading-relaxed px-4">
          Master new words with friends in real-time. Join a room or host your own challenge.
        </p>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 px-4 md:px-0" style="margin-top: 3rem; margin-bottom: 3rem;">
        <!-- Join CTA -->
        <router-link to="/join" class="action-card group w-full block h-full">
          <div class="card-inner p-6 md:p-8 rounded-2xl md:rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-4 w-full">
            <div class="icon-box bg-indigo-500 group-hover:bg-indigo-400 w-16 h-16 !rounded-2xl flex items-center justify-center shadow-lg">
              <i class="pi pi-sign-in text-3xl"></i>
            </div>
            <div>
              <h3 class="text-xl md:text-2xl font-bold">Join Quiz</h3>
              <p class="text-sm text-white/60 mt-2">Enter a 6-digit PIN to play</p>
            </div>
          </div>
        </router-link>

        <!-- Host CTA -->
        <router-link to="/create" class="action-card group border-white/10 w-full block h-full">
          <div class="card-inner p-6 md:p-8 rounded-2xl md:rounded-3xl h-full flex flex-col items-center justify-center text-center space-y-4 bg-white/5 border border-white/10 w-full">
            <div class="icon-box bg-purple-500 group-hover:bg-purple-400 w-16 h-16 !rounded-2xl flex items-center justify-center shadow-lg">
              <i class="pi pi-plus text-3xl"></i>
            </div>
            <div>
              <h3 class="text-xl md:text-2xl font-bold">Host Quiz</h3>
              <p class="text-sm text-white/60 mt-2">Manage your own classroom</p>
            </div>
          </div>
        </router-link>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.home-container {
  background: radial-gradient(circle at top right, #312e81, #1e1b4b, #0c0a09);
  font-family: 'Outfit', sans-serif;
}

.action-card {
  position: relative;
  text-decoration: none;
  color: inherit;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.card-inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}

.action-card:hover .card-inner {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  z-index: 1;
}

.bubble-1 {
  width: 400px;
  height: 400px;
  background: #4f46e5;
  top: -100px;
  right: -50px;
  animation: float 10s infinite alternate;
}

.bubble-2 {
  width: 300px;
  height: 300px;
  background: #7c3aed;
  bottom: -50px;
  left: -50px;
  animation: float 8s infinite alternate-reverse;
}

.bubble-3 {
  width: 250px;
  height: 250px;
  background: #ec4899;
  top: 40%;
  left: 30%;
  animation: float 12s infinite linear;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(30px, 40px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
</style>
