/**
 * UI Module - DOM helpers and status display
 */
const UI = {
    TAG: 'UI',
    elements: {},

    init(ids) {
        for (const [key, id] of Object.entries(ids)) {
            this.elements[key] = document.getElementById(id);
        }
        Logger.debug(this.TAG, 'Initialized', { elements: Object.keys(ids) });
    },

    show(key)  { if (this.elements[key]) this.elements[key].style.display = 'block'; },
    hide(key)  { if (this.elements[key]) this.elements[key].style.display = 'none'; },
    text(key, txt) { if (this.elements[key]) this.elements[key].textContent = txt; },

    setProgress(key, pct) {
        const el = this.elements[key];
        if (el) { el.style.width = pct + '%'; el.textContent = pct + '%'; }
    },

    setFileStatus(name, status, detail = '') {
        const el = document.querySelector(`[data-file="${name}"]`);
        if (!el) return;
        el.className = 'file-item ' + status;
        const statusEl = el.querySelector('.status');
        if (statusEl) statusEl.textContent = detail || status;
    },

    bindButtons(handlers) {
        for (const [id, fn] of Object.entries(handlers)) {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        }
    },

    enableButtons(ids, enabled = true) {
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) el.disabled = !enabled;
        }
    },

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    appendSerial(char) {
        const el = this.elements.serialOutput;
        if (el) { el.textContent += char; el.scrollTop = el.scrollHeight; }
    },

    toast(msg, type = 'info', duration = 3000) {
        Logger.info(this.TAG, msg, { type });
        // Could add visual toast notification here
    }
};

if (typeof module !== 'undefined') module.exports = UI;
