<template>
  <header class="bg-[#c06a28] text-white shadow-md">
    <div class="max-w-6xl mx-auto flex flex-wrap justify-between items-center px-4 py-4 sm:py-5 gap-3">
      <!-- Logo + título -->
      <div class="flex items-center gap-3 min-w-0">
        <img src="/logo-barber.png" alt="Logo" class="h-10 w-10 rounded-lg bg-white p-1 shadow" />
        <div class="truncate">
          <h1 class="text-lg sm:text-xl font-bold truncate">Painel Administrativo</h1>
          <p class="text-xs sm:text-sm opacity-90 truncate">
            Bem-vindo, {{ userName }}
          </p>
        </div>
      </div>

      <!-- Navegação -->
      <nav class="flex flex-wrap gap-2 mt-3 sm:mt-0">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="px-4 py-2 text-sm font-semibold rounded-full bg-white/10 hover:bg-white/20 transition whitespace-nowrap"
          :class="{ 'bg-white text-[#c06a28]': isActiveRoute(link.to) }"
        >
          {{ link.label }}
        </router-link>

        <button
          @click="logout"
          class="px-4 py-2 text-sm font-semibold rounded-full bg-red-500 hover:bg-red-600 text-white shadow transition whitespace-nowrap"
        >
          Sair
        </button>
      </nav>
    </div>
  </header>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'AdminNav',
  data() {
    return {
      userName: localStorage.getItem('user_name') || 'Usuário',
      navLinks: [
        { label: 'Painel do Usuário', to: '/dashboard' },
        { label: 'Agendamentos', to: '/admin/agendamentos' },
        { label: 'Serviços', to: '/admin/servicos' },
      ],
    }
  },
  methods: {
    isActiveRoute(route) {
      return this.$route.path === route
    },
    async logout() {
      try {
        await api.post('/logout')
      } catch (e) {
        console.debug('[logout]', e?.message || 'erro ignorado')
      } finally {
        localStorage.clear()
        this.$router.push('/')
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
</style>
