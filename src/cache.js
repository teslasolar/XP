/**
 * Cache Module - IndexedDB storage with self-test
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
            req.onsuccess = () => resolve();
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
    },

    // Self-test
    async test() {
        const r = { pass: 0, fail: 0, tests: [] };
        const t = async (name, fn) => {
            try { await fn(); r.pass++; r.tests.push({ name, ok: true }); }
            catch (e) { r.fail++; r.tests.push({ name, ok: false, err: e.message }); }
        };

        await t('init opens db', async () => {
            await this.init();
            if (!this.db) throw new Error('no db');
        });

        await t('set/get works', async () => {
            await this.set('_test', new Uint8Array([1, 2, 3]));
            const data = await this.get('_test');
            if (!data || data.length !== 3) throw new Error('bad data');
        });

        await t('list includes test', async () => {
            const keys = await this.list();
            if (!keys.includes('_test')) throw new Error('not listed');
        });

        await t('clear works', async () => {
            await this.clear();
            const data = await this.get('_test');
            if (data) throw new Error('not cleared');
        });

        console.log('[Cache.test]', r.pass + '/' + (r.pass + r.fail), 'passed');
        return r;
    }
};

if (typeof module !== 'undefined') module.exports = Cache;
