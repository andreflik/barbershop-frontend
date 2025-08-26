<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-xl mx-auto bg-white rounded shadow p-6">
      <h2 class="text-2xl font-bold mb-4 text-center">Tabela de Preços</h2>

      <!-- estados -->
      <div v-if="loading" class="text-center text-gray-500 py-6">Carregando...</div>
      <div v-else-if="!servicos.length" class="text-center text-gray-500 py-6">
        Nenhum serviço cadastrado.
      </div>

      <!-- tabela -->
      <table v-else class="w-full text-left border-collapse">
        <thead>
        <tr>
          <th class="border-b pb-2">Serviço</th>
          <th class="border-b pb-2 text-right">Valor</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="s in servicos" :key="s.id" class="border-b">
          <td class="py-2">{{ s.servico }}</td>
          <td class="py-2 text-right">{{ money(s.preco) }}</td>
        </tr>
        </tbody>
      </table>

      <div class="mt-6 text-center">
        <p class="font-semibold text-blue-600">Trabalhamos com pigmentação</p>
        <p class="mt-2 text-sm text-gray-700">
          <strong>Contato:</strong> (71) 9 8689-2583
        </p>
        <p class="text-xs text-gray-500 mt-1">Agradecemos a preferência. Volte sempre!</p>

        <div class="mt-4 flex justify-center">
          <a
              href="https://www.instagram.com/marquinholijs?igsh=MXQyYW8zZWE0dnc3dg=="
              target="_blank"
              class="flex items-center space-x-2 hover:opacity-80 transition"
          >
            <img src="../assets/instagram2.png" alt="Instagram" class="w-11 h-11" />
            <span class="font-medium text-pink-600 hover:text-pink-700">@marquinholijs</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../axios';

export default {
  name: 'UserContact',
  data() {
    return {
      loading: true,
      servicos: [],
    };
  },
  async mounted() {
    await this.fetchServicos();
  },
  methods: {
    async fetchServicos() {
      try {
        const { data } = await api.get('/servicos-publicos');
        this.servicos = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('Erro ao carregar serviços:', e);
        this.servicos = [];
      } finally {
        this.loading = false;
      }
    },
    money(v) {
      const n = Number(v ?? 0);
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    },
  },
};
</script>
