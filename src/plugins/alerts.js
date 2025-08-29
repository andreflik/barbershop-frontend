// src/plugins/alerts.js

// garante um container para fallback toasts
function ensureToastContainer () {
    let c = document.getElementById('toast-fallback-container')
    if (!c) {
        c = document.createElement('div')
        c.id = 'toast-fallback-container'
        c.style.position = 'fixed'
        c.style.top = '12px'
        c.style.right = '12px'
        c.style.zIndex = '2147483647'
        c.style.display = 'flex'
        c.style.flexDirection = 'column'
        c.style.gap = '8px'
        document.body.appendChild(c)
    }
    return c
}

function iconEmoji (icon) {
    switch (icon) {
        case 'success': return '✅'
        case 'error':   return '❌'
        case 'warning': return '⚠️'
        case 'info':    return 'ℹ️'
        default:        return '🔔'
    }
}

// toast fallback simples (sem SweetAlert2)
function showFallbackToast ({ icon = 'info', title = '', text = '' } = {}) {
    const container = ensureToastContainer()
    const el = document.createElement('div')
    el.style.background = '#1f2937'     // gray-800
    el.style.color = 'white'
    el.style.padding = '10px 12px'
    el.style.borderRadius = '10px'
    el.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'
    el.style.fontSize = '14px'
    el.style.maxWidth = '360px'
    el.style.pointerEvents = 'auto'
    el.style.opacity = '0'
    el.style.transform = 'translateY(-6px)'
    el.style.transition = 'opacity .15s ease, transform .15s ease'

    const strong = document.createElement('strong')
    strong.textContent = `${iconEmoji(icon)} ${title || ''}`.trim()
    strong.style.display = 'block'
    strong.style.marginBottom = text ? '2px' : '0'
    const p = document.createElement('div')
    p.textContent = text || ''
    p.style.opacity = '.9'

    el.appendChild(strong)
    if (text) el.appendChild(p)

    container.appendChild(el)
    requestAnimationFrame(() => {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
    })

    // auto-close
    const t = setTimeout(() => {
        el.style.opacity = '0'
        el.style.transform = 'translateY(-6px)'
        setTimeout(() => el.remove(), 180)
    }, 2800)

    // clique para fechar
    el.addEventListener('click', () => {
        clearTimeout(t)
        el.style.opacity = '0'
        el.style.transform = 'translateY(-6px)'
        setTimeout(() => el.remove(), 120)
    })
}

function hasSwal () {
    return !!(window.Swal && typeof window.Swal.fire === 'function')
}

function baseToast ({ icon = 'info', title = '', text = '' } = {}) {
    if (hasSwal()) {
        return window.Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2800,
            timerProgressBar: true,
            icon,
            title,
            text
        })
    }
    // fallback visual se SweetAlert2 não estiver disponível
    showFallbackToast({ icon, title, text })
    return Promise.resolve()
}

export const toastSuccess = (text, title = 'Sucesso') =>
    baseToast({ icon: 'success', title, text })

export const toastWarning = (text, title = 'Atenção') =>
    baseToast({ icon: 'warning', title, text })

export const toastError = (text, title = 'Erro') =>
    baseToast({ icon: 'error', title, text })

export const toastInfo = (text, title = 'Info') =>
    baseToast({ icon: 'info', title, text })

export default {
    install(app) {
        // this.$swal -> SweetAlert2 se presente; senão, usa fallback toast
        app.config.globalProperties.$swal = (...args) => {
            if (hasSwal()) return window.Swal.fire(...args)
            // se pedirem um modal e não houver Swal, mostramos um toast simples
            const [arg] = args
            const cfg = typeof arg === 'object' ? arg : { title: String(arg || '') }
            showFallbackToast({ icon: cfg.icon || 'info', title: cfg.title || '', text: cfg.text || '' })
            return Promise.resolve()
        }
        app.config.globalProperties.$toast = baseToast
    }
}
