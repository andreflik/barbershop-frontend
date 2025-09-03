<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <!-- Overlay em tela cheia (controlado pelo UserStats) -->
    <transition name="fade">
      <div
          v-if="showOverlay"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div
              class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"
              aria-label="Carregando"
          ></div>
          <span class="font-medium">Carregando…</span>
        </div>
      </div>
    </transition>

    <!-- Header / Navbar -->
    <header class="bg-blue-600 text-white px-3 sm:px-6 py-4 sm:py-6">
      <div class="max-w-6xl mx-auto flex justify-between items-center gap-3">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold truncate">{{ pageTitle }}</h1>
          <p class="text-xs sm:text-sm opacity-90 truncate" v-if="userName">
            Bem-vindo, {{ userName }}
          </p>
        </div>

        <!-- NAV: Home fixo + demais itens responsivos -->
        <nav class="flex items-center gap-2">
          <!-- Home sempre visível -->
          <router-link
              to="/dashboard"
              :class="navLinkClass('/dashboard')"
              class="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            Home
          </router-link>

          <!-- Itens inteiros em ≥ md -->
          <div class="hidden md:flex items-center gap-2">
            <router-link
                to="/schedule"
                :class="navLinkClass('/schedule')"
                class="text-sm px-3 py-2"
            >
              Agendar Serviços
            </router-link>

            <router-link
                to="/contact"
                :class="navLinkClass('/contact')"
                class="text-sm px-3 py-2"
            >
              Serviços
            </router-link>

            <router-link
                v-if="isAdmin"
                to="/admin"
                :class="navLinkClass('/admin')"
                class="text-sm px-3 py-2"
            >
              Painel ADM
            </router-link>

            <button
                @click="logout"
                class="text-sm px-3 py-2 rounded bg-red-500 hover:bg-red-600"
                title="Sair"
            >
              Sair
            </button>
          </div>

          <!-- Dropdown em < md -->
          <div class="relative md:hidden">
            <button
                @click="menuOpen = !menuOpen"
                class="px-2 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1"
                aria-haspopup="true"
                :aria-expanded="menuOpen ? 'true' : 'false'"
                title="Mais"
            >
              <span class="material-icons text-base leading-none">menu</span>
              <span class="sr-only">Abrir menu</span>
              <span class="font-semibold">Mais</span>
            </button>

            <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden z-50"
                @click.stop
            >
              <router-link
                  to="/schedule"
                  class="block px-3 py-2 text-sm hover:bg-gray-100"
                  @click="closeMenu"
              >
                Agendar
              </router-link>

              <router-link
                  to="/contact"
                  class="block px-3 py-2 text-sm hover:bg-gray-100"
                  @click="closeMenu"
              >
                Serviços
              </router-link>

              <router-link
                  v-if="isAdmin"
                  to="/admin"
                  class="block px-3 py-2 text-sm hover:bg-gray-100"
                  @click="closeMenu"
              >
                Painel ADM
              </router-link>

              <div class="my-1 border-t"></div>

              <!-- Sair centralizado -->
              <button
                  @click="closeMenu(); logout()"
                  class="w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600 font-medium flex items-center justify-center"
              >
                Sair
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Conteúdo -->
    <div class="flex-grow">
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
    const hashParams   = new URLSearchParams((window.location.hash || '').replace(/^#/, ''))
    const searchParams = new URLSearchParams(window.location.search)

    const tokenFromHash = hashParams.get('token')
    const userFromHash  = hashParams.get('user')
    const roleFromHash  = hashParams.get('role')

    const tokenFromUrl  = tokenFromHash || searchParams.get('token')
    const user          = userFromHash  || searchParams.get('user')
    const role          = roleFromHash  || searchParams.get('role')

    this.userName = user || localStorage.getItem('user_name') || 'Usuário'
    if (role) localStorage.setItem('user_role', role)

    this.applyAuthToken(tokenFromUrl)

    // Limpa query/hash da URL
    if (tokenFromUrl || user || role) {
      const url = new URL(window.location.href)
      ;['token','user','role'].forEach(k => searchParams.delete(k))
      url.search = searchParams.toString() ? `?${searchParams}` : ''
      ;['token','user','role'].forEach(k => hashParams.delete(k))
      url.hash = hashParams.toString() ? `#${hashParams}` : ''
      window.history.replaceState({}, '', url.toString())
    }

    if (this.authReady) {
      await this.fetchMe()
    }

    if (this.authReady && this.$route.path === '/dashboard') {
      this.childLoading = true
      this.childReady = false
    }
  },

  watch: {
    $route() {
      this.menuOpen = false // fecha dropdown ao navegar
    }
  },

  computed: {
    isAdmin() { return this.userRole === 'adm' },
    pageTitle() {
      switch (this.$route.path) {
        case '/schedule': return 'Agendar Serviços'
        case '/contact':  return 'Serviços'
        case '/admin':    return 'Painel ADM'
        default:          return 'Home'
      }
    },
    showOverlay() {
      return this.$route.path === '/dashboard'
          && this.authReady
          && (this.childLoading || !this.childReady)
    }
  },

  methods: {
    closeMenu() { this.menuOpen = false },

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
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        this.userRole = ''
        this.authReady = false
        if (this.$route.path !== '/') {
          try {
            await this.$router.push('/')
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[router push /] ignorado:', err?.message || err)
            }
          }
        }
      }
    },

    isActiveRoute(route) { return this.$route.path === route },

    navLinkClass(path) {
      return [
        'rounded whitespace-nowrap transition',
        this.isActiveRoute(path)
            ? 'bg-white/20 font-semibold'
            : 'bg-white/10 hover:bg-white/20'
      ]
    },

    async logout() {
      try {
        await api.post('/logout')
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[logout] erro ignorado', e?.message || e)
        }
      } finally {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        this.userRole = ''
        this.authReady = false
        try {
          await this.$router.push('/')
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[router push /] ignorado:', err?.message || err)
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sr-only {
  position: absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
}
</style>
