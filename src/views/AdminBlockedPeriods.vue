<template>
  <div class="max-w-4xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Bloqueio de Datas e Horários</h1>

    <!-- FORM -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <h2 class="font-semibold mb-3">Novo bloqueio</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="date"
          v-model="form.date"
          class="input"
        />

        <input
          type="text"
          v-model="form.reason"
          class="input md:col-span-2"
          placeholder="Motivo"
        />
      </div>

      <!-- GRID DE HORÁRIOS -->
      <div class="mt-4">
        <p class="text-sm font-semibold mb-2">Horários (opcional)</p>

        <div class="grid grid-cols-4 sm:grid-cols-6 gap-2">
          <label
            v-for="time in allTimes"
            :key="time"
            class="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer text-sm hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :value="time"
              v-model="form.times"
            />
            {{ time }}
          </label>
        </div>

        <p class="mt-2 text-xs text-gray-600">
          💡 Se nenhum horário for selecionado, o <strong>dia inteiro será bloqueado</strong>
        </p>
      </div>

      <button
        @click="create"
        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        :disabled="loading"
      >
        Bloquear
      </button>
    </div>

    <!-- LISTA -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="font-semibold mb-3">Bloqueios cadastrados</h2>

      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 text-left">Data</th>
            <th class="p-2 text-left">Horário</th>
            <th class="p-2 text-left">Motivo</th>
            <th class="p-2 text-center">Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-b"
          >
            <td class="p-2">
              {{ formatDate(item.date) }}
            </td>

            <td class="p-2">
              <span v-if="item.is_full_day" class="italic text-gray-500">
                Dia inteiro
              </span>
              <span v-else>
                {{ item.time }}
              </span>
            </td>

            <td class="p-2">
              {{ item.reason }}
            </td>

            <td class="p-2 text-center">
             <button
              @click="remove(item.id)"
              class="text-red-600 hover:text-red-800 transition"
              title="Excluir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m2 0V5a2 2 0 012-2h2a2 2 0 012 2v2" />
              </svg>
            </button>
            </td>
          </tr>

          <tr v-if="!items.length">
            <td colspan="4" class="p-4 text-center text-gray-500">
              Nenhum bloqueio cadastrado
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


<script>
import api from '@/services/api'

export default {
  name: 'AdminBlockedPeriods',

  data () {
    return {
      loading: false,
      items: [],
      allTimes: [],
      form: {
        date: '',
        times: [],
        reason: ''
      }
    }
  },

  mounted () {
    this.allTimes = this.generateTimes()
    this.fetch()
  },

  methods: {
    generateTimes (start = '07:00', end = '18:00', interval = 30) {
      const times = []
      let t = new Date(`1970-01-01T${start}:00`)
      const endT = new Date(`1970-01-01T${end}:00`)

      while (t <= endT) {
        times.push(t.toTimeString().slice(0, 5))
        t.setMinutes(t.getMinutes() + interval)
      }

      return times
    },

    async fetch () {
      this.loading = true
      try {
        const { data } = await api.get('/admin/blocked-periods')
        this.items = data.data || []
      } finally {
        this.loading = false
      }
    },

    async create () {
      if (!this.form.date || !this.form.reason) {
        alert('Informe a data e o motivo.')
        return
      }

      this.loading = true
      try {
        await api.post('/admin/blocked-periods', this.form)
        this.form = { date: '', times: [], reason: '' }
        await this.fetch()
      } catch (e) {
        alert(e?.response?.data?.message || 'Erro ao bloquear')
      } finally {
        this.loading = false
      }
    },

    async remove (id) {
      if (!confirm('Deseja remover este bloqueio?')) return

      this.loading = true
      try {
        await api.delete(`/admin/blocked-periods/${id}`)
        await this.fetch()
      } finally {
        this.loading = false
      }
    },

    formatDate (date) {
      return new Date(date).toLocaleDateString('pt-BR')
    }
  }
}
</script>


<style scoped>
.input {
  @apply border rounded px-3 py-2 text-sm w-full;
}
</style>
