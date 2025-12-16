<template>
  <div class="relative">
    <!-- Overlay em tela cheia -->
    <transition name="fade">
      <div
          v-if="loading"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center"
      >
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div
              class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"
              aria-label="Carregando"
          />
          <span class="font-medium">Carregando…</span>
        </div>
      </div>
    </transition>

    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Agendar Serviço</h1>

      <div class="calendar-container">
        <vc-calendar
            v-model="selectedDate"
            :initial-page="initialPage"
            is-expanded
            color="blue"
            locale="pt-BR"
            :min-date="todayStart"
            :disabled-dates="disabledDates"
            :attributes="calendarAttrs"
            @dayclick="onDayClick"
        >
          <template #day-popover="{ day }">
            <div v-if="day?.date && day.date.getDay() === 0">
              <div class="font-semibold">Sem atendimento</div>
              <div class="text-xs text-gray-500">Domingos estão indisponíveis</div>
            </div>
            <div v-else>
              <div class="text-sm">{{ formatFull(day.date) }}</div>
            </div>
          </template>
        </vc-calendar>

        <!-- Horário & Serviço -->
        <div class="mt-4 flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
          <!-- Horário -->
          <div class="md:w-1/2">
            <label class="block text-sm font-medium mb-1">Horário</label>
            <select
                v-model="selectedTime"
                class="border rounded w-full px-2 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                :disabled="isTimeSelectDisabled"
                required
            >
              <option disabled value="">Selecione o horário</option>
              <option
  v-for="hour in allTimes"
  :key="hour"
  :value="hour"
  :disabled="isTimeUnavailable(hour)"
>
  {{ hour }}{{ isTimeUnavailable(hour) ? ' (Indisponível)' : '' }}
</option>

            </select>
          </div>

          <!-- Serviços (até 3) -->
          <div class="md:w-1/2">
            <label class="block text-sm font-medium mb-1">
              Serviços (até {{ maxServicesPerBooking }})
            </label>
            <div class="border rounded w-full px-3 py-2 text-sm bg-white max-h-40 overflow-y-auto">
              <div
                  v-if="!servicos.length"
                  class="text-xs text-gray-500"
              >
                Nenhum serviço disponível.
              </div>

              <div
                  v-for="s in servicos"
                  :key="s.id"
                  class="flex items-center gap-2 py-1"
              >
                <input
                    type="checkbox"
                    :id="`svc-${s.id}`"
                    :value="s.id"
                    v-model="selectedServices"
                    :disabled="loading || !hasSelectedDate || (selectedServices.length >= maxServicesPerBooking && !selectedServices.includes(s.id))"
                    class="cursor-pointer"
                />
                <label
                    :for="`svc-${s.id}`"
                    class="cursor-pointer select-none"
                >
                  {{ s.label }}
                  <span v-if="s.preco && s.preco > 0" class="text-xs text-gray-500">
                    — R$ {{ Number(s.preco).toFixed(2) }}
                  </span>
                </label>
              </div>

              <p class="mt-1 text-xs text-gray-500">
                Se escolher 2 ou 3 serviços, o sistema bloqueia 2 horas de agenda a partir do horário escolhido.
              </p>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <h2 class="text-lg font-semibold mb-2">Data e Horário Selecionados</h2>
          <p>
            <span v-if="formattedDate">{{ formattedDate }}</span>
            <span v-if="selectedTime"> às {{ selectedTime }}</span>
            <span v-if="selectedServices.length">
              — {{ selectedServices.length }} serviço(s) selecionado(s)
            </span>
          </p>
        </div>

        <button
            @click="scheduleEvent"
            :disabled="loading"
            class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <span
              v-if="loading"
              class="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"
          />
          <span>{{ loading ? 'Aguarde…' : 'Agendar' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { toastError, toastWarning, toastSuccess } from '@/plugins/alerts'

const API_URL = process.env.VUE_APP_API_URL

export default {
  name: 'UserSchedule',

  data () {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return {
      loading: false,
      today: now,
      todayStart,

      baseCalendarAttrs: [
        { key: 'all-days-pop', dates: { start: new Date(2000,0,1), end: new Date(2100,0,1) }, popover: { visibility: 'hover' } },
        { key: 'sunday-pop',  dates: { weekdays: [0] }, popover: { visibility: 'hover' } }
      ],

      selectedDate: null,
      selectedTime: '',
      selectedServices: [],

      servicos: [],
      bookedTimes: [],
      allTimes: this.generateTimeSlots('07:00', '18:00', 30),

      // almoço fixo
      lunchBlockedTimes: ['12:00', '12:30', '13:00'],

      // regra de negócios
      maxServicesPerBooking: 3,
      slotMinutes: 30
    }
  },

  computed: {
    initialPage () {
      return { month: this.today.getMonth() + 1, year: this.today.getFullYear() }
    },
    formattedDate () {
      if (!this.selectedDate) return null
      const d = new Date(this.selectedDate)
      const dd = String(d.getDate()).padStart(2,'0')
      const mm = String(d.getMonth()+1).padStart(2,'0')
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    },
    // Passado é bloqueado por min-date; aqui desabilitamos apenas domingos
    disabledDates () {
      return [{ weekdays: [0] }]
    },
    calendarAttrs () {
      return [...this.baseCalendarAttrs]
    },

    isTimeSelectDisabled(){
      return this.loading || !this.selectedDate
    },

    hasSelectedDate() {
      return  !!this.selectedDate
    }
  },

  async mounted () {
    await this.runWithLoading(Promise.all([
      this.fetchServicos(),
      this.fetchBookedTimes()
    ]))
  },

  methods: {
    async runWithLoading (promise) {
      this.loading = true
      try { return await promise }
      finally { this.loading = false }
    },

    async fetchServicos () {
      const token = localStorage.getItem('auth_token')
      try {
        const res = await fetch(`${API_URL}/agendar-corte/servicos`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const raw = await res.json()
        const lista = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw?.servicos) ? raw.servicos : (Array.isArray(raw?.data) ? raw.data : []))

        this.servicos = lista.map(s => ({
          id: Number(s.id),
          label: s.servico ?? s.nome ?? s.name ?? 'Serviço',
          preco: Number(s.preco ?? 0)
        }))
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.debug('[fetchServicos] erro:', e?.message || e)
        toastError('Não foi possível carregar os serviços.')
        this.servicos = []
      }
    },

    formatFull (date) {
      return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    },

    generateTimeSlots (start, end, interval) {
      const times = []
      let t = new Date(`1970-01-01T${start}:00`)
      const endT = new Date(`1970-01-01T${end}:00`)
      while (t <= endT) {
        const hh = String(t.getHours()).padStart(2,'0')
        const mm = String(t.getMinutes()).padStart(2,'0')
        times.push(`${hh}:${mm}`)
        t.setMinutes(t.getMinutes() + interval)
      }
      return times
    },

    async onDayClick (day) {
      const d = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate())
      if (d < this.todayStart) {
        toastError('Não é possível agendar em datas passadas.')
        return
      }
      if (d.getDay() === 0) {
        toastError('Domingos não estão disponíveis para agendamento.')
        return
      }
      this.selectedDate = day.date
      await this.runWithLoading(this.fetchBookedTimes())
    },

    async fetchBookedTimes () {
      if (!this.selectedDate) return
      this.selectedTime = ''

      const token = localStorage.getItem('auth_token')
      if (!token) {
        toastError('Faça login novamente.')
        return
      }

      const d = new Date(this.selectedDate).toISOString().split('T')[0]
      try {
        const r = await fetch(`${API_URL}/agendar-corte/${d}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await r.json()
        if (r.ok) {
          this.bookedTimes = (json.bookedTimes || []).map(t =>
              typeof t === 'string' && t.length >= 5 ? t.slice(0,5) : String(t)
          )
        } else {
          toastError(json.message || 'Erro ao buscar horários.')
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') console.debug('[fetchBookedTimes] erro:', e?.message || e)
        toastError('Falha ao conectar com o servidor.')
      }
    },

    slotsRequired () {
  if (this.selectedServices.length <= 1) return 1
  if (this.selectedServices.length === 2) return 3
  return 4 // 3 serviços = 4 slots (2h)
},

isTimeUnavailable (hour) {
  const startIndex = this.allTimes.indexOf(hour)
  if (startIndex === -1) return true

  const required = this.slotsRequired()
  let slotsCount = 0

  for (let i = startIndex; i < this.allTimes.length; i++) {
    const slot = this.allTimes[i]

    if (this.lunchBlockedTimes.includes(slot)) continue

    if (this.bookedTimes.includes(slot)) return true

    slotsCount++
    if (slotsCount >= required) return false
  }

  return true
},

    async scheduleEvent () {
      const d0 = new Date(this.selectedDate || 0)
      const onlyDay = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate())
      if (!this.selectedDate || onlyDay < this.todayStart || !this.selectedTime) {
        toastWarning('Selecione uma data futura (ou hoje) e um horário.')
        return
      }

      if (!this.selectedServices.length) {
        toastWarning('Selecione pelo menos um serviço.')
        return
      }

      if (this.selectedServices.length > this.maxServicesPerBooking) {
        toastWarning(`Selecione no máximo ${this.maxServicesPerBooking} serviços.`)
        return
      }

      if (this.lunchBlockedTimes.includes(this.selectedTime)) {
        this.selectedTime = ''
        toastWarning('Horários de almoço não estão disponíveis.')
        return
      }

      const token = localStorage.getItem('auth_token')
      if (!token) {
        toastError('Faça login novamente.')
        return
      }

      const d = new Date(this.selectedDate).toISOString().split('T')[0]

      await this.runWithLoading((async () => {
        try {
          const r = await fetch(`${API_URL}/agendar-corte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              data_agendamento: d,
              hora_agendamento: this.selectedTime,
              servicos: this.selectedServices
            })
          })
          const json = await r.json()

          if (r.ok) {
            await this.fetchBookedTimes()
            this.selectedTime = ''
            this.selectedServices = []
            toastSuccess(json.message || 'Agendamento salvo com sucesso!')
          } else {
            toastError(json.message || 'Erro ao salvar o agendamento.')
          }
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.debug('[scheduleEvent] erro:', e?.message || e)
          toastError('Erro ao conectar com o servidor.')
        }
      })())
    }
  },

  watch: {
    selectedTime (v) {
      if (this.bookedTimes.includes(v) || this.lunchBlockedTimes.includes(v)) {
        this.selectedTime = ''
        toastWarning('Esse horário não está disponível.')
      }
    }
  }
}
</script>

<style scoped>
.container { max-width: 600px; margin: auto; }

/* Pretos para dias habilitados; cinza para desabilitados (passado e domingos) */
:deep(.vc-day:not(.is-disabled) .vc-day-content) { color: #111827; } /* gray-900 */
:deep(.vc-day.is-disabled .vc-day-content) {
  color: #9ca3af !important; /* gray-400 */
  opacity: 1;
}
:deep(.vc-day.is-disabled) { cursor: default; }

/* overlay fade */
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
