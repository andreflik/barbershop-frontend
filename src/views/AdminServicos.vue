<template>
  <div class="relative min-h-screen p-6 space-y-6">
    <!-- Overlay de carregamento em tela cheia -->
    <transition name="fade">
      <div
          v-if="loading || saving"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center"
          role="status"
          aria-live="polite"
      >
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span class="font-medium">{{ saving ? 'Salvando…' : 'Carregando…' }}</span>
        </div>
      </div>
    </transition>

    <h2 class="text-2xl font-bold">Serviços</h2>

    <div class="flex items-center gap-2">
      <input
          v-model="q"
          placeholder="Buscar..."
          class="border p-2 rounded"
          :disabled="loading || saving"
      />
      <button
          @click="fetchServicos"
          :disabled="loading || saving"
          class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        Buscar
      </button>
      <button
          @click="abrirNovo"
          :disabled="loading || saving"
          class="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
      >
        Novo
      </button>
    </div>

    <table class="w-full table-auto">
      <thead class="bg-gray-200">
      <tr>
        <th class="px-4 py-2 text-left">Código</th>
        <th class="px-4 py-2 text-left">Serviço</th>
        <th class="px-4 py-2 text-left">Preço</th>
        <th class="px-4 py-2"></th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="s in (servicos.data || [])"
          :key="s.id"
          class="border-b"
      >
        <td class="px-4 py-2">{{ s.codigo }}</td>
        <td class="px-4 py-2">{{ s.servico }}</td>
        <td class="px-4 py-2">{{ formatMoney(s.preco) }}</td>
        <td class="px-4 py-2 text-right space-x-2">
          <button
              @click="editar(s)"
              :disabled="saving || loading"
              class="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-60"
          >
            Editar
          </button>
          <button
              @click="remover(s.id)"
              :disabled="saving || loading"
              class="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-60"
          >
            Excluir
          </button>
        </td>
      </tr>
      <tr v-if="!loading && (!servicos.data || !servicos.data.length)">
        <td colspan="4" class="text-center text-gray-500 py-4">Sem dados</td>
      </tr>
      </tbody>
    </table>

    <div
        v-if="servicos && (servicos.last_page || 1) > 1"
        class="flex items-center gap-2"
    >
      <button
          :disabled="!servicos.prev_page_url || loading || saving"
          @click="goto(servicos.current_page - 1)"
          class="px-3 py-1 border rounded disabled:opacity-60"
      >
        Anterior
      </button>
      <span>Página {{ servicos.current_page || 1 }} de {{ servicos.last_page || 1 }}</span>
      <button
          :disabled="!servicos.next_page_url || loading || saving"
          @click="goto(servicos.current_page + 1)"
          class="px-3 py-1 border rounded disabled:opacity-60"
      >
        Próxima
      </button>
    </div>

    <!-- Modal -->
    <div
        v-if="modal"
        class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-xl space-y-4 w-full max-w-md">
        <h3 class="text-xl font-semibold">{{ form.id ? 'Editar' : 'Novo' }} Serviço</h3>

        <label class="block text-sm font-medium">Código *</label>
        <input
            v-model.trim="form.codigo"
            placeholder="Ex.: CMQ"
            class="border p-2 w-full rounded"
            required
            :disabled="saving"
        />

        <label class="block text-sm font-medium mt-2">Nome do serviço *</label>
        <input
            v-model.trim="form.servico"
            placeholder="Ex.: Corte de Máquina"
            class="border p-2 w-full rounded"
            required
            :disabled="saving"
        />

        <label class="block text-sm font-medium mt-2">Preço (R$) *</label>
        <input
            v-model.number="form.preco"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 30.00"
            class="border p-2 w-full rounded"
            required
            :disabled="saving"
        />

        <div class="flex justify-end gap-2 pt-2">
          <button
              @click="salvar"
              :disabled="saving"
              class="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            <span v-if="saving">Salvando…</span>
            <span v-else>Salvar</span>
          </button>
          <button
              @click="fechar"
              :disabled="saving"
              class="border px-4 py-2 rounded disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
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
      servicos: { data: [], current_page: 1, last_page: 1, prev_page_url: null, next_page_url: null },
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
      } catch (e) {
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

    async confirmar(texto) {
      if (window.Swal && typeof window.Swal.fire === 'function') {
        const { isConfirmed } = await window.Swal.fire({
          icon: 'question',
          title: 'Confirmação',
          text: texto || 'Deseja continuar?',
          showCancelButton: true,
          confirmButtonText: 'Sim',
          cancelButtonText: 'Cancelar'
        })
        return isConfirmed
      }
      return window.confirm(texto || 'Deseja continuar?')
    },

    async salvar() {
      const payload = {
        codigo: (this.form.codigo || '').trim(),
        servico: (this.form.servico || '').trim(),
        preco: Number(this.form.preco ?? 0),
      }

      if (!payload.codigo || !payload.servico) {
        toastWarning('Preencha Código e Serviço.')
        return
      }

      this.saving = true
      try {
        if (this.form.id) {
          await api.put(`/admin/servicos/${this.form.id}`, payload)
          toastSuccess('Serviço atualizado.')
        } else {
          await api.post('/admin/servicos', payload)
          toastSuccess('Serviço criado.')
        }
        this.modal = false
        await this.fetchServicos()
      } catch (e) {
        toastError('Falha ao salvar serviço.')
      } finally {
        this.saving = false
      }
    },

    async remover(id) {
      const ok = await this.confirmar('Excluir este serviço?')
      if (!ok) return
      this.loading = true
      try {
        await api.delete(`/admin/servicos/${id}`)
        toastSuccess('Serviço excluído.')
        await this.fetchServicos()
      } catch (e) {
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity .15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
