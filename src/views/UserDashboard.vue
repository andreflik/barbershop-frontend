<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <header class="bg-blue-600 text-white px-6 py-6">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">{{ pageTitle }}</h1>
          <p class="text-sm opacity-90" v-if="userName">Bem-vindo, {{ userName }}</p>
        </div>

        <nav class="flex gap-2">
          <router-link to="/dashboard" :class="navLinkClass('/dashboard')">Home</router-link>
          <router-link to="/schedule"  :class="navLinkClass('/schedule')">Agendar Serviços</router-link>
          <router-link to="/contact"   :class="navLinkClass('/contact')">Serviços</router-link>
          <router-link v-if="userRole === 'adm'" to="/admin" :class="navLinkClass('/admin')">Painel ADM</router-link>
          <button @click="logout" class="px-3 py-2 rounded bg-red-500 hover:bg-red-600" title="Sair">Sair</button>
        </nav>
      </div>
    </header>

    <div class="flex-grow">
      <!-- Só renderiza quando o token já foi aplicado -->
      <UserStats
          v-if="$route.path === '/dashboard' && authReady"
          :key="authReady ? 'dash-on' : 'dash-off'"
          :authReady="authReady"
      />
      <router-view v-else />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import api from '@/services/api'
import UserStats from '@/components/UserStats.vue'

export default {
  name: 'UserDashboard',
  components: { UserStats },
  data() {
    return {
      userName: '',
      userRole: '',
      authReady: false, // <- novo
    }
  },

  created() {
    const urlParams    = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    const user         = urlParams.get('user')
    const role         = urlParams.get('role')

    if (role) {
      localStorage.setItem('user_role', role)
      this.userRole = role
    } else {
      this.userRole = localStorage.getItem('user_role') || ''
    }

    this.userName = user || 'Usuário'

    this.applyAuthToken(tokenFromUrl)

    if (tokenFromUrl) {
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
    }
  },

  methods: {
    applyAuthToken(tokenMaybe) {
      const token = tokenMaybe || localStorage.getItem('auth_token')
      if (tokenMaybe) localStorage.setItem('auth_token', tokenMaybe)

      if (token) {
        if (api?.defaults?.headers?.common) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        this.authReady = true
      } else {
        this.authReady = false
      }
    },

    isActiveRoute(route) {
      return this.$route.path === route
    },
    navLinkClass(path) {
      return [
        'px-3 py-2 rounded',
        this.isActiveRoute(path) ? 'bg-white/20 font-semibold' : 'bg-white/10 hover:bg-white/20'
      ]
    },
    logout() {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_role')
      this.authReady = false
      this.$router.push('/')
    }
  },

  computed: {
    pageTitle() {
      switch (this.$route.path) {
        case '/schedule': return 'Agendar Serviços'
        case '/contact':  return 'Serviços'
        case '/admin':    return 'Painel ADM'
        default:          return 'Home'
      }
    }
  }
}
</script>
