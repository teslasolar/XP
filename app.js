/**
 * App - Main application controller
 */
const App = {
    TAG: 'App',
    blobURLs: null,
    filesLoaded: 0,

    async init() {
        Logger.info(this.TAG, 'Initializing');
        Logger.setLevel('DEBUG');

        UI.init({
            loader: 'loader',
            emulator: 'emulator',
            loaderStatus: 'loader-status',
            loaderError: 'loader-error',
            totalProgress: 'total-progress',
            status: 'status',
            serialOutput: 'serial-output',
            serialInput: 'serial-input',
            screenContainer: 'screen-container',
        });

        this.bindEvents();
        await this.loadEngine();
    },

    bindEvents() {
        UI.bindButtons({
            'btn-retry': () => this.loadEngine(),
            'btn-clear-cache': () => this.clearAndReload(),
            'btn-start': () => this.startVM(),
            'btn-stop': () => Emulator.stop(),
            'btn-restart': () => Emulator.restart(),
            'btn-fullscreen': () => this.toggleFullscreen(),
            'btn-save-state': () => Emulator.downloadState(),
            'btn-ctrlaltdel': () => Emulator.sendCtrlAltDel(),
        });

        document.getElementById('serial-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                Emulator.sendSerial(e.target.value + '\n');
                e.target.value = '';
            }
        });
    },

    async loadEngine() {
        this.filesLoaded = 0;
        UI.text('loaderStatus', 'Initializing...');
        UI.hide('loaderError');
        document.getElementById('btn-retry').style.display = 'none';
        document.getElementById('btn-clear-cache').style.display = 'none';

        Loader.REQUIRED.forEach(f => UI.setFileStatus(f, 'pending', 'pending'));

        Loader.onProgress = (name, pct, loaded, total) => {
            UI.setFileStatus(name, 'loading', `${pct}% (${UI.formatBytes(loaded)})`);
        };

        try {
            const files = {};
            for (const name of Loader.REQUIRED) {
                UI.setFileStatus(name, 'loading', 'loading...');
                files[name] = await Loader.load(name);
                UI.setFileStatus(name, 'done', 'ready');
                this.filesLoaded++;
                UI.setProgress('total-progress', Math.round(this.filesLoaded / Loader.REQUIRED.length * 100));
            }

            UI.text('loaderStatus', 'Loading v86 library...');
            await Loader.loadScript();

            this.blobURLs = Loader.createBlobURLs(files);
            UI.text('loaderStatus', 'Ready!');
            Logger.info(this.TAG, 'Engine loaded');

            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                if (VM_CONFIG.autostart) {
                    this.startVM();
                } else {
                    document.getElementById('emulator').style.display = 'block';
                }
            }, 500);

        } catch (err) {
            Logger.error(this.TAG, 'Load failed', { error: err.message });
            UI.text('loaderStatus', 'Failed');
            document.getElementById('loader-error').textContent = err.message;
            document.getElementById('loader-error').style.display = 'block';
            document.getElementById('btn-retry').style.display = 'inline-block';
            document.getElementById('btn-clear-cache').style.display = 'inline-block';
        }
    },

    async clearAndReload() {
        await Cache.clear();
        this.loadEngine();
    },

    async startVM() {
        // Ensure emulator container is visible before v86 creates canvas
        const emulatorEl = document.getElementById('emulator');
        const screenEl = document.getElementById('screen-container');

        if (!screenEl) {
            Logger.error(this.TAG, 'screen-container not found');
            UI.text('status', 'Status: Error - screen container not found');
            return;
        }

        emulatorEl.style.display = 'block';

        // Wait for DOM to update
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        UI.text('status', 'Status: Initializing...');
        try {
            await Emulator.init(this.blobURLs, {
                screen_container: screenEl,
                hda_url: VM_CONFIG.hda_url,
                initial_state: VM_CONFIG.initial_state,
                memory_size: VM_CONFIG.memory_size,
                vga_memory_size: VM_CONFIG.vga_memory_size,
                network_relay_url: VM_CONFIG.network_relay_url,
            });

            Emulator.on('ready', () => {
                UI.text('status', 'Status: Booting...');
                UI.enableButtons(['btn-stop', 'btn-restart', 'btn-save-state', 'btn-ctrlaltdel'], true);
                document.getElementById('serial-input').disabled = false;
            });

            Emulator.on('started', () => UI.text('status', 'Status: Running'));
            Emulator.on('serial', (char) => UI.appendSerial(char));

            UI.enableButtons(['btn-start'], false);

        } catch (err) {
            Logger.error(this.TAG, 'VM start failed', { error: err.message });
            UI.text('status', 'Status: Error - ' + err.message);
        }
    },

    toggleFullscreen() {
        const el = document.getElementById('screen-container');
        if (document.fullscreenElement) document.exitFullscreen();
        else el?.requestFullscreen();
    },
};

// Start app
document.addEventListener('DOMContentLoaded', () => App.init());
