/**
 * Cache Module - IndexedDB storage for binary files
 */
const Cache = {
    DB_NAME: 'v86-cache',
    DB_VERSION: 1,
    STORE: 'files',
    db: null,

    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            req.onerror = () => reject(req.error);
            req.onsuccess = () => { this.db = req.result; resolve(this.db); };
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.STORE)) {
                    db.createObjectStore(this.STORE, { keyPath: 'name' });
                }
            };
        });
    },

    async get(name) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).get(name);
            req.onsuccess = () => resolve(req.result?.data || null);
            req.onerror = () => reject(req.error);
        });
    },

    async set(name, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE, 'readwrite');
            const req = tx.objectStore(this.STORE).put({ name, data, ts: Date.now() });
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async clear() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE, 'readwrite');
            const req = tx.objectStore(this.STORE).clear();
            req.onsuccess = () => { Logger.info('Cache', 'Cleared'); resolve(); };
            req.onerror = () => reject(req.error);
        });
    },

    async list() {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.STORE, 'readonly');
            const req = tx.objectStore(this.STORE).getAllKeys();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
};

if (typeof module !== 'undefined') module.exports = Cache;
