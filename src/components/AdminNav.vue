<template>
  <header class="bg-blue-600 text-white px-3 sm:px-6 py-4 sm:py-6">
    <div class="max-w-6xl mx-auto flex justify-between items-center gap-3">
      <!-- Título / saudação -->
      <div class="min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold truncate">Painel Administrativo</h1>
        <p v-if="userName" class="text-xs sm:text-sm opacity-90 truncate">
          Bem-vindo, {{ userName }}
        </p>
      </div>

      <!-- Navegação -->
      <nav class="flex items-center gap-2">
        <!-- Itens inteiros em ≥ md -->
        <div class="hidden md:flex items-center gap-2">
          <router-link
              to="/dashboard"
              :class="navLinkClass('/dashboard')"
              class="text-sm px-3 py-2"
          >
            Painel do Usuário
          </router-link>

          <router-link
              to="/admin/agendamentos"
              :class="navLinkClass('/admin/agendamentos')"
              class="text-sm px-3 py-2"
          >
            Agendamentos
          </router-link>

          <router-link
              to="/admin/servicos"
              :class="navLinkClass('/admin/servicos')"
              class="text-sm px-3 py-2"
          >
            Serviços
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
              @click="toggleMenu"
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
              class="absolute right-0 mt-2 w-52 bg-white text-gray-800 rounded-lg shadow-xl overflow-hidden z-50"
              @click.stop
          >
            <router-link
                to="/dashboard"
                class="block px-3 py-2 text-sm hover:bg-gray-100"
                @click="closeMenu"
            >
              Painel do Usuário
            </router-link>
            <router-link
                to="/admin/agendamentos"
                class="block px-3 py-2 text-sm hover:bg-gray-100"
                @click="closeMenu"
            >
              Agendamentos
            </router-link>
            <router-link
                to="/admin/servicos"
                class="block px-3 py-2 text-sm hover:bg-gray-100"
                @click="closeMenu"
            >
              Serviços
            </router-link>

            <div class="my-1 border-t"></div>

            <!-- Sair centralizado -->
            <button
                @click="handleLogoutFromMenu"
                class="w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600 font-medium flex items-center justify-center"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<script>
import api from '@/services/api'

export default {
  name: 'AdminNav',
  data () {
    return {
      menuOpen: false,
      userName: localStorage.getItem('user_name') || ''
    }
  },
  watch: {
    $route () {
      // fecha dropdown ao navegar
      this.menuOpen = false
    }
  },
  methods: {
    isActiveRoute (path) {
      return this.$route.path === path
    },
    navLinkClass (path) {
      return [
        'rounded whitespace-nowrap transition',
        this.isActiveRoute(path) ? 'bg-white/20 font-semibold' : 'bg-white/10 hover:bg-white/20'
      ]
    },
    toggleMenu () {
      this.menuOpen = !this.menuOpen
    },
    closeMenu () {
      this.menuOpen = false
    },
    handleLogoutFromMenu () {
      this.closeMenu()
      this.logout()
    },
    async logout () {
      try {
        await api.post('/logout')
      } catch (e) {
        // mantém um log leve em desenvolvimento; evita bloco vazio (no-empty)
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[logout] erro ignorado', e?.message || e)
        }
      } finally {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_name')
        try {
          await this.$router.push('/')
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[router push /] ignorado:', err?.message || err)
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.sr-only {
  position: absolute; width:1px; height:1px; padding:0; margin:-1px;
  overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0;
}
</style>
