import axios from 'axios'
import router from '@/router/api'
import { toastError, toastWarning } from '@/plugins/alerts'

const baseURL = (process.env.VUE_APP_API_URL || '').replace(/\/+$/, '')

const api = axios.create({
    baseURL,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
    timeout: 15000,
    withCredentials: false,              //  se migrar para cookie Sanctum, troque para true
    validateStatus: (s) => s >= 200 && s < 300,
})

// —— Request: injeta Bearer se existir ——
api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('auth_token')
        if (token) config.headers.Authorization = `Bearer ${token}`
    } catch (e) { void e }
    return config
})

// util para rejeitar mantendo status
const rejectAs = (status, message = 'Falha na requisição') =>
    Promise.reject(Object.assign(new Error(message), { status }))

let authNotified = false // evita spam de toasts 401 em sequência

// —— Response: trata todos os cenários principais ——
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        // cancelamentos não devem mostrar toast
        if (axios.isCancel(err)) return rejectAs(0, 'Requisição cancelada')

        const status = err?.response?.status
        const url    = String(err?.config?.url || '')
        const data   = err?.response?.data

        // Sem resposta (timeout, CORS, servidor offline)
        if (!status) {
            const offline = typeof navigator !== 'undefined' && navigator && navigator.onLine === false
            toastError(offline ? 'Sem conexão com a Internet.' : 'Não foi possível conectar ao servidor.')
            return rejectAs(0, offline ? 'Offline' : 'Falha de rede')
        }

        // 401 / 419 — sessão inválida/expirada
        if (status === 401 || status === 419) {
            try {
                localStorage.removeItem('auth_token')
                localStorage.removeItem('user_role')
            } catch (e) { void e }

            if (!authNotified) {
                authNotified = true
                toastWarning('Sessão expirada. Faça login novamente.')
                setTimeout(() => { authNotified = false }, 3000)
            }

            if (router?.currentRoute?.value?.path !== '/') {
                router.push('/').catch(() => {})
            }
            return rejectAs(401, 'Não autenticado.')
        }

        // 403 — sem permissão
        if (status === 403) {
            const msg = data?.message || 'Você não tem permissão para executar esta ação.'
            toastWarning(msg)

            const isAdminEndpoint = url.includes('/admin/')
            const onAdminView     = router?.currentRoute?.value?.path?.startsWith('/admin')
            if (isAdminEndpoint && onAdminView) {
                router.push('/dashboard').catch(() => {})
            }
            return rejectAs(403, msg)
        }

        // 404 — não encontrado
        if (status === 404) {
            toastWarning('Recurso não encontrado.')
            return rejectAs(404, 'Recurso não encontrado.')
        }

        // 422 — validação (mostra primeira mensagem)
        if (status === 422) {
            let msg = 'Dados inválidos.'
            try {
                const first = data?.errors && typeof data.errors === 'object'
                    ? Object.values(data.errors)[0]
                    : null
                if (Array.isArray(first) && first[0]) msg = first[0]
                else if (typeof first === 'string')   msg = first
            } catch (e) { void e }
            toastWarning(msg)
            return rejectAs(422, msg)
        }

        // 429 — rate limit
        if (status === 429) {
            const retryAfter = err?.response?.headers?.['retry-after']
            toastError(retryAfter
                ? `Muitas requisições. Tente novamente em ${retryAfter}s.`
                : 'Muitas requisições. Tente novamente em breve.')
            return rejectAs(429, 'Muitas requisições.')
        }

        // 5xx — servidor
        if (status >= 500) {
            toastError('Falha no servidor. Tente novamente mais tarde.')
            return rejectAs(status, 'Erro no servidor.')
        }

        // Fallback genérico
        return rejectAs(status, data?.message || 'Falha na requisição')
    }
)

export default api
