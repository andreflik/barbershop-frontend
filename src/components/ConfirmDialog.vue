<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        @keydown.esc="$emit('cancel')"
      >
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
          <p class="text-sm text-gray-600 mb-6">
            {{ message }}
          </p>

          <div class="flex gap-3 justify-end">
            <button
              class="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800"
              @click="$emit('cancel')"
            >
              Cancelar
            </button>
            <button
              class="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
              @click="$emit('confirm')"
              :disabled="loading"
            >
              <span v-if="!loading">Excluir</span>
              <span v-else>Excluindo…</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: 'Confirmar exclusão' },
    message: { type: String, default: 'Tem certeza que deseja excluir este registro?' },
    loading: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
