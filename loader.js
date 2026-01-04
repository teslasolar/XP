/**
 * v86 Auto-Downloader
 * Downloads and caches v86 binaries in IndexedDB
 */
const V86Loader = {
    DB_NAME: 'v86-cache',
    DB_VERSION: 1,
    STORE_NAME: 'files',

    // CDN sources for v86 files
    SOURCES: {
        'v86.wasm': 'https://copy.sh/v86/build/v86.wasm',
        'libv86.js': 'https://copy.sh/v86/build/libv86.js',
        'seabios.bin': 'https://copy.sh/v86/bios/seabios.bin',
        'vgabios.bin': 'https://copy.sh/v86/bios/vgabios.bin',
    },

    // Required files for VM to run
    REQUIRED: ['v86.wasm', 'libv86.js', 'seabios.bin', 'vgabios.bin'],

    db: null,
    onProgress: null,
    onStatus: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'name' });
                }
            };
        });
    },

    async getFile(name) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE_NAME, 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result?.data || null);
            request.onerror = () => reject(request.error);
        });
    },

    async saveFile(name, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.put({ name, data, timestamp: Date.now() });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async downloadFile(name, url) {
        this.setStatus(`Downloading ${name}...`);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download ${name}: ${response.status}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;

            if (total > 0) {
                const pct = Math.round((loaded / total) * 100);
                this.setProgress(name, pct, loaded, total);
            }
        }

        const data = new Uint8Array(loaded);
        let offset = 0;
        for (const chunk of chunks) {
            data.set(chunk, offset);
            offset += chunk.length;
        }

        return data;
    },

    setStatus(msg) {
        if (this.onStatus) this.onStatus(msg);
        console.log('[Loader]', msg);
    },

    setProgress(file, pct, loaded, total) {
        if (this.onProgress) this.onProgress(file, pct, loaded, total);
    },

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    async loadAll() {
        await this.init();
        const files = {};

        for (const name of this.REQUIRED) {
            // Check cache first
            let data = await this.getFile(name);

            if (data) {
                this.setStatus(`${name} loaded from cache`);
            } else {
                // Download and cache
                const url = this.SOURCES[name];
                if (!url) throw new Error(`No source URL for ${name}`);

                data = await this.downloadFile(name, url);
                await this.saveFile(name, data);
                this.setStatus(`${name} downloaded and cached`);
            }

            files[name] = data;
        }

        return files;
    },

    // Create blob URLs for v86 config
    createBlobURLs(files) {
        const urls = {};
        for (const [name, data] of Object.entries(files)) {
            const type = name.endsWith('.js') ? 'application/javascript' : 'application/octet-stream';
            urls[name] = URL.createObjectURL(new Blob([data], { type }));
        }
        return urls;
    },

    // Inject libv86.js into page
    async injectLibrary(data) {
        return new Promise((resolve, reject) => {
            const blob = new Blob([data], { type: 'application/javascript' });
            const script = document.createElement('script');
            script.src = URL.createObjectURL(blob);
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    async clearCache() {
        const tx = this.db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        await store.clear();
        this.setStatus('Cache cleared');
    }
};
