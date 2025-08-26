<template>
  <div class="p-6 space-y-6">
    <h2 class="text-2xl font-bold">Serviços</h2>

    <div class="flex items-center gap-2">
      <input v-model="q" placeholder="Buscar..." class="border p-2 rounded" />
      <button @click="fetchServicos" class="bg-blue-600 text-white px-4 py-2 rounded">Buscar</button>
      <button @click="abrirNovo" class="bg-green-600 text-white px-4 py-2 rounded">Novo</button>
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
      <tr v-for="s in servicos.data" :key="s.id" class="border-b">
        <td class="px-4 py-2">{{ s.codigo }}</td>
        <td class="px-4 py-2">{{ s.servico }}</td>
        <td class="px-4 py-2">{{ formatMoney(s.preco) }}</td>
        <td class="px-4 py-2 text-right space-x-2">
          <button @click="editar(s)" class="px-3 py-1 bg-yellow-500 text-white rounded">Editar</button>
          <button @click="remover(s.id)" class="px-3 py-1 bg-red-600 text-white rounded">Excluir</button>
        </td>
      </tr>
      </tbody>
    </table>

    <div v-if="servicos && (servicos.last_page || 1) > 1" class="flex items-center gap-2">
      <button
          :disabled="!servicos.prev_page_url"
          @click="goto(servicos.current_page - 1)"
          class="px-3 py-1 border rounded"
      >
        Anterior
      </button>
      <span>Página {{ servicos.current_page || 1 }} de {{ servicos.last_page || 1 }}</span>
      <button
          :disabled="!servicos.next_page_url"
          @click="goto(servicos.current_page + 1)"
          class="px-3 py-1 border rounded"
      >
        Próxima
      </button>
    </div>

    <!-- Modal -->
    <div v-if="modal" class="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div class="bg-white p-6 rounded-xl space-y-4 w-full max-w-md">
        <h3 class="text-xl font-semibold">{{ form.id ? 'Editar' : 'Novo' }} Serviço</h3>

        <label class="block text-sm font-medium">Código *</label>
        <input v-model="form.codigo" placeholder="Ex.: CMQ" class="border p-2 w-full rounded" required />

        <label class="block text-sm font-medium mt-2">Nome do serviço *</label>
        <input v-model="form.servico" placeholder="Ex.: Corte de Máquina" class="border p-2 w-full rounded" required />

        <label class="block text-sm font-medium mt-2">Preço (R$) *</label>
        <input
            v-model.number="form.preco"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 30.00"
            class="border p-2 w-full rounded"
            required
        />

        <div class="flex justify-end gap-2 pt-2">
          <button @click="salvar" class="bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
          <button @click="fechar" class="border px-4 py-2 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../axios';

export default {
  name: 'AdminServicos',
  data() {
    return {
      q: '',
      servicos: {
        data: [],
        current_page: 1,
        last_page: 1,
        prev_page_url: null,
        next_page_url: null,
      },
      page: 1,
      modal: false,
      form: { id: null, codigo: '', servico: '', preco: 0 },
    };
  },
  mounted() {
    this.fetchServicos();
  },
  methods: {
    async fetchServicos() {
      const res = await api.get('/admin/servicos', { params: { q: this.q, page: this.page } });
      this.servicos = res.data;
    },
    goto(p) {
      if (!p || p < 1 || (this.servicos.last_page && p > this.servicos.last_page)) return;
      this.page = p;
      this.fetchServicos();
    },
    abrirNovo() {
      this.form = { id: null, codigo: '', servico: '', preco: 0 };
      this.modal = true;
    },
    editar(s) {
      this.form = {
        id: s.id,
        codigo: s.codigo || '',
        servico: s.servico || '',
        preco: Number(s.preco ?? 0),
      };
      this.modal = true;
    },
    fechar() {
      this.modal = false;
    },
    async salvar() {
      const payload = {
        codigo: (this.form.codigo || '').trim(),
        servico: (this.form.servico || '').trim(),
        preco: Number(this.form.preco ?? 0),
      };

      if (!payload.codigo || !payload.servico) {
        alert('Preencha Código e Serviço.');
        return;
      }

      if (this.form.id) {
        await api.put(`/admin/servicos/${this.form.id}`, payload);
      } else {
        await api.post('/admin/servicos', payload);
      }
      this.modal = false;
      this.fetchServicos();
    },
    async remover(id) {
      if (!confirm('Excluir este serviço?')) return;
      await api.delete(`/admin/servicos/${id}`);
      this.fetchServicos();
    },
    formatMoney(v) {
      const n = Number(v ?? 0);
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    },
  },
};
</script>
