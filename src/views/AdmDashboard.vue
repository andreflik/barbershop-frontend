<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-[#f1efec] to-[#e7e5e2] text-gray-900 font-[Outfit]">
    <!-- NAVBAR única (renderizada pelo AdminNav) -->
    <AdminNav class="shadow-md" />

    <!-- CONTEÚDO dinâmico -->
    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import AdminNav from '@/components/AdminNav.vue'

export default {
  name: 'AdminLayout',
  components: { AdminNav },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

/* Transição entre páginas internas */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ajustes de responsividade */
@media (max-width: 640px) {
  main {
    padding: 1.25rem;
  }
}
</style>
