<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-4 text-center">Painel de Agendamentos</h2>

    <div class="mb-4 text-center">
      <label for="ano" class="font-semibold mr-2">Selecione o ano:</label>
      <select id="ano" v-model="selectedYear" class="border rounded px-2 py-1">
        <option v-for="year in anosDisponiveis" :key="year" :value="year">{{ year }}</option>
      </select>
    </div>

    <div class="bg-white p-4 rounded shadow md:max-w-5xl mx-auto">
      <h3 class="text-center font-semibold mb-2">Seus Agendamentos</h3>

      <div class="overflow-x-auto">
        <table
            v-if="Array.isArray(agendamentosDetalhados) && agendamentosDetalhados.length"
            class="w-full table-fixed text-sm sm:text-base mt-2"
        >
          <colgroup>
            <col class="col-date" />
            <col class="col-hora" />
            <col class="col-servico" />
            <col class="col-acoes" />
          </colgroup>

          <thead>
          <tr class="bg-gray-200">
            <th class="px-2 sm:px-4 py-2 text-center">Data</th>
            <th class="px-2 sm:px-4 py-2 text-center">Horário</th>
            <th class="px-2 sm:px-4 py-2 text-center">Serviço</th>
            <th class="px-2 sm:px-4 py-2 text-center">Ações</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(item, index) in agendamentosDetalhados" :key="index" class="border-b">
            <td class="px-2 sm:px-4 py-2">
              {{ formatDate(item.data_agendamento || item.data) }}
            </td>
            <td class="px-2 sm:px-4 py-2">
              {{ (item.hora_agendamento || item.hora_ini || '').slice(0, 5) }}
            </td>
            <td class="px-2 sm:px-4 py-2">
              <span
                  class="block truncate sm:whitespace-normal sm:break-words max-w-[160px] sm:max-w-none"
                  :title="item?.servico?.servico || item?.servico?.nome || item?.servico?.name || getServicoNome(item.servico_id)"
              >
                {{ item?.servico?.servico || item?.servico?.nome || item?.servico?.name || getServicoNome(item.servico_id) }}
              </span>
            </td>
            <td class="px-1 sm:px-2 py-2 text-center">
              <button
                  @click="excluirAgendamento(item.id)"
                  class="text-red-600 hover:text-red-800 inline-flex items-center justify-center"
                  title="Excluir agendamento"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                     viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m12 0H5"/>
                </svg>
              </button>
            </td>
          </tr>
          </tbody>
        </table>

        <p v-else class="text-center text-gray-500 mt-6">Nenhum agendamento encontrado.</p>
      </div>

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

function notify (opts = {}) {
  try {
    if (window?.Swal?.fire) return window.Swal.fire(opts)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // evita regra no-empty e ajuda no debug
      console.debug('[notify] fallback', e)
    }
  }
  const title = opts.title || ''
  const text = opts.text || ''
  const msg = [title, text].filter(Boolean).join('\n')
  if (opts.icon === 'error') console.error('❌', msg)
  else if (opts.icon === 'warning') console.warn('⚠️', msg)
  else console.log('ℹ️', msg)
  if (window?.alert) window.alert(msg || 'Ação executada.')
}

async function confirmDialog({
                               title = 'Confirmar',
                               text = 'Deseja continuar?',
                               confirmButtonText = 'OK',
                               cancelButtonText = 'Cancelar',
                               icon = 'question'
                             } = {}) {
  try {
    if (window?.Swal?.fire) {
      const ret = await window.Swal.fire({
        title, text, icon,
        showCancelButton: true,
        confirmButtonText, cancelButtonText
      })
      return !!ret.isConfirmed
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[confirmDialog] fallback', e)
    }
  }
  return window?.confirm ? window.confirm(`${title}\n${text}`) : true
}

export default {
  name: 'UserStats',
  emits: ['loading', 'ready'],
  props: { authReady: { type: Boolean, default: false } },
  data() {
    return {
      selectedYear: null,
      anosDisponiveis: [],
      agendamentosDetalhados: [],
      pagination: { current_page: 1, last_page: 1, total: 0 },
      servicos: [],
      loading: false,
      booting: false
    }
  },
  mounted() {
    this.initAnosDisponiveis()
    this.selectedYear = this.anosDisponiveis[0]
    if (this.authReady) this.boot()
  },
  watch: {
    authReady(val) { if (val && !this.booting && this.agendamentosDetalhados.length === 0) this.boot() },
    selectedYear() { if (this.authReady) this.fetchEstatisticas(1) }
  },
  methods: {
    async boot() {
      this.booting = true
      this.$emit('loading', true)
      try {
        await this.fetchServicos()
        await this.fetchEstatisticas(1)
      } finally {
        await this.$nextTick()
        this.$emit('ready')
        this.$emit('loading', false)
        this.booting = false
      }
    },
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
      } catch {
        this.servicos = []
      }
    },
    async fetchEstatisticas(page = 1) {
      if (this.loading) return
      this.loading = true
      try {
        const { data } = await api.get('/dashboard/estatisticas', { params: { ano: this.selectedYear, page } })
        if (Array.isArray(data.agendamentosDetalhados)) {
          this.agendamentosDetalhados = data.agendamentosDetalhados
          this.pagination = data.pagination || { current_page: page, last_page: 1, total: data.agendamentosDetalhados.length }
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
      } catch {
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
      } catch (e) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || 'Erro ao excluir'
        notify({ icon: 'error', title: 'Erro', text: msg })
      }
    },
    goToPage(p) { if (!this.loading && p >= 1 && p <= this.pagination.last_page) this.fetchEstatisticas(p) },
    formatDate(date) { return date ? dayjs.utc(date).format('DD/MM/YYYY') : '-' },
    getServicoNome(servicoId) {
      const s = this.servicos.find(x => Number(x.id) === Number(servicoId))
      return s ? (s.servico || s.nome || s.name || 'Não informado') : 'Não informado'
    }
  }
}
</script>

<style scoped>
.col-date   { width: 30%; }
.col-hora   { width: 22%; }
.col-servico{ width: auto; }

.col-acoes { width: 64px; }                 /* antes era 48px */
@media (min-width: 640px) { .col-acoes { width: 80px; } }
@media (min-width: 1024px){ .col-acoes { width: 88px; } }

</style>
