<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-[Outfit] text-gray-900">
    <!-- Overlay -->
    <transition name="fade">
      <div
        v-if="loading || saving"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span class="font-medium">{{ saving ? 'Salvando…' : 'Carregando…' }}</span>
        </div>
      </div>
    </transition>

    <h2 class="text-2xl font-bold text-center">Serviços</h2>

    <!-- Busca e ações -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <input
        v-model="q"
        placeholder="Buscar..."
        class="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none"
        :disabled="loading || saving"
      />
      <div class="flex gap-2">
        <button
          @click="fetchServicos"
          :disabled="loading || saving"
          class="px-5 py-2 rounded-full bg-[#c06a28] hover:bg-[#a15721] text-white font-medium text-sm shadow-sm transition disabled:opacity-60"
        >
          Buscar
        </button>
        <button
          @click="abrirNovo"
          :disabled="loading || saving"
          class="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm shadow-sm transition disabled:opacity-60"
        >
          Novo
        </button>
      </div>
    </div>

    <!-- Lista Mobile -->
    <div class="md:hidden space-y-3">
      <div
        v-for="s in (servicos.data || [])"
        :key="s.id"
        class="bg-white rounded-2xl shadow border p-4"
      >
        <div class="text-sm">
          <div class="flex items-center justify-between">
            <strong class="truncate max-w-[65%]">{{ s.servico }}</strong>
            <span class="text-gray-600">{{ formatMoney(s.preco) }}</span>
          </div>
          <div class="text-gray-500 mt-1 text-xs">Código: {{ s.codigo }}</div>
        </div>

        <div class="mt-4 flex gap-2">
          <button
            @click="editar(s)"
            :disabled="saving || loading"
            class="flex-1 px-4 py-2 rounded-full bg-[#c06a28] hover:bg-[#a15721] text-white text-sm font-medium transition disabled:opacity-60"
          >
            Editar
          </button>
          <button
            @click="remover(s.id)"
            :disabled="saving || loading"
            class="flex-1 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-60"
          >
            Excluir
          </button>
        </div>
      </div>

      <p
        v-if="!loading && (!servicos.data || !servicos.data.length)"
        class="text-center text-gray-500"
      >
        Nenhum serviço encontrado.
      </p>
    </div>

    <!-- Tabela Desktop -->
    <div class="hidden md:block overflow-x-auto rounded-3xl border border-gray-200 shadow">
      <table class="w-full text-sm">
        <thead class="bg-[#fafafa] border-b">
          <tr class="text-gray-700">
            <th class="py-3 px-4 text-left font-semibold">Código</th>
            <th class="py-3 px-4 text-left font-semibold">Serviço</th>
            <th class="py-3 px-4 text-left font-semibold">Preço</th>
            <th class="py-3 px-4 text-center font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in (servicos.data || [])"
            :key="s.id"
            class="hover:bg-[#fdf8f5] border-b"
          >
            <td class="py-3 px-4 whitespace-nowrap">{{ s.codigo }}</td>
            <td class="py-3 px-4 truncate">{{ s.servico }}</td>
            <td class="py-3 px-4 whitespace-nowrap">{{ formatMoney(s.preco) }}</td>
            <td class="py-3 px-4 text-center space-x-2">
              <button
                @click="editar(s)"
                :disabled="saving || loading"
                class="px-4 py-1.5 rounded-full bg-[#c06a28] hover:bg-[#a15721] text-white text-sm font-medium transition disabled:opacity-60"
              >
                Editar
              </button>
              <button
                @click="remover(s.id)"
                :disabled="saving || loading"
                class="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-60"
              >
                Excluir
              </button>
            </td>
          </tr>
          <tr v-if="!loading && (!servicos.data || !servicos.data.length)">
            <td colspan="4" class="text-center py-6 text-gray-500">
              Nenhum serviço encontrado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <div
      v-if="servicos && (servicos.last_page || 1) > 1"
      class="flex items-center justify-center gap-3 pt-5"
    >
      <button
        :disabled="!servicos.prev_page_url || loading || saving"
        @click="goto(servicos.current_page - 1)"
        class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
      >
        Anterior
      </button>
      <span class="text-sm text-gray-600">
        Página {{ servicos.current_page || 1 }} de {{ servicos.last_page || 1 }}
      </span>
      <button
        :disabled="!servicos.next_page_url || loading || saving"
        @click="goto(servicos.current_page + 1)"
        class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
      >
        Próxima
      </button>
    </div>

    <!-- Modal -->
    <transition name="fade">
      <div
        v-if="modal"
        class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      >
        <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md mx-3 space-y-4">
          <h3 class="text-xl font-semibold text-center text-[#1a1a1a]">
            {{ form.id ? 'Editar Serviço' : 'Novo Serviço' }}
          </h3>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700">Código *</label>
              <input
                v-model.trim="form.codigo"
                placeholder="Ex.: CMQ"
                class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Nome do serviço *</label>
              <input
                v-model.trim="form.servico"
                placeholder="Ex.: Corte de Máquina"
                class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Preço (R$) *</label>
              <input
                v-model.number="form.preco"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex.: 30.00"
                class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none"
                required
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <button
              @click="salvar"
              :disabled="saving"
              class="px-5 py-2 rounded-full bg-[#c06a28] hover:bg-[#a15721] text-white font-medium text-sm transition disabled:opacity-60"
            >
              <span v-if="saving">Salvando…</span>
              <span v-else>Salvar</span>
            </button>
            <button
              @click="fechar"
              :disabled="saving"
              class="px-5 py-2 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-medium disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import api from '@/services/api'
import { toastSuccess, toastError, toastWarning } from '@/plugins/alerts'

export default {
  name: 'AdminServicos',
  data() {
    return {
      q: '',
      servicos: { data: [], current_page: 1, last_page: 1 },
      page: 1,
      modal: false,
      saving: false,
      loading: false,
      form: { id: null, codigo: '', servico: '', preco: 0 },
    }
  },
  mounted() {
    this.fetchServicos()
  },
  methods: {
    async fetchServicos() {
      this.loading = true
      try {
        const res = await api.get('/admin/servicos', { params: { q: this.q, page: this.page } })
        this.servicos = res.data || { data: [], current_page: 1, last_page: 1 }
      } catch {
        toastError('Erro ao carregar serviços.')
        this.servicos = { data: [], current_page: 1, last_page: 1 }
      } finally {
        this.loading = false
      }
    },
    goto(p) {
      if (!p || p < 1 || (this.servicos.last_page && p > this.servicos.last_page)) return
      this.page = p
      this.fetchServicos()
    },
    abrirNovo() {
      this.form = { id: null, codigo: '', servico: '', preco: 0 }
      this.modal = true
    },
    editar(s) {
      this.form = { id: s.id, codigo: s.codigo || '', servico: s.servico || '', preco: Number(s.preco ?? 0) }
      this.modal = true
    },
    fechar() { this.modal = false },
    async salvar() {
      if (!this.form.codigo || !this.form.servico) {
        toastWarning('Preencha Código e Serviço.')
        return
      }
      this.saving = true
      try {
        const payload = { codigo: this.form.codigo, servico: this.form.servico, preco: this.form.preco }
        if (this.form.id) {
          await api.put(`/admin/servicos/${this.form.id}`, payload)
          toastSuccess('Serviço atualizado.')
        } else {
          await api.post('/admin/servicos', payload)
          toastSuccess('Serviço criado.')
        }
        this.modal = false
        await this.fetchServicos()
      } catch {
        toastError('Falha ao salvar serviço.')
      } finally {
        this.saving = false
      }
    },
    async remover(id) {
      if (!confirm('Deseja realmente excluir este serviço?')) return
      this.loading = true
      try {
        await api.delete(`/admin/servicos/${id}`)
        toastSuccess('Serviço excluído.')
        await this.fetchServicos()
      } catch {
        toastError('Falha ao excluir serviço.')
      } finally {
        this.loading = false
      }
    },
    formatMoney(v) {
      const n = Number(v ?? 0)
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
