<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-[#f1efec] to-[#e7e5e2] text-gray-900 font-[Outfit]">
    <!-- Overlay de carregamento -->
    <transition name="fade">
      <div
        v-if="showOverlay"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
          <div
            class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"
            aria-label="Carregando"
          ></div>
          <span class="font-medium text-gray-700">Carregando…</span>
        </div>
      </div>
    </transition>

    <!-- HEADER -->
    <header class="bg-[#c06a28] text-white shadow-md sticky top-0 z-40">
      <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between px-5 py-4 sm:py-5">
        <!-- LOGO -->
        <div class="flex items-center gap-3 min-w-0">
          <img
            src="/logo-barber.png"
            alt="Logo"
            class="h-10 w-10 rounded-lg bg-white p-1 shadow-md"
          />
          <div class="truncate">
            <h1 class="text-lg sm:text-xl font-bold truncate">{{ pageTitle }}</h1>
            <p class="text-xs sm:text-sm opacity-90 truncate" v-if="userName">
              Bem-vindo, {{ userName }}
            </p>
          </div>
        </div>

        <!-- NAV -->
        <nav class="flex items-center gap-2 mt-3 sm:mt-0">
          <!-- Desktop -->
          <div class="hidden md:flex items-center gap-2">
            <router-link
              to="/dashboard"
              :class="navLinkClass('/dashboard')"
              class="px-4 py-2 rounded-full text-sm font-medium transition"
            >
              Home
            </router-link>

            <router-link
              to="/schedule"
              :class="navLinkClass('/schedule')"
              class="px-4 py-2 rounded-full text-sm font-medium transition"
            >
              Agendar
            </router-link>

            <router-link
              to="/contact"
              :class="navLinkClass('/contact')"
              class="px-4 py-2 rounded-full text-sm font-medium transition"
            >
              Serviços
            </router-link>

            <router-link
              v-if="isAdmin"
              to="/admin"
              :class="navLinkClass('/admin')"
              class="px-4 py-2 rounded-full text-sm font-medium transition"
            >
              Painel ADM
            </router-link>

            <button
              @click="logout"
              class="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 shadow-sm text-sm font-medium transition"
            >
              Sair
            </button>
          </div>

          <!-- Mobile -->
          <div class="md:hidden relative">
            <button
              @click="menuOpen = !menuOpen"
              class="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full text-sm font-semibold"
            >
              <span class="material-icons text-lg leading-none">menu</span>
              Menu
            </button>

            <div
              v-if="menuOpen"
              class="absolute right-0 mt-2 bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-50 w-48 animate-fadeIn"
            >
              <router-link
                to="/dashboard"
                class="block px-4 py-2 hover:bg-gray-100 text-sm"
                @click="closeMenu"
              >Home</router-link>
              <router-link
                to="/schedule"
                class="block px-4 py-2 hover:bg-gray-100 text-sm"
                @click="closeMenu"
              >Agendar</router-link>
              <router-link
                to="/contact"
                class="block px-4 py-2 hover:bg-gray-100 text-sm"
                @click="closeMenu"
              >Serviços</router-link>
              <router-link
                v-if="isAdmin"
                to="/admin"
                class="block px-4 py-2 hover:bg-gray-100 text-sm"
                @click="closeMenu"
              >Painel ADM</router-link>
              <button
                @click="closeMenu(); logout()"
                class="block w-full px-4 py-2 text-red-600 hover:bg-gray-100 text-sm text-left font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- CONTEÚDO -->
    <div class="flex-grow px-4 py-6 sm:py-10">
      <div class="max-w-6xl mx-auto">
        <UserStats
          v-if="$route.path === '/dashboard' && authReady"
          :key="authReady ? 'dash-on' : 'dash-off'"
          :authReady="authReady"
          @loading="onChildLoading"
          @ready="onChildReady"
        />
        <router-view v-else />
      </div>
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
      childLoading: false,
      childReady: false,
      menuOpen: false,
    }
  },

  async created() {
    const hashParams = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
    const searchParams = new URLSearchParams(window.location.search)

    const tokenFromHash = hashParams.get('token')
    const userFromHash = hashParams.get('user')
    const roleFromHash = hashParams.get('role')

    const tokenFromUrl = tokenFromHash || searchParams.get('token')
    const user = userFromHash || searchParams.get('user')
    const role = roleFromHash || searchParams.get('role')

    this.userName = user || localStorage.getItem('user_name') || 'Usuário'
    if (role) localStorage.setItem('user_role', role)

    this.applyAuthToken(tokenFromUrl)

    // Limpa a URL
    if (tokenFromUrl || user || role) {
      const url = new URL(window.location.href)
      ;['token', 'user', 'role'].forEach(k => searchParams.delete(k))
      url.search = searchParams.toString() ? `?${searchParams}` : ''
      ;['token', 'user', 'role'].forEach(k => hashParams.delete(k))
      url.hash = hashParams.toString() ? `#${hashParams}` : ''
      window.history.replaceState({}, '', url.toString())
    }

    if (this.authReady) {
      await this.fetchMe()
    }

    setTimeout(() => {
      if(this.childLoading && !this.childReady){
        console.warn('🛑 Timeout: escondendo overlay de emergência')
        this.childLoading = false
        this.childReady = true
      }
    }, 8000)

    if (this.$route.path === '/dashboard') {
      this.childLoading = true
      this.childReady = false
    }
  },

  computed: {
    isAdmin() {
      return this.userRole === 'adm'
    },
    pageTitle() {
      switch (this.$route.path) {
        case '/schedule':
          return 'Agendar Serviços'
        case '/contact':
          return 'Serviços'
        case '/admin':
          return 'Painel Administrativo'
        default:
          return 'Home'
      }
    },
    showOverlay() {
      return (
        this.$route.path === '/dashboard' &&
        this.authReady &&
        (this.childLoading || !this.childReady)
      )
    },
  },

  methods: {
    closeMenu() {
      this.menuOpen = false
    },
    onChildLoading(flag) {
      this.childLoading = !!flag
    },
    onChildReady() {
      this.childReady = true
      this.childLoading = false
    },
    applyAuthToken(tokenMaybe) {
      const token = tokenMaybe || localStorage.getItem('auth_token')
      if (tokenMaybe) localStorage.setItem('auth_token', tokenMaybe)
      if (token && api?.defaults?.headers?.common) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      this.authReady = !!token
    },
    async fetchMe() {
      try {
        const { data } = await api.get('/me')
        this.userRole = data?.role || ''
        this.userName = data?.name || this.userName
        if (data?.name) localStorage.setItem('user_name', data.name)
        if (data?.role) localStorage.setItem('user_role', data.role)
      } catch (e) {
        localStorage.clear()
        this.authReady = false
        this.$router.push('/')
      }
    },
    isActiveRoute(route) {
      return this.$route.path === route
    },
    navLinkClass(path) {
      return [
        'transition font-medium',
        this.isActiveRoute(path)
          ? 'bg-white text-[#c06a28]'
          : 'bg-white/10 hover:bg-white/20 text-white',
      ]
    },
    async logout() {
      try {
        await api.post('/logout')
      } catch {
        // ignora erros de logout
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease;
}

/* Mobile ajustes */
@media (max-width: 640px) {
  header img {
    display: none;
  }
}
</style>
