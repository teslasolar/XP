/**
 * Emulator Module - v86 VM wrapper with events
 */
const Emulator = {
    TAG: 'VM',
    instance: null,
    config: null,
    listeners: {},

    defaults: {
        memory_size: 256 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        autostart: true,
    },

    async init(blobURLs, opts = {}) {
        if (typeof V86 === 'undefined') throw new Error('V86 not loaded');

        this.config = {
            wasm_path: blobURLs['v86.wasm'],
            bios: { url: blobURLs['seabios.bin'] },
            vga_bios: { url: blobURLs['vgabios.bin'] },
            screen_container: opts.screen_container,
            memory_size: opts.memory_size || this.defaults.memory_size,
            vga_memory_size: opts.vga_memory_size || this.defaults.vga_memory_size,
            autostart: opts.autostart ?? this.defaults.autostart,
            disable_jit: true,  // Required for GitHub Pages CSP (no eval)
        };

        if (opts.hda_url) {
            this.config.hda = { url: opts.hda_url, async: true };
            Logger.info(this.TAG, 'Boot from HDA', { url: opts.hda_url });
        } else if (opts.initial_state) {
            this.config.initial_state = { url: opts.initial_state };
            Logger.info(this.TAG, 'Boot from state', { url: opts.initial_state });
        }

        if (opts.network_relay_url) {
            this.config.network_relay_url = opts.network_relay_url;
        }

        Logger.info(this.TAG, 'Initializing', { memory: this.config.memory_size });
        this.instance = new V86(this.config);
        this._bindEvents();
        return this.instance;
    },

    _bindEvents() {
        const em = this.instance;
        em.add_listener('emulator-ready', () => {
            Logger.info(this.TAG, 'Ready');
            this._emit('ready');
        });
        em.add_listener('emulator-started', () => {
            Logger.info(this.TAG, 'Started');
            this._emit('started');
        });
        em.add_listener('serial0-output-byte', (b) => this._emit('serial', String.fromCharCode(b)));
    },

    on(event, fn) { (this.listeners[event] ||= []).push(fn); },
    off(event, fn) { this.listeners[event] = (this.listeners[event] || []).filter(f => f !== fn); },
    _emit(event, data) { (this.listeners[event] || []).forEach(fn => fn(data)); },

    start()   { this.instance?.run(); Logger.info(this.TAG, 'Start'); },
    stop()    { this.instance?.stop(); Logger.info(this.TAG, 'Stop'); },
    restart() { this.instance?.restart(); Logger.info(this.TAG, 'Restart'); },

    sendSerial(str) { this.instance?.serial0_send(str); },

    sendCtrlAltDel() {
        this.instance?.keyboard_send_scancodes([0x1D, 0x38, 0x53, 0xD3, 0xB8, 0x9D]);
        Logger.info(this.TAG, 'Ctrl+Alt+Del');
    },

    async saveState() {
        return new Promise((resolve, reject) => {
            this.instance?.save_state((err, state) => {
                if (err) { Logger.error(this.TAG, 'Save failed', err); reject(err); }
                else { Logger.info(this.TAG, 'State saved', { size: state.byteLength }); resolve(state); }
            });
        });
    },

    async downloadState() {
        const state = await this.saveState();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([state]));
        a.download = 'state.bin';
        a.click();
    },

    getStatus() {
        return {
            running: !!this.instance?.is_running(),
            memory: this.config?.memory_size,
        };
    }
};

if (typeof module !== 'undefined') module.exports = Emulator;
