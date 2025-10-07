// src/plugins/loader.js
import { createApp, reactive, h } from 'vue'

export default {
    install(app) {
        const state = reactive({ visible: false, text: 'Carregando...' })
        const show = (text) => { state.text = text || 'Carregando...'; state.visible = true }
        const hide = () => { state.visible = false }

        // deixa disponível globalmente
        app.config.globalProperties.$loading = { show, hide, state }
        if (typeof window !== 'undefined') window.$loading = { show, hide, state }

        // injeta CSS leve
        const css = `
    .gl-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.30);z-index:1050}
    .gl-box{background:#fff;padding:16px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);display:flex;align-items:center;gap:.75rem}
    .gl-spinner{width:24px;height:24px;border:4px solid #cbd5e1;border-top-color:transparent;border-radius:50%;animation:glspin 1s linear infinite}
    @keyframes glspin{to{transform:rotate(360deg)}}`
        const style = document.createElement('style')
        style.textContent = css
        document.head.appendChild(style)

        // monta o componente overlay
        const mountEl = document.createElement('div')
        document.body.appendChild(mountEl)

        const Overlay = {
            name: 'GlobalLoaderOverlay',
            setup() {
                return () => state.visible
                    ? h('div', { class: 'gl-overlay' },
                        h('div', { class: 'gl-box' }, [
                            h('div', { class: 'gl-spinner', 'aria-label': 'Carregando' }),
                            h('span', state.text),
                        ])
                    )
                    : null
            }
        }
        createApp(Overlay).mount(mountEl)
    }
}
