<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <div class="w-full max-w-sm bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-2xl font-bold text-center mb-6">Marquinhos Barbershop</h1>

      <button
          @click="loginWithGoogle"
          :disabled="loading"
          class="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i class="fab fa-google mr-2"></i>
        <span v-if="loading">Redirecionando…</span>
        <span v-else>Entrar com Google</span>
      </button>
    </div>
  </div>
</template>

<script>
import { toastError } from '@/plugins/alerts'

const API_URL = process.env.VUE_APP_API_URL

export default {
  name: 'UserLogin',
  data() {
    return { loading: false }
  },
  methods: {
    loginWithGoogle() {
      if (!API_URL) {
        toastError('Configuração da API ausente.')
        return
      }
      this.loading = true
      // redireciona; se por algum motivo não sair da página, volta o estado
      try {
        window.location.href = `${API_URL}/google/redirect`
        setTimeout(() => { this.loading = false }, 7000)
      } catch (e) {
        this.loading = false
        toastError('Falha ao iniciar login com Google.')
      }
    }
  }
}
</script>

<style scoped>
.container { max-width: 400px; margin: auto; }
</style>
