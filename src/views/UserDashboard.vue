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

          <!-- Exibe Painel ADM apenas se o backend confirmar que é adm -->
          <router-link
              v-if="isAdmin"
              to="/admin"
              :class="navLinkClass('/admin')"
          >
            Painel ADM
          </router-link>

          <button
              @click="logout"
              class="px-3 py-2 rounded bg-red-500 hover:bg-red-600"
              title="Sair"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>

    <div class="flex-grow">
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
import api from '@/services/api'
import UserStats from '@/components/UserStats.vue'

export default {
  name: 'UserDashboard',
  components: { UserStats },
  data() {
    return {
      userName: '',
      userRole: '',
      authReady: false,
    }
  },

  async created() {
    // Lê de #hash e ?query
    const hashParams   = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
    const searchParams = new URLSearchParams(window.location.search)

    const tokenFromHash = hashParams.get('token')
    const userFromHash  = hashParams.get('user')
    const roleFromHash  = hashParams.get('role')

    const tokenFromUrl  = tokenFromHash || searchParams.get('token')
    const user          = userFromHash  || searchParams.get('user')
    const role          = roleFromHash  || searchParams.get('role')

    // Nome inicial (apenas visual); papel será confirmado no /api/me
    this.userName = user || localStorage.getItem('user_name') || 'Usuário'
    if (role) {
      localStorage.setItem('user_role', role)
    }

    // Aplica token (se veio) e marca authReady
    this.applyAuthToken(tokenFromUrl)

    // Limpa token/user/role da URL (hash e query)
    if (tokenFromUrl || user || role) {
      const url = new URL(window.location.href)
      ;['token','user','role'].forEach(k => searchParams.delete(k))
      url.search = searchParams.toString() ? `?${searchParams}` : ''
      ;['token','user','role'].forEach(k => hashParams.delete(k))
      url.hash = hashParams.toString() ? `#${hashParams}` : ''
      window.history.replaceState({}, '', url.toString())
    }

    // Se temos token, confirma identidade/papel no backend
    if (this.authReady) {
      await this.fetchMe()
    }
  },

  computed: {
    isAdmin() {
      return this.userRole === 'adm'
    },
    pageTitle() {
      switch (this.$route.path) {
        case '/schedule': return 'Agendar Serviços'
        case '/contact':  return 'Serviços'
        case '/admin':    return 'Painel ADM'
        default:          return 'Home'
      }
    }
  },

  methods: {
    applyAuthToken(tokenMaybe) {
      const token = tokenMaybe || localStorage.getItem('auth_token')
      if (tokenMaybe) localStorage.setItem('auth_token', tokenMaybe)

      // Se seu api.js tem interceptor que lê do localStorage, bastaria salvar.
      // Ainda assim, setamos manualmente por compatibilidade:
      if (token && api?.defaults?.headers?.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      this.authReady = !!token
    },

    async fetchMe() {
      try {
        const { data } = await api.get('/me')
        // Confirma papel e nome (fonte de verdade = backend)
        this.userRole = data?.role || ''
        this.userName = data?.name || this.userName

        // Sincroniza localStorage (apenas conveniência para UI)
        if (data?.name) localStorage.setItem('user_name', data.name)
        if (data?.role) localStorage.setItem('user_role', data.role)
      } catch (e) {
        // Se falhar, invalida sessão local
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        this.userRole = ''
        this.authReady = false
        // Redireciona pro login
        if (this.$route.path !== '/') {
          this.$router.push('/').catch(() => {})
        }
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

    async logout() {
      try {
        // Se existir endpoint de logout
        await api.post('/logout')
      } catch (_) {
        // silencioso
      } finally {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        this.userRole = ''
        this.authReady = false
        this.$router.push('/').catch(() => {})
      }
    }
  }
}
</script>
