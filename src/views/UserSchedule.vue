<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Agendar Serviço</h1>

    <div class="calendar-container">
      <vc-calendar
          v-model="selectedDate"
          :initial-page="initialPage"
          is-expanded
          color="blue"
          locale="pt-BR"
          :disabled-dates="[{ weekdays: [0] }]"
          :attributes="calendarAttrs"
          @dayclick="onDayClick"
      >
        <!-- Popover do dia -->
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

      <!-- Linha com horário e serviço -->
      <div class="mt-4 flex space-x-4">
        <!-- Horário -->
        <div class="w-1/2">
          <label class="block text-sm font-medium mb-1">Horário</label>
          <select v-model="selectedTime" class="border rounded w-full px-2 py-1 text-sm" required>
            <option disabled value="">Selecione o horário</option>
            <option
                v-for="hour in allTimes"
                :key="hour"
                :value="hour"
                :disabled="bookedTimes.includes(hour)"
            >
              {{ hour }}{{ bookedTimes.includes(hour) ? ' (Indisponível)' : '' }}
            </option>
          </select>
        </div>

        <!-- Serviço -->
        <div class="w-1/2">
          <label class="block text-sm font-medium mb-1">Serviço</label>
          <select
              v-model.number="selectedService"
              class="border rounded w-full px-2 py-1 text-sm"
              required
          >
            <option disabled :value="null">Selecione o serviço</option>
            <option v-for="s in servicos" :key="s.id" :value="s.id">
              {{ s.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Escolhas -->
      <div class="mt-4">
        <h2 class="text-lg font-semibold mb-2">Data e Horário Selecionados</h2>
        <p>
          <span v-if="formattedDate">{{ formattedDate }}</span>
          <span v-if="selectedTime"> às {{ selectedTime }}</span>
        </p>
      </div>

      <!-- Ação -->
      <button
          @click="scheduleEvent"
          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
      >
        Agendar
      </button>
    </div>
  </div>
</template>

<script>
function notify (opts = {}) {
  const hasSwal =
      typeof window !== 'undefined' &&
      window.Swal &&
      typeof window.Swal.fire === 'function'
  if (hasSwal) return window.Swal.fire(opts)
  const title = opts.title || ''
  const text  = opts.text  || ''
  const msg   = [title, text].filter(Boolean).join('\n')
  if (opts.icon === 'error') console.error('❌', title, text)
  else if (opts.icon === 'warning') console.warn('⚠️', title, text)
  else console.log('ℹ️', title, text)
  if (typeof window !== 'undefined' && window.alert) window.alert(msg || 'Ação executada.')
}

const API_URL = process.env.VUE_APP_API_URL

export default {
  name: 'UserSchedule',

  data () {
    const today = new Date()
    return {
      today,
      selectedDate: new Date(),
      selectedTime: '',
      selectedService: null,
      servicos: [],
      bookedTimes: [],
      availableTimes: [],
      allTimes: this.generateTimeSlots('07:00', '18:00', 30),

      calendarAttrs: [
        {
          key: 'all-days-pop',
          dates: { start: new Date(2000, 0, 1), end: new Date(2100, 0, 1) },
          popover: { visibility: 'hover' }
        },
        {
          key: 'sunday-pop',
          dates: { weekdays: [0] },
          popover: { visibility: 'hover' }
        }
      ]
    }
  },

  computed: {
    initialPage () {
      return {
        month: this.today.getMonth() + 1,
        year: this.today.getFullYear()
      }
    },

    formattedDate () {
      if (!this.selectedDate) return null
      const d = new Date(this.selectedDate)
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    }
  },

  mounted () {
    this.fetchServicos()
    this.fetchBookedTimes()
  },

  methods: {
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
      } catch (err) {
        console.error('Erro ao buscar serviços:', err)
        notify({ icon: 'error', title: 'Erro', text: 'Não foi possível carregar os serviços.' })
        this.servicos = []
      }
    },

    formatFull (date) {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    },

    generateTimeSlots (start, end, interval) {
      const times = []
      let t = new Date(`1970-01-01T${start}:00`)
      const endT = new Date(`1970-01-01T${end}:00`)
      while (t <= endT) {
        const hh = String(t.getHours()).padStart(2, '0')
        const mm = String(t.getMinutes()).padStart(2, '0')
        times.push(`${hh}:${mm}`)
        t.setMinutes(t.getMinutes() + interval)
      }
      return times
    },

    async onDayClick (day) {
      if (day.date.getDay() === 0) {
        notify({
          icon: 'error',
          title: 'Domingo Indisponível',
          text: 'Domingos não estão disponíveis para agendamento.'
        })
        return
      }
      this.selectedDate = day.date
      await this.fetchBookedTimes()
    },

    async fetchBookedTimes () {
      if (!this.selectedDate) return
      this.selectedTime = ''

      const token = localStorage.getItem('auth_token')
      if (!token) {
        notify({ icon: 'error', title: 'Erro de Autenticação', text: 'Faça login novamente.' })
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
              typeof t === 'string' && t.length >= 5 ? t.slice(0, 5) : String(t)
          )
        } else {
          notify({ icon: 'error', title: 'Erro', text: json.message || 'Erro ao buscar horários.' })
        }
      } catch (e) {
        console.error('Erro ao buscar horários agendados:', e)
        notify({ icon: 'error', title: 'Erro', text: 'Falha ao conectar com o servidor.' })
      }
    },

    async scheduleEvent () {
      if (!this.selectedDate || !this.selectedTime || this.selectedService == null) {
        notify({ icon: 'warning', title: 'Dados Incompletos', text: 'Selecione data, horário e serviço.' })
        return
      }

      const token = localStorage.getItem('auth_token')
      if (!token) {
        notify({ icon: 'error', title: 'Erro de Autenticação', text: 'Faça login novamente.' })
        return
      }

      const d = new Date(this.selectedDate).toISOString().split('T')[0]
      try {
        const r = await fetch(`${API_URL}/agendar-corte`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            data_agendamento: d,
            hora_agendamento: this.selectedTime,
            servico_id: this.selectedService
          })
        })
        const json = await r.json()

        if (r.ok) {
          await this.fetchBookedTimes()
          this.selectedTime = ''
          notify({ icon: 'success', title: 'Sucesso', text: json.message || 'Agendamento salvo com sucesso!' })
        } else {
          if (r.status === 422 && json.errors) {
            const first = Object.values(json.errors)[0]
            const msg = Array.isArray(first) ? first[0] : (first || 'Dados inválidos.')
            notify({ icon: 'error', title: 'Erro de Validação', text: msg })
          } else {
            notify({ icon: 'error', title: 'Erro', text: json.message || 'Erro ao salvar o agendamento.' })
          }
        }
      } catch (e) {
        console.error('Erro ao salvar agendamento:', e)
        notify({ icon: 'error', title: 'Erro', text: 'Erro ao conectar com o servidor.' })
      }
    }
  },

  watch: {
    selectedTime (v) {
      if (this.bookedTimes.includes(v)) {
        this.selectedTime = ''
        notify({
          icon: 'warning',
          title: 'Horário Indisponível',
          text: 'Esse horário já está agendado. Escolha outro.'
        })
      }
    }
  }
}
</script>

<style scoped>
.container { max-width: 600px; margin: auto; }

:deep(.vc-day:not(.is-disabled) .vc-day-content) {
  color: #111827; /* tailwind gray-900 */
}

:deep(.vc-day.is-disabled .vc-day-content) {
  color: #9ca3af !important;
  opacity: 1;
}

:deep(.vc-day.is-disabled) {
  cursor: default;
}

:deep(.vc-highlight) {
  background: transparent !important;
}
</style>

