import {noop} from "chart.js/helpers";

const EmptySwal = {
    fire(opts = {}) {
        try {
            const title = opts?.title || ''
            const text  = opts?.text || ''
            const msg = [title, text].filter(Boolean).join('\n') || 'Ação executada.'
            if (typeof window !== 'undefined' && window.alert) {
                window.alert(msg)
            }
        } catch (e) { noop(e)}
        return Promise.resolve({ isConfirmed: true })
    }
}

export default EmptySwal