/**
 * API Module - HTTP client with self-test
 */
const API = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,

    async fetch(url, opts = {}) {
        const { retries = this.retries, retryDelay = this.retryDelay } = opts;
        let lastErr;
        for (let i = 0; i <= retries; i++) {
            try {
                if (i > 0) Logger.info('API', `Retry ${i}/${retries}`, { url });
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), opts.timeout || this.timeout);
                const res = await fetch(url, { ...opts, signal: ctrl.signal });
                clearTimeout(timer);
                Logger.debug('API', 'Response', { url, status: res.status });
                return res;
            } catch (err) {
                lastErr = err;
                Logger.warn('API', 'Failed', { url, err: err.message });
                if (i < retries) await this.sleep(retryDelay * Math.pow(2, i));
            }
        }
        throw lastErr;
    },

    async checkStatus(url) {
        const start = Date.now();
        try {
            const res = await this.fetch(url, { method: 'HEAD', retries: 0, timeout: 5000 });
            return { url, ok: res.ok, status: res.status, ms: Date.now() - start };
        } catch (err) {
            return { url, ok: false, status: 0, ms: Date.now() - start, error: err.message };
        }
    },

    async checkEndpoints(urls) {
        const results = await Promise.all(urls.map(u => this.checkStatus(u)));
        return results;
    },

    sleep: (ms) => new Promise(r => setTimeout(r, ms)),

    // Self-test
    async test() {
        const r = { pass: 0, fail: 0, tests: [] };
        const t = async (name, fn) => {
            try { await fn(); r.pass++; r.tests.push({ name, ok: true }); }
            catch (e) { r.fail++; r.tests.push({ name, ok: false, err: e.message }); }
        };

        await t('checkStatus returns object', async () => {
            const res = await this.checkStatus('https://httpstat.us/200');
            if (typeof res.ok !== 'boolean') throw new Error('bad response');
        });

        await t('checkStatus handles 404', async () => {
            const res = await this.checkStatus('https://httpstat.us/404');
            if (res.ok !== false) throw new Error('should be not ok');
        });

        console.log('[API.test]', r.pass + '/' + (r.pass + r.fail), 'passed');
        return r;
    }
};

if (typeof module !== 'undefined') module.exports = API;
