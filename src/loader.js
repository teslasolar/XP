/**
 * Loader Module - Downloads and caches v86 binaries
 */
const Loader = {
    TAG: 'Loader',

    SOURCES: {
        'v86.wasm': [
            'https://unpkg.com/v86@latest/build/v86.wasm',
            'https://cdn.jsdelivr.net/npm/v86@latest/build/v86.wasm',
        ],
        'libv86.js': [
            'https://unpkg.com/v86@latest/build/libv86.js',
            'https://cdn.jsdelivr.net/npm/v86@latest/build/libv86.js',
        ],
        'seabios.bin': [
            'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin',
            'https://raw.githubusercontent.com/copy/v86/master/bios/seabios.bin',
        ],
        'vgabios.bin': [
            'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin',
            'https://raw.githubusercontent.com/copy/v86/master/bios/vgabios.bin',
        ],
    },

    REQUIRED: ['v86.wasm', 'seabios.bin', 'vgabios.bin'],  // libv86.js loaded via script tag
    SCRIPT_URL: 'https://unpkg.com/v86@latest/build/libv86.js',
    onProgress: null,

    async download(name) {
        const urls = this.SOURCES[name] || [name];
        for (const url of urls) {
            try {
                Logger.info(this.TAG, `Downloading ${name}`, { url });
                const res = await API.fetch(url, { mode: 'cors' });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const total = parseInt(res.headers.get('content-length') || '0', 10);
                const reader = res.body.getReader();
                const chunks = [];
                let loaded = 0;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    loaded += value.length;
                    if (this.onProgress && total) {
                        this.onProgress(name, Math.round(loaded / total * 100), loaded, total);
                    }
                }

                const data = new Uint8Array(loaded);
                let offset = 0;
                for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }

                Logger.info(this.TAG, `Downloaded ${name}`, { size: loaded });
                return data;
            } catch (err) {
                Logger.warn(this.TAG, `Failed ${url}`, { error: err.message });
            }
        }
        throw new Error(`All sources failed for ${name}`);
    },

    async load(name) {
        let data = await Cache.get(name);
        if (data) {
            Logger.info(this.TAG, `Cache hit: ${name}`);
            return data;
        }
        data = await this.download(name);
        await Cache.set(name, data);
        return data;
    },

    async loadAll() {
        Logger.info(this.TAG, 'Loading all files', { files: this.REQUIRED });
        const files = {};
        for (const name of this.REQUIRED) {
            files[name] = await this.load(name);
        }
        Logger.info(this.TAG, 'All files loaded');
        return files;
    },

    createBlobURLs(files) {
        const urls = {};
        for (const [name, data] of Object.entries(files)) {
            const type = name.endsWith('.js') ? 'application/javascript' : 'application/octet-stream';
            urls[name] = URL.createObjectURL(new Blob([data], { type }));
        }
        return urls;
    },

    async loadScript() {
        return new Promise((resolve, reject) => {
            if (typeof V86 !== 'undefined') {
                Logger.info(this.TAG, 'V86 already loaded');
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = this.SCRIPT_URL;
            script.crossOrigin = 'anonymous';
            script.onload = () => { Logger.info(this.TAG, 'libv86.js loaded from CDN'); resolve(); };
            script.onerror = () => reject(new Error('Failed to load libv86.js'));
            document.head.appendChild(script);
        });
    },

    async checkSources() {
        const urls = Object.values(this.SOURCES).flat();
        return API.checkEndpoints(urls);
    }
};

if (typeof module !== 'undefined') module.exports = Loader;
