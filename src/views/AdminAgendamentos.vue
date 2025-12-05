<template>
  <main class="min-h-screen bg-gradient-to-br from-[#f1efec] to-[#e7e5e2] text-gray-900 font-[Outfit] flex flex-col items-center py-10 px-4">
    <!-- CONTEÚDO PRINCIPAL -->
    <section class="w-full max-w-6xl bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
      <h2 class="text-2xl sm:text-3xl font-bold text-[#1a1a1a] text-center">
        Agendamentos
      </h2>

      <!-- FILTROS -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label class="text-sm text-gray-600">Busca</label>
          <input
            v-model="q"
            placeholder="Usuário ou serviço"
            class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none"
          />
        </div>

        <div>
          <label class="text-sm text-gray-600">Serviço</label>
          <select
            v-model="servicoId"
            class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] bg-white"
          >
            <option value="">Todos</option>
            <option v-for="s in servicosOpts" :key="s.id" :value="s.id">{{ s.servico }}</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600">Cliente</label>
          <select
            v-model="usuarioId"
            class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] bg-white"
          >
            <option value="">Todos</option>
            <option v-for="u in usuariosOpts" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-600">Mês/Ano</label>
          <input
            v-model="mesAno"
            type="month"
            class="border border-gray-300 rounded-lg w-full px-3 py-2 text-sm focus:ring-2 focus:ring-[#c06a28] focus:outline-none bg-white"
          />
        </div>

        <div class="flex gap-2">
          <button
            @click="filtrar"
            :disabled="loading"
            class="flex-1 px-4 py-2 rounded-full bg-[#c06a28] hover:bg-[#a15721] text-white font-medium text-sm shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
              Filtrando...
            </span>
            <span v-else>Filtrar</span>
          </button>
          <button
            @click="limpar"
            :disabled="loading"
            class="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Limpar
          </button>
        </div>
      </div>

      <!-- EXPORTAÇÕES -->
      <div class="flex flex-wrap items-center justify-end gap-3 pt-2">
        <button
          @click="exportarXlsx"
          :disabled="exporting || loading || !(itens && itens.data && itens.data.length)"
          title="Exportar XLSX"
          class="p-2 rounded-full border hover:bg-gray-50 transition disabled:opacity-50"
        >
          <img :src="icons.excel" alt="Exportar XLSX" class="w-6 h-6" />
        </button>
        <button
          @click="exportarPdf"
          :disabled="exporting || loading || !(itens && itens.data && itens.data.length)"
          title="Exportar PDF"
          class="p-2 rounded-full border hover:bg-gray-50 transition disabled:opacity-50"
        >
          <img :src="icons.pdf" alt="Exportar PDF" class="w-6 h-6" />
        </button>
      </div>

      <!-- LISTAGEM DESKTOP -->
      <div class="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-[#fafafa] border-b">
            <tr class="text-gray-700">
              <th class="py-3 px-4 text-left font-semibold">Usuário</th>
              <th class="py-3 px-4 text-center font-semibold">Data</th>
              <th class="py-3 px-4 text-center font-semibold">Hora</th>
              <th class="py-3 px-4 text-left font-semibold">Serviço</th>
              <th class="py-3 px-4 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="a in itens.data"
              :key="a.id"
              class="hover:bg-[#fdf8f5] border-b transition"
            >
              <td class="py-3 px-4 truncate">{{ usuarioNome(a) }}</td>
              <td class="py-3 px-4 text-center">{{ formatDate(a.data_agendamento) }}</td>
              <td class="py-3 px-4 text-center">{{ a.hora_agendamento || '-' }}</td>
              <td class="py-3 px-4 truncate">{{ servicoNome(a) }}</td>
              <td class="py-3 px-4 text-center">
                <button
                  @click="cancelar(a.id)"
                  class="text-red-500 hover:text-red-700 p-2 rounded-full bg-red-50 hover:bg-red-100 transition"
                  title="Cancelar agendamento"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!(itens && itens.data && itens.data.length)">
              <td colspan="5" class="text-center py-5 text-gray-500">Sem dados</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- LISTAGEM MOBILE -->
      <div class="md:hidden space-y-3">
        <div
          v-for="a in itens.data"
          :key="a.id"
          class="bg-white rounded-2xl shadow p-4 border"
        >
          <div class="text-sm">
            <div class="flex justify-between">
              <strong class="truncate">{{ usuarioNome(a) }}</strong>
              <span class="text-gray-500">{{ a.hora_agendamento || '-' }}</span>
            </div>
            <div class="text-gray-600">{{ formatDate(a.data_agendamento) }}</div>
            <div class="mt-1 text-gray-700">{{ servicoNome(a) }}</div>
          </div>
          <button
            @click="cancelar(a.id)"
            class="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-full text-sm font-medium"
          >
            Cancelar
          </button>
        </div>

        <p v-if="!(itens && itens.data && itens.data.length)" class="text-center text-gray-500">
          Nenhum agendamento encontrado.
        </p>
      </div>

      <!-- PAGINAÇÃO -->
      <div
        v-if="itens && (itens.last_page || 1) > 1"
        class="flex justify-center items-center gap-3 pt-4"
      >
        <button
          :disabled="!itens.prev_page_url || loading"
          @click="goto(itens.current_page - 1)"
          class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          Anterior
        </button>
        <span class="text-sm text-gray-600">
          Página {{ itens.current_page || 1 }} de {{ itens.last_page || 1 }}
        </span>
        <button
          :disabled="!itens.next_page_url || loading"
          @click="goto(itens.current_page + 1)"
          class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm"
        >
          Próxima
        </button>
      </div>
    </section>

    <!-- OVERLAY -->
    <transition name="fade">
      <div
        v-if="loading"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span class="font-medium">Carregando...</span>
        </div>
      </div>
    </transition>
  </main>
</template>

<script>
import api from '@/services/api'
import excelIcon from '@/assets/excel.png'
import pdfIcon from '@/assets/pdf.png'
import { toastError, toastSuccess } from '@/plugins/alerts'

export default {
  name: 'AdminAgendamentos',
  data() {
    return {
      q: '',
      servicoId: '',
      usuarioId: '',
      mesAno: '',
      page: 1,
      itens: { data: [], current_page: 1, last_page: 1 },
      servicosOpts: [],
      usuariosOpts: [],
      loading: false,
      exporting: false,
      icons: { excel: excelIcon, pdf: pdfIcon },
    }
  },
  mounted() {
    this.bootstrap()
  },
  methods: {
    async bootstrap() {
      await Promise.all([this.fetchServicos(), this.fetchUsuarios()])
      await this.fetchItens()
    },
    async fetchServicos() {
      try {
        const res = await api.get('/admin/servicos/options')
        this.servicosOpts = Array.isArray(res.data) ? res.data : []
      } catch {
        toastError('Erro ao carregar serviços.')
      }
    },
    async fetchUsuarios() {
      try {
        const res = await api.get('/admin/usuarios/options')
        this.usuariosOpts = Array.isArray(res.data) ? res.data : []
      } catch {
        toastError('Erro ao carregar usuários.')
      }
    },
    paramsComFiltros() {
      const params = { q: this.q, page: this.page }
      if (this.servicoId) params.servico_id = this.servicoId
      if (this.usuarioId) params.usuario_id = this.usuarioId
      if (this.mesAno) {
        const [ano, mes] = this.mesAno.split('-')
        if (ano && mes) { params.ano = ano; params.mes = mes }
      }
      return params
    },
    async fetchItens() {
      this.loading = true
      try {
        const res = await api.get('/admin/agendamentos', { params: this.paramsComFiltros() })
        this.itens = res.data || { data: [], current_page: 1, last_page: 1 }
      } catch {
        toastError('Erro ao carregar agendamentos.')
      } finally {
        this.loading = false
      }
    },
    filtrar() { this.page = 1; this.fetchItens() },
    goto(p) {
      if (!p || p < 1 || (this.itens.last_page && p > this.itens.last_page)) return
      this.page = p
      this.fetchItens()
    },
    async cancelar(id) {
      const ok = confirm('Cancelar este agendamento?')
      if (!ok) return
      this.loading = true
      try {
        await api.delete(`/admin/agendamentos/${id}`)
        toastSuccess('Agendamento cancelado.')
        await this.fetchItens()
      } catch {
        toastError('Falha ao cancelar agendamento.')
      } finally {
        this.loading = false
      }
    },
    usuarioNome(a) {
      return a?.usuario?.name || a?.usuario || '-'
    },
    servicoNome(a) {
  if (Array.isArray(a.servicos)) {
    return a.servicos.map(s => s.nome || s.servico).join(', ')
  }
  const s = a?.servico
  return s?.nome || s?.servico || s?.name || s || '-'
},
    formatDate(d) {
  if (!d) return '-'

  // Evita conversão automática de timezone do JS
  const [year, month, day] = d.split('-')
  if (!year || !month || !day) return d

  return `${day}/${month}/${year}`
},
    limpar() {
      this.q = this.servicoId = this.usuarioId = this.mesAno = ''
      this.page = 1
      this.fetchItens()
    },
    async exportarXlsx() {
      this.exporting = true
      try {
        const res = await api.get('/admin/agendamentos/export/xlsx', { params: this.paramsComFiltros(), responseType: 'blob' })
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'agendamentos.xlsx'
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        toastError('Falha ao exportar XLSX.')
      } finally {
        this.exporting = false
      }
    },
    async exportarPdf() {
      this.exporting = true
      try {
        const res = await api.get('/admin/agendamentos/export/pdf', { params: this.paramsComFiltros(), responseType: 'blob' })
        const url = URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        a.download = 'agendamentos.pdf'
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        toastError('Falha ao exportar PDF.')
      } finally {
        this.exporting = false
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
