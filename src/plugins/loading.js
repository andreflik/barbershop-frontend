// src/plugins/loading.js
import { reactive, computed, defineComponent, h } from 'vue'

// Estado global (contador p/ lidar com várias requisições simultâneas)
const state = reactive({
    count: 0,
    text: 'Carregando...'
})
const isLoading = computed(() => state.count > 0)

function start(text) {
    state.count++
    if (text) state.text = text
}
function stop() {
    if (state.count > 0) state.count--
}
function setText(text) {
    state.text = text || 'Carregando...'
}

// Export p/ usar fora do Vue (ex.: em interceptors do axios)
export const Loading = { state, isLoading, start, stop, setText }

// Pequeno componente do overlay (o mesmo “look” do AdminAgendamentos)
const Overlay = defineComponent({
    name: 'AppLoadingOverlay',
    setup() {
        return () =>
            isLoading.value
                ? h(
                    'div',
                    {
                        class:
                            'fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center'
                    },
                    [
                        h(
                            'div',
                            { class: 'bg-white p-6 rounded-xl shadow-lg flex items-center gap-3' },
                            [
                                h('div', {
                                    class:
                                        'h-6 w-6 border-4 border-gray-300 border-t-transparent rounded-full animate-spin',
                                    'aria-label': 'Carregando'
                                }),
                                h('span', { class: 'font-medium' }, state.text)
                            ]
                        )
                    ]
                )
                : null
    }
})

export default {
    install(app) {
        // Expor em this.$loading e via provide/inject
        app.config.globalProperties.$loading = Loading
        app.provide('Loading', Loading)

        // Montar o overlay programaticamente no <body>
        const mountPoint = document.createElement('div')
        document.body.appendChild(mountPoint)
        // cria uma app só p/ o overlay
        import('vue').then(({ createApp }) => {
            const overlayApp = createApp(Overlay)
            overlayApp.mount(mountPoint)
        })
    }
}
