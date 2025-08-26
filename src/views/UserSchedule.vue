<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Agendar Serviço</h1>
    <div class="calendar-container">
      <!-- Calendário para seleção de data -->
      <vc-calendar
          v-model="selectedDate"
          is-expanded
          color="blue"
          locale="pt-BR"
          @dayclick="onDayClick"
          :attributes="calendarAttributes"
      ></vc-calendar>

      <!-- Linha com horário e serviço lado a lado -->
      <div class="mt-4 flex space-x-4">
        <!-- Select de horário -->
        <div class="w-1/2">
          <label class="block text-sm font-medium mb-1">Horário</label>
          <select
              v-model="selectedTime"
              class="border rounded w-full px-2 py-1 text-sm"
              required
          >
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

        <!-- Select de serviço -->
        <div class="w-1/2">
          <label class="block text-sm font-medium mb-1">Serviço</label>
          <select
              v-model="selectedService"
              class="border rounded w-full px-2 py-1 text-sm"
              required
          >
            <option disabled value="">Selecione o serviço</option>
            <option v-for="servico in servicos" :key="servico.id" :value="servico.id">
              {{ servico.servico }}
            </option>
          </select>
        </div>
      </div>

      <!-- Mostra data e horário selecionados -->
      <div class="mt-4">
        <h2 class="text-lg font-semibold mb-2">Data e Horário Selecionados</h2>
        <p>
          <span v-if="formattedDate">{{ formattedDate }}</span>
          <span v-if="selectedTime"> às {{ selectedTime }}</span>
        </p>
      </div>

      <!-- Botão de ação -->
      <button
          @click="scheduleEvent"
          class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
      >
        Agendar Evento
      </button>
    </div>
  </div>
</template>

<script>
function notify(opts = {}) {
  const hasSwal =
      typeof window !== 'undefined' &&
      window.Swal &&
      typeof window.Swal.fire === 'function';

  if (hasSwal) return window.Swal.fire(opts);

  // Fallback simples
  const title = opts.title || '';
  const text = opts.text || '';
  const msg = [title, text].filter(Boolean).join('\n');
  if (opts.icon === 'error') console.error('❌', title, text);
  else if (opts.icon === 'warning') console.warn('⚠️', title, text);
  else console.log('ℹ️', title, text);
  if (typeof window !== 'undefined' && window.alert) {
    window.alert(msg || 'Ação executada.');
  }
}

const API_URL = process.env.VUE_APP_API_URL;

export default {
  name: 'UserSchedule',
  data() {
    return {
      selectedDate: null,
      selectedTime: '',
      selectedService: '',
      servicos: [],
      bookedTimes: [],      // sempre no formato HH:mm
      availableTimes: [],
      allTimes: this.generateTimeSlots('07:00', '18:00', 30),
      calendarAttributes: [
        {
          key: 'disable-sundays',
          dates: { weekdays: [0] },
          popover: { label: 'Domingos estão indisponíveis' },
          customData: { disabled: true },
        },
      ],
    };
  },
  computed: {
    formattedDate() {
      if (this.selectedDate) {
        const date = new Date(this.selectedDate);
        return `${String(date.getDate()).padStart(2, '0')}/${String(
            date.getMonth() + 1
        ).padStart(2, '0')}/${date.getFullYear()}`;
      }
      return null;
    },
  },
  mounted() {
    this.fetchServicos();
  },
  methods: {
    async fetchServicos() {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await fetch(`${API_URL}/agendar-corte/servicos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        this.servicos = data.servicos || [];
      } catch (error) {
        console.error('Erro ao buscar serviços:', error);
        notify({ icon: 'error', title: 'Erro', text: 'Não foi possível carregar os serviços.' });
      }
    },

    generateTimeSlots(start, end, interval) {
      const times = [];
      let currentTime = new Date(`1970-01-01T${start}:00`);
      const endTime = new Date(`1970-01-01T${end}:00`);
      while (currentTime <= endTime) {
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        times.push(`${hours}:${minutes}`);
        currentTime.setMinutes(currentTime.getMinutes() + interval);
      }
      return times;
    },

    validateSelectedTime() {
      if (this.bookedTimes.includes(this.selectedTime)) {
        notify({
          icon: 'warning',
          title: 'Horário Indisponível',
          text: 'Este horário já está agendado. Por favor, escolha outro.',
        });
        this.selectedTime = '';
      }
    },

    async onDayClick(day) {
      if (day.date.getDay() === 0) {
        notify({
          icon: 'error',
          title: 'Domingo Indisponível',
          text: 'Domingos não estão disponíveis para agendamento.',
        });
        return;
      }
      this.selectedDate = day.date;
      await this.fetchBookedTimes();
    },

    async fetchBookedTimes() {
      if (!this.selectedDate) return;

      this.selectedTime = '';
      const token = localStorage.getItem('auth_token');
      if (!token) {
        notify({
          icon: 'error',
          title: 'Erro de Autenticação',
          text: 'Usuário não autenticado. Por favor, faça login novamente.',
        });
        return;
      }

      const formattedDate = new Date(this.selectedDate).toISOString().split('T')[0];

      try {
        const response = await fetch(`${API_URL}/agendar-corte/${formattedDate}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          // normaliza para HH:mm
          this.bookedTimes = (data.bookedTimes || []).map(t =>
              typeof t === 'string' && t.length >= 5 ? t.slice(0, 5) : String(t)
          );
        } else {
          notify({ icon: 'error', title: 'Erro', text: data.message || 'Erro ao buscar horários.' });
        }
      } catch (error) {
        console.error('Erro ao buscar horários agendados:', error);
        notify({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao conectar com o servidor. Tente novamente mais tarde.',
        });
      }
    },

    async scheduleEvent() {
      if (!this.selectedDate || !this.selectedTime || !this.selectedService) {
        notify({
          icon: 'warning',
          title: 'Dados Incompletos',
          text: 'Por favor, selecione data, horário e serviço.',
        });
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        notify({
          icon: 'error',
          title: 'Erro de Autenticação',
          text: 'Usuário não autenticado. Por favor, faça login novamente.',
        });
        return;
      }

      const formattedDate = new Date(this.selectedDate).toISOString().split('T')[0];

      try {
        const response = await fetch(`${API_URL}/agendar-corte`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data_agendamento: formattedDate,
            hora_agendamento: this.selectedTime,
            servico_id: this.selectedService,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Recarrega horários ocupados já normalizados
          await this.fetchBookedTimes();
          this.selectedTime = '';

          notify({
            icon: 'success',
            title: 'Sucesso',
            text: data.message || 'Agendamento salvo com sucesso!',
          });
        } else {
          if (response.status === 422 && data.errors) {
            const firstErr = Object.values(data.errors)[0];
            const errorMsg = Array.isArray(firstErr) ? firstErr[0] : firstErr;
            notify({ icon: 'error', title: 'Erro de Validação', text: errorMsg || 'Dados inválidos.' });
          } else {
            notify({ icon: 'error', title: 'Erro', text: data.message || 'Erro ao salvar o agendamento.' });
          }
        }
      } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        notify({ icon: 'error', title: 'Erro', text: 'Erro ao conectar com o servidor.' });
      }
    },
  },
  watch: {
    selectedTime(newVal) {
      if (this.bookedTimes.includes(newVal)) {
        this.selectedTime = '';
        notify({
          icon: 'warning',
          title: 'Horário Indisponível',
          text: 'Esse horário já está agendado. Por favor, selecione outro.',
        });
      }
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: auto;
}
</style>
