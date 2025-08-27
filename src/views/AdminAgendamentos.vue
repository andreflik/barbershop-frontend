<template>
  <div class="p-6 space-y-4">
    <h2 class="text-2xl font-bold">Agendamentos</h2>

    <!-- Filtros -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
      <div>
        <label class="text-sm text-gray-600">Busca</label>
        <input v-model="q" placeholder="Usuário ou serviço" class="border p-2 rounded w-full" />
      </div>

      <div>
        <label class="text-sm text-gray-600">Serviço</label>
        <select v-model="servicoId" class="border p-2 rounded w-full">
          <option value="">Todos</option>
          <option v-for="s in servicosOpts" :key="s.id" :value="s.id">{{ s.servico }}</option>
        </select>
      </div>

      <div>
        <label class="text-sm text-gray-600">Cliente</label>
        <select v-model="usuarioId" class="border p-2 rounded w-full">
          <option value="">Todos</option>
          <option v-for="u in usuariosOpts" :key="u.id" :value="u.id">{{ u.name }}</option>
        </select>
      </div>

      <div>
        <label class="text-sm text-gray-600">Mês/Ano</label>
        <flat-pickr
            v-model="mesAnoDate"
            :config="fpConfig"
            placeholder="Selecione o mês"
            class="border p-2 rounded w-full"
        />
      </div>

      <div class="flex gap-2">
        <button
            @click="filtrar"
            :disabled="loading"
            class="px-4 py-2 rounded w-full text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span v-if="loading" class="inline-flex items-center gap-2">
            <span class="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>
            Filtrando...
          </span>
          <span v-else>Filtrar</span>
        </button>
        <button
            @click="limpar"
            :disabled="loading"
            class="border px-4 py-2 rounded w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Limpar
        </button>
      </div>
    </div>

    <!-- Ações -->
    <div class="flex items-center gap-2">
      <!-- XLSX -->
      <button
          @click="exportarXlsx"
          :disabled="exporting || loading || !(itens && itens.data && itens.data.length)"
          :aria-busy="exporting && exportingType==='xlsx'"
          title="Exportar XLSX"
          class="p-2 border rounded hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <template v-if="exporting && exportingType==='xlsx'">
          <span class="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full inline-block animate-spin"></span>
        </template>
        <template v-else>
          <img :src="icons.excel" alt="Exportar XLSX"
               class="w-7 h-7 md:w-8 md:h-8 object-contain select-none" draggable="false" />
        </template>
        <span class="sr-only">Exportar XLSX</span>
      </button>

      <!-- PDF -->
      <button
          @click="exportarPdf"
          :disabled="exporting || loading || !(itens && itens.data && itens.data.length)"
          :aria-busy="exporting && exportingType==='pdf'"
          title="Exportar PDF"
          class="p-2 border rounded hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <template v-if="exporting && exportingType==='pdf'">
          <span class="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full inline-block animate-spin"></span>
        </template>
        <template v-else>
          <img :src="icons.pdf" alt="Exportar PDF"
               class="w-7 h-7 md:w-8 md:h-8 object-contain select-none" draggable="false" />
        </template>
        <span class="sr-only">Exportar PDF</span>
      </button>
    </div>

    <!-- Tabela -->
    <table class="w-full table-auto">
      <thead class="bg-gray-200">
      <tr>
        <th class="px-4 py-2 text-left">Usuário</th>
        <th class="px-4 py-2 text-left">Data</th>
        <th class="px-4 py-2 text-left">Hora</th>
        <th class="px-4 py-2 text-left">Serviço</th>
        <th class="px-4 py-2"></th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="a in itens.data"
          :key="a && a.id ? a.id : `${a.data_agendamento}-${a.hora_agendamento}`"
          class="border-b"
      >
        <td class="px-4 py-2">{{ usuarioNome(a) }}</td>
        <td class="px-4 py-2">{{ a && a.data_agendamento ? formatDate(a.data_agendamento) : '-' }}</td>
        <td class="px-4 py-2">{{ a && a.hora_agendamento ? a.hora_agendamento : '-' }}</td>
        <td class="px-4 py-2">{{ servicoNome(a) }}</td>
        <td class="px-4 py-2 text-right">
          <button @click="cancelar(a.id)" class="px-3 py-1 bg-red-600 text-white rounded">Cancelar</button>
        </td>
      </tr>
      <tr v-if="!(itens && itens.data && itens.data.length)">
        <td colspan="5" class="text-center text-gray-500 py-4">Sem dados</td>
      </tr>
      </tbody>
    </table>

    <!-- Paginação -->
    <div v-if="itens && (itens.last_page || 1) > 1" class="flex items-center gap-2">
      <button :disabled="!itens.prev_page_url || loading" @click="goto(itens.current_page - 1)" class="px-3 py-1 border rounded disabled:opacity-60">
        Anterior
      </button>
      <span>Página {{ itens.current_page || 1 }} de {{ itens.last_page || 1 }}</span>
      <button :disabled="!itens.next_page_url || loading" @click="goto(itens.current_page + 1)" class="px-3 py-1 border rounded disabled:opacity-60">
        Próxima
      </button>
    </div>

    <!-- Overlay de carregamento -->
    <transition name="fade">
      <div v-if="loading" class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
          <div class="h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin" aria-label="Carregando"></div>
          <span class="font-medium">Carregando...</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import api from '@/services/api';
import excelIcon from '@/assets/excel.png';
import pdfIcon from '@/assets/pdf.png';

import FlatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/themes/material_blue.css';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect/index.js';
import 'flatpickr/dist/plugins/monthSelect/style.css';
import { Portuguese } from 'flatpickr/dist/l10n/pt.js';

export default {
  name: 'AdminAgendamentos',
  components: { FlatPickr },
  data() {
    return {
      q: '',
      servicoId: '',
      usuarioId: '',
      mesAno: '',
      mesAnoDate: null,
      page: 1,
      itens: { data: [], current_page: 1, last_page: 1 },
      servicosOpts: [],
      usuariosOpts: [],
      loading: false,
      exporting: false,
      exportingType: '',
      icons: { excel: excelIcon, pdf: pdfIcon },
      fpConfig: {
        locale: Portuguese,
        altInput: true,
        allowInput: true,
        plugins: [new monthSelectPlugin({ shorthand: true, dateFormat: 'Y-m', altFormat: 'F Y' })],
        static: true
      }
    };
  },
  watch: {
    mesAnoDate(newVal) {
      const d = Array.isArray(newVal) ? newVal[0] : newVal;
      if (d instanceof Date && !isNaN(d)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        this.mesAno = `${yyyy}-${mm}`;
      } else {
        this.mesAno = '';
      }
    }
  },
  mounted() {
    this.bootstrap();
    if (this.mesAno) {
      const [y, m] = this.mesAno.split('-');
      this.mesAnoDate = new Date(Number(y), Number(m) - 1, 1);
    }
  },
  methods: {
    async bootstrap() {
      await Promise.all([this.fetchServicos(), this.fetchUsuarios()]);
      await this.fetchItens();
    },
    async fetchServicos() {
      const res = await api.get('/admin/servicos/options');
      this.servicosOpts = Array.isArray(res.data) ? res.data : [];
    },
    async fetchUsuarios() {
      const res = await api.get('/admin/usuarios/options');
      this.usuariosOpts = Array.isArray(res.data) ? res.data : [];
    },
    paramsComFiltros() {
      const params = { q: this.q, page: this.page };
      if (this.servicoId) params.servico_id = this.servicoId;
      if (this.usuarioId) params.usuario_id = this.usuarioId;
      if (this.mesAno) {
        const [ano, mes] = this.mesAno.split('-');
        if (ano && mes) { params.ano = ano; params.mes = mes; }
      }
      return params;
    },
    async fetchItens() {
      this.loading = true;
      try {
        const res = await api.get('/admin/agendamentos', { params: this.paramsComFiltros() });
        this.itens = res.data || { data: [], current_page: 1, last_page: 1 };
      } catch (_) {
        this.itens = { data: [], current_page: 1, last_page: 1 };
      } finally {
        this.loading = false;
      }
    },
    filtrar() {
      this.page = 1;
      this.fetchItens();
    },
    goto(p) {
      if (!p || p < 1 || (this.itens.last_page && p > this.itens.last_page)) return;
      this.page = p;
      this.fetchItens();
    },
    async cancelar(id) {
      this.loading = true;
      try {
        await api.delete(`/admin/agendamentos/${id}`);
        await this.fetchItens();
      } finally {
        this.loading = false;
      }
    },
    usuarioNome(a) {
      if (!a) return '-';
      const u = a.usuario;
      if (u && typeof u === 'object' && u.name) return u.name;
      if (typeof u === 'string' && u) return u;
      return '-';
    },
    servicoNome(a) {
      if (!a) return '-';
      const s = a.servico;
      if (!s) return '-';
      if (typeof s === 'object') {
        return s.nome ?? s.servico ?? s.name ?? '-';
      }
      if (typeof s === 'string') return s || '-';
      return '-';
    },
    formatDate(dataString) {
      if (!dataString) return '-';
      const d = new Date(dataString);
      if (isNaN(d.getTime())) return dataString;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    },
    limpar() {
      this.q = '';
      this.servicoId = '';
      this.usuarioId = '';
      this.mesAno = '';
      this.mesAnoDate = null;
      this.page = 1;
      this.fetchItens();
    },
    async exportarXlsx() {
      this.exporting = true; this.exportingType = 'xlsx';
      try {
        const res = await api.get('/admin/agendamentos/export/xlsx', {
          params: this.paramsComFiltros(),
          responseType: 'blob'
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url; a.download = this.buildExportFileName('xlsx'); a.click();
        URL.revokeObjectURL(url);
      } finally {
        this.exporting = false; this.exportingType = '';
      }
    },
    async exportarPdf() {
      this.exporting = true; this.exportingType = 'pdf';
      try {
        const res = await api.get('/admin/agendamentos/export/pdf', {
          params: this.paramsComFiltros(),
          responseType: 'blob'
        });
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url; a.download = this.buildExportFileName('pdf'); a.click();
        URL.revokeObjectURL(url);
      } finally {
        this.exporting = false; this.exportingType = '';
      }
    },
    buildExportFileName(ext) {
      const parts = ['agendamentos'];
      if (this.mesAno) parts.push(this.mesAno);
      if (this.servicoId) parts.push(`serv-${this.servicoId}`);
      if (this.usuarioId) parts.push(`cli-${this.usuarioId}`);
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`;
      return `${parts.join('_')}_${stamp}.${ext}`;
    },
  },
};
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
</style>
