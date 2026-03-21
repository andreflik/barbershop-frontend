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
            @update:page="onMonthChange"
        >
          <template #day-popover="{ day }">
            <!-- Domingo -->
            <div v-if="day?.date && day.date.getDay() === 0">
              <div class="font-semibold">Sem atendimento</div>
              <div class="text-xs text-gray-500">Domingos estão indisponíveis</div>
            </div>

            <!-- Dia bloqueado -->
            <div v-else-if="isDayBlocked && sameDay(day.date, selectedDate)">
              <div class="font-semibold text-red-600">Dia bloqueado</div>
              <div class="text-xs text-gray-600">{{ blockedReason }}</div>
            </div>

            <!-- Normal -->
            <div v-else>
              <div class="text-sm">{{ formatFull(day.date) }}</div>
            </div>
          </template>

        </vc-calendar>

        <!-- Aviso de dia bloqueado -->
          <div
            v-if="isDayBlocked"
            class="mt-4 bg-red-50 border border-red-300 text-red-700 rounded-lg p-4 flex items-start gap-2"
          >
            <svg class="w-5 h-5 mt-0.5 text-red-500" fill="none" stroke="currentColor" stroke-width="2"
                viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>

            <div>
              <p class="font-semibold">Sem atendimento neste dia</p>
              <p class="text-sm">{{ blockedReason }}</p>
            </div>
          </div>


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
            :disabled="loading || isDayBlocked"
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
      isDayBlocked: false,
      blockedReason: null,
      blockedDays: [],
      blockedTimes: [],

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
    disabledDates () {
      return [{ weekdays: [0] }]
    },

    calendarAttrs () {
      const blockedAttrs = this.blockedDays.map(b => ({
        key: `blocked-${b.date}`,
        dates: new Date(b.date + 'T00:00:00'),
        highlight: {
          backgroundColor: '#fee2e2',
          borderRadius: '6px',
        },
        popover: {
          label: `Sem atendimento: ${b.reason}`,
        },
      }))

      return [
        ...this.baseCalendarAttrs,
        ...blockedAttrs,
      ]
    },

    isTimeSelectDisabled () {
      return this.loading || !this.selectedDate || this.isDayBlocked
    },

    hasSelectedDate() {
      return  !!this.selectedDate
    }
  },

  async mounted () {
    const y = this.today.getFullYear()
    const m = this.today.getMonth() + 1
  
    await this.runWithLoading(Promise.all([
      this.fetchServicos(),
      this.fetchBookedTimes(),
      this.fetchBlockedDays(y, m)
    ]))
  },

  methods: {
    async runWithLoading (promise) {
      this.loading = true
      try { return await promise }
      finally { this.loading = false }
    },

    async fetchServicos () {
      const token = sessionStorage.getItem('auth_token')
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

        const iso = d.toISOString().split('T')[0]
        const blocked = this.blockedDays.find(b => b.date === iso)

        // 🚫 Dia bloqueado pelo admin
        if (blocked) {
          this.selectedDate = d
          this.isDayBlocked = true
          this.blockedReason = blocked.reason

          toastWarning(`Sem atendimento: ${blocked.reason}`)
          return
        }

        // ✅ Dia normal
        this.isDayBlocked = false
        this.blockedReason = null
        this.selectedDate = d

        await this.runWithLoading(this.fetchBookedTimes())
    },

   async fetchBookedTimes () {
  this.isDayBlocked = false
  this.blockedReason = null
  this.bookedTimes = []

  if (!this.selectedDate) return
  this.selectedTime = ''

  const token = sessionStorage.getItem('auth_token')
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

    if (!r.ok) {
      toastError(json.message || 'Erro ao buscar horários.')
      return
    }

    // 🚫 Dia inteiro bloqueado
    if (json.fullDay === true) {
      this.isDayBlocked = true
      this.blockedReason = json.reason || 'Dia indisponível'
      toastWarning(`Sem agendamento: ${this.blockedReason}`)
      return
    }

    // 🧩 Junta horários ocupados + horários bloqueados
    const booked = Array.isArray(json.bookedTimes) ? json.bookedTimes : []
    const blocked = Array.isArray(json.blockedTimes) ? json.blockedTimes : []

    const merged = [...booked, ...blocked]

    // Normaliza para HH:MM
    this.bookedTimes = merged.map(t =>
      typeof t === 'string' ? t.slice(0, 5) : String(t).slice(0, 5)
    )

  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[fetchBookedTimes] erro:', e?.message || e)
    }
    toastError('Falha ao conectar com o servidor.')
  }
},


      async fetchBlockedDays (year, month) {
        const token = sessionStorage.getItem('auth_token')
        if (!token) return

        const ym = `${year}-${String(month).padStart(2, '0')}`

        try {
          const r = await fetch(`${API_URL}/agendar-corte/bloqueios?month=${ym}`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const json = await r.json()

          this.blockedDays = (json.blockedDays || []).map(b => ({
            date: new Date(b.date).toISOString().split('T')[0],
            reason: b.reason || 'Dia indisponível'
          }))

        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[fetchBlockedDays] erro:', e?.message || e)
          }
        }
      },

      async onMonthChange ({ year, month }) {
        await this.fetchBlockedDays(year, month)
      },

      slotsRequired () {
    if (this.selectedServices.length <= 1) return 1
    if (this.selectedServices.length === 2) return 3
    return 4
  },

 isTimeUnavailable (hour) {
  // Se o dia inteiro está bloqueado, nada é disponível
  if (this.isDayBlocked) return true

  const startIndex = this.allTimes.indexOf(hour)
  if (startIndex === -1) return true

  const required = this.slotsRequired()
  let slotsCount = 0

  for (let i = startIndex; i < this.allTimes.length; i++) {
    const slot = this.allTimes[i]

    // Almoço
    if (this.lunchBlockedTimes.includes(slot)) return true

    // Já ocupado ou bloqueado pelo admin
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

      const token = sessionStorage.getItem('auth_token')
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
    },

    sameDay (d1, d2) {
        if (!d1 || !d2) return false
        return (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        )
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
