/**
 * API Module - HTTP client with status checking and retries
 */
const API = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,

    async fetch(url, opts = {}) {
        const tag = 'API';
        const { retries = this.retries, retryDelay = this.retryDelay } = opts;
        let lastErr;

        for (let i = 0; i <= retries; i++) {
            try {
                if (i > 0) Logger.info(tag, `Retry ${i}/${retries}`, { url });

                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), opts.timeout || this.timeout);

                const res = await fetch(url, { ...opts, signal: ctrl.signal });
                clearTimeout(timer);

                Logger.debug(tag, 'Response', { url, status: res.status });
                return res;
            } catch (err) {
                lastErr = err;
                Logger.warn(tag, 'Fetch failed', { url, err: err.message, attempt: i + 1 });
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
        Logger.info('API', 'Checking endpoints', { count: urls.length });
        const results = await Promise.all(urls.map(u => this.checkStatus(u)));
        const ok = results.filter(r => r.ok).length;
        Logger.info('API', 'Check complete', { ok, total: results.length });
        return results;
    },

    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
};

if (typeof module !== 'undefined') module.exports = API;
