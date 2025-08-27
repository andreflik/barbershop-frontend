<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4 text-center">Painel de Agendamentos</h2>

    <div class="mb-4 text-center">
      <label for="ano" class="font-semibold mr-2">Selecione o ano:</label>
      <select id="ano" v-model="selectedYear" class="border rounded px-2 py-1">
        <option v-for="year in anosDisponiveis" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <div class="bg-white p-4 rounded shadow max-w-5xl mx-auto">
      <h3 class="text-center font-semibold mb-2">Seus Agendamentos</h3>

      <table
          v-if="Array.isArray(agendamentosDetalhados) && agendamentosDetalhados.length"
          class="w-full table-auto mt-2"
      >
        <thead>
        <tr class="bg-gray-200">
          <th class="px-4 py-2">Data</th>
          <th class="px-4 py-2">Horário</th>
          <th class="px-4 py-2">Serviço</th>
          <th class="px-4 py-2">Ações</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in agendamentosDetalhados" :key="index">
          <td class="border px-4 py-2">{{ formatDate(item.data_agendamento || item.data) }}</td>
          <td class="border px-4 py-2">{{ (item.hora_agendamento || item.hora_ini || '').slice(0, 5) }}</td>
          <td class="border px-4 py-2">
            {{ item?.servico?.servico || item?.servico?.nome || item?.servico?.name || getServicoNome(item.servico_id) }}
          </td>
          <td class="border px-4 py-2">
            <button
                @click="excluirAgendamento(item.id)"
                class="text-red-600 hover:text-red-800"
                title="Excluir agendamento"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m12 0H5" />
              </svg>
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <p v-else class="text-center text-gray-500 mt-6">Nenhum agendamento encontrado.</p>

      <div v-if="pagination?.total > 0" class="flex justify-center mt-4 space-x-2">
        <button
            @click="goToPage(pagination.current_page - 1)"
            :disabled="pagination.current_page === 1 || loading"
            class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span class="px-3 py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
        <button
            @click="goToPage(pagination.current_page + 1)"
            :disabled="pagination.current_page === pagination.last_page || loading"
            class="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import api from '@/services/api'
dayjs.extend(utc)

/** Notificação genérica */
function notify (opts = {}) {
  try {
    if (typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function') {
      return window.Swal.fire(opts)
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.debug('[notify] fallback error:', e)
  }
  const title = opts.title || ''
  const text = opts.text || ''
  const msg = [title, text].filter(Boolean).join('\n')
  if (opts.icon === 'error') console.error('❌', title, text)
  else if (opts.icon === 'warning') console.warn('⚠️', title, text)
  else console.log('ℹ️', title, text)
  if (typeof window !== 'undefined' && window.alert) window.alert(msg || 'Ação executada.')
}

/** Diálogo de confirmação */
async function confirmDialog({
                               title = 'Confirmar',
                               text = 'Deseja continuar?',
                               confirmButtonText = 'OK',
                               cancelButtonText = 'Cancelar',
                               icon = 'question'
                             } = {}) {
  try {
    if (typeof window !== 'undefined' && window.Swal && typeof window.Swal.fire === 'function') {
      const ret = await window.Swal.fire({
        title, text, icon,
        showCancelButton: true,
        confirmButtonText, cancelButtonText
      })
      return !!ret.isConfirmed
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.debug('[confirmDialog] fallback error:', e)
  }
  return typeof window !== 'undefined' ? window.confirm(`${title}\n${text}`) : true
}

export default {
  name: 'UserStats',
  props: {
    authReady: { type: Boolean, default: false }
  },
  data() {
    return {
      selectedYear: null,
      anosDisponiveis: [],
      agendamentosDetalhados: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
      servicos: [],
      loading: false
    }
  },
  mounted() {
    this.initAnosDisponiveis()
    this.selectedYear = this.anosDisponiveis[0]
  },
  watch: {
    authReady: {
      immediate: true,
      async handler(val) {
        if (val) {
          await this.fetchServicos()
          await this.fetchEstatisticas(1)
        }
      }
    },
    selectedYear() {
      if (this.authReady) this.fetchEstatisticas(1)
    }
  },
  methods: {
    initAnosDisponiveis() {
      const atual = new Date().getFullYear()
      this.anosDisponiveis = Array.from({ length: 5 }, (_, i) => atual - i)
    },

    async fetchServicos() {
      try {
        const { data } = await api.get('/agendar-corte/servicos')
        this.servicos =
            Array.isArray(data?.servicos) ? data.servicos :
                Array.isArray(data?.data)     ? data.data :
                    Array.isArray(data)           ? data : []
      } catch (error) {
        console.error('Erro ao carregar serviços:', error)
        this.servicos = []
      }
    },

    async fetchEstatisticas(page = 1) {
      if (this.loading) return
      this.loading = true
      try {
        const { data } = await api.get('/dashboard/estatisticas', {
          params: { ano: this.selectedYear, page }
        })

        if (Array.isArray(data.agendamentosDetalhados)) {
          this.agendamentosDetalhados = data.agendamentosDetalhados
          this.pagination = data.pagination || {
            current_page: page,
            last_page: 1,
            total: data.agendamentosDetalhados.length
          }
        } else if (data?.agendamentos?.data) {
          this.agendamentosDetalhados = data.agendamentos.data
          this.pagination = {
            current_page: data.agendamentos.current_page || page,
            last_page: data.agendamentos.last_page || 1,
            total: data.agendamentos.total || data.agendamentos.data.length
          }
        } else if (Array.isArray(data.data)) {
          this.agendamentosDetalhados = data.data
          this.pagination = { current_page: page, last_page: 1, total: data.data.length }
        } else {
          this.agendamentosDetalhados = []
          this.pagination = { current_page: 1, last_page: 1, total: 0 }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
        this.agendamentosDetalhados = []
        this.pagination = { current_page: 1, last_page: 1, total: 0 }
      } finally {
        this.loading = false
      }
    },

    async excluirAgendamento(id) {
      const ok = await confirmDialog({
        title: 'Tem certeza?',
        text: 'Você deseja excluir este agendamento?',
        icon: 'warning',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
      })
      if (!ok) return

      try {
        const { data } = await api.delete(`/agendar-corte/${id}`)
        notify({ icon: 'success', title: 'Excluído!', text: data?.message || 'Agendamento excluído.' })
        this.fetchEstatisticas(this.pagination?.current_page || 1)
      } catch (error) {
        const msg = error?.response?.data?.message || error?.response?.data?.error || 'Erro ao excluir'
        notify({ icon: 'error', title: 'Erro', text: msg })
      }
    },

    goToPage(p) {
      if (p >= 1 && p <= this.pagination.last_page) {
        this.fetchEstatisticas(p)
      }
    },

    formatDate(date) {
      if (!date) return '-'
      return dayjs.utc(date).format('DD/MM/YYYY')
    },

    getServicoNome(servicoId) {
      const s = this.servicos.find(x => Number(x.id) === Number(servicoId))
      if (!s) return 'Não informado'
      return s.servico || s.nome || s.name || 'Não informado'
    }
  }
}
</script>
