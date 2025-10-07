<template>
  <main
    class="flex flex-col items-center justify-center min-h-screen text-gray-900 select-none bg-gradient-to-br from-[#f1efec] to-[#e7e5e2] font-['Outfit']"
  >
    <!-- CONTAINER PRINCIPAL -->
    <div
      class="flex flex-col items-center justify-center bg-[#fbfaf8] rounded-[32px] shadow-[0_8px_25px_rgba(0,0,0,0.15)] px-16 py-20 text-center"
    >
      <!-- LOGO -->
      <img
        src="/logo-barber.png"
        alt="Marquinhos Barbershop"
        class="w-[20rem] h-auto mb-10 drop-shadow-lg"
      />

      <!-- TÍTULO -->
      <h1 class="text-3xl font-bold text-[#0e1a22] mb-4 tracking-wide">
        Bem-vindo ao BarberApp!
      </h1>
      <p class="text-gray-600 mb-10 max-w-md">
        O melhor corte começa com um bom agendamento. Faça login e garanta seu horário!
      </p>

      <!-- BOTÃO -->
      <router-link
        to="/login"
        class="bg-white hover:bg-[#c06a28] hover:text-white text-gray-900 font-semibold px-10 py-4 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
      >
        <svg
          class="w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
        >
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.4 6.1 28.9 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.4 15 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.4 6.1 28.9 4 24 4c-7.8 0-14.4 4.4-17.7 10.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.2 0 9.8-2 13.1-5.2l-6.1-5.2c-2.1 1.8-4.9 2.9-7.9 2.9-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.1 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.1 5.2c3.6-3.3 6-8.1 6-13.9 0-1.3-.1-2.7-.4-3.9z"
          />
        </svg>
        <span>Entrar com Google</span>
      </router-link>
    </div>
  </main>
</template>

<script>
export default {
  name: 'HomeView',
};
</script>

<style scoped>
/* Transição suave no hover da logo */
img {
  transition: transform 0.4s ease;
}

img:hover {
  transform: scale(1.02);
}
</style>
