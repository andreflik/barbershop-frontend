<template>
  <div class="min-h-screen">
    <header class="bg-blue-600 text-white px-6 py-6">
      <div class="max-w-6xl mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">Painel Administrativo</h1>
          <p class="text-sm opacity-90">Bem-vindo, Administrador</p>
        </div>

        <nav class="flex gap-2">
          <button @click="goUser" class="px-3 py-2 rounded bg-white/10 hover:bg-white/20">
            Painel do Usuário
          </button>

          <router-link :to="{ name: 'AdminAgendamentos' }" class="px-3 py-2 rounded bg-white/10 hover:bg-white/20">
            Agendamentos
          </router-link>

          <router-link :to="{ name: 'AdminServicos' }" class="px-3 py-2 rounded bg-white/10 hover:bg-white/20">
            Serviços
          </router-link>

          <button @click="logout" class="px-3 py-2 rounded bg-red-500 hover:bg-red-600" title="Sair">
            Sair
          </button>
        </nav>
      </div>
    </header>

    <main class="max-w-6xl mx-auto py-6 px-6">
      <router-view />
    </main>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: 'AdmDashboard',
  methods: {
    async logout() {
      try {
        await api.post('/logout');
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[logout] ignorando erro do /logout', e?.message || e);
        }
      } finally {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        this.$router.push('/').catch((err) => {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[router] push / falhou (ignorado)', err?.message || err);
          }
          return null;
        });
      }
    },
    goUser() {
      this.$router.push('/dashboard').catch((err) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[router] push /dashboard falhou (ignorado)', err?.message || err);
        }
        return null;
      });
    }
  }
};
</script>

<style scoped>
/* estilos via Tailwind */
</style>
