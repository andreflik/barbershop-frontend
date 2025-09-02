<!-- src/views/Admin.vue -->
<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <!-- ÚNICO menu do admin -->
    <AdminNav />
    <!-- páginas filhas (Agendamentos, Serviços, etc.) -->
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script>
import AdminNav from '@/components/AdminNav.vue'
export default {
  name: 'AdminLayout',
  components: { AdminNav },
}
</script>
