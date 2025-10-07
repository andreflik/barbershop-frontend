// src/services/appConfig.js
let cached = null

export function getApiUrlSync() {
    // 1) Tenta Vite
    let fromVite = ''
    try {
        // eslint-disable-next-line no-undef
        fromVite =
            (import.meta &&
                import.meta.env &&
                (import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL)) ||
            ''
    } catch (e) {
        fromVite = ''
    }

    // 2) Tenta Vue CLI / Node
    const fromCli =
        (typeof process !== 'undefined' &&
            process?.env &&
            (process.env.VUE_APP_API_URL || process.env.API_URL)) ||
        ''

    const url = (fromVite || fromCli || '').trim()
    return url ? url.replace(/\/+$/, '') : ''
}

export async function loadAppConfig() {
    if (cached) return cached

    const envUrl = getApiUrlSync()
    if (envUrl) {
        cached = { API_URL: envUrl }
        return cached
    }

    // 3) Fallback: /public/config.json
    try {
        const res = await fetch('/config.json', { cache: 'no-store' })
        if (res.ok) {
            const json = await res.json()
            const url = String(json?.API_URL || '').trim().replace(/\/+$/, '')
            cached = { API_URL: url }
            return cached
        }
    } catch (_) {
        // ignore
    }

    cached = { API_URL: '' }
    return cached
}
