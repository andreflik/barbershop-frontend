// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/api'
import './index.css'
import Alerts from '@/plugins/alerts'
import VCalendar from 'v-calendar'
import 'v-calendar/style.css'
import api from '@/services/api'

// Carrega SweetAlert2 por CDN (garante window.Swal real)
function loadSwalFromCDN () {
    if (window.Swal && typeof window.Swal.fire === 'function') return Promise.resolve(window.Swal)

    return new Promise((resolve) => {
        // CSS
        const css = document.createElement('link')
        css.rel = 'stylesheet'
        css.href = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css'
        css.onload = () => {}
        document.head.appendChild(css)

        // JS
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js'
        script.async = true
        script.onload = () => resolve(window.Swal)
        script.onerror = () => resolve(null)
        document.head.appendChild(script)
    })
}

const token = sessionStorage.getItem('auth_token')

if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Inicia o app normalmente; o plugin lida com fallback enquanto o CDN carrega
loadSwalFromCDN()

const app = createApp(App)
app.use(Alerts)                             // $swal / $toast
app.use(router)
app.use(VCalendar, { componentPrefix: 'vc' })
app.mount('#app')
