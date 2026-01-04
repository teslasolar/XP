/**
 * Logger Module - Centralized logging with self-test
 */
const Logger = {
    LEVELS: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
    level: 1,
    history: [],
    maxHistory: 500,
    onLog: null,

    _log(lvl, tag, msg, data) {
        if (this.LEVELS[lvl] < this.level) return;
        const entry = { ts: Date.now(), lvl, tag, msg, data };
        this.history.push(entry);
        if (this.history.length > this.maxHistory) this.history.shift();
        const time = new Date(entry.ts).toISOString().substr(11, 12);
        const prefix = `[${time}][${lvl}][${tag}]`;
        const fn = lvl === 'ERROR' ? console.error : lvl === 'WARN' ? console.warn : console.log;
        fn(prefix, msg, data ?? '');
        if (this.onLog) this.onLog(entry);
        return entry;
    },

    debug: (tag, msg, data) => Logger._log('DEBUG', tag, msg, data),
    info:  (tag, msg, data) => Logger._log('INFO', tag, msg, data),
    warn:  (tag, msg, data) => Logger._log('WARN', tag, msg, data),
    error: (tag, msg, data) => Logger._log('ERROR', tag, msg, data),

    getHistory: (filter) => filter
        ? Logger.history.filter(e => e.tag === filter || e.lvl === filter)
        : [...Logger.history],

    clear() { this.history = []; },
    export: () => JSON.stringify(Logger.history, null, 2),
    setLevel(lvl) { this.level = this.LEVELS[lvl] ?? 1; },

    // Self-test
    test() {
        const r = { pass: 0, fail: 0, tests: [] };
        const t = (name, fn) => {
            try { fn(); r.pass++; r.tests.push({ name, ok: true }); }
            catch (e) { r.fail++; r.tests.push({ name, ok: false, err: e.message }); }
        };
        const orig = this.level;
        this.clear();

        t('log creates entry', () => {
            this.setLevel('DEBUG');
            this.debug('T', 'x');
            if (!this.history.length) throw new Error('empty');
        });

        t('level filters', () => {
            this.clear();
            this.setLevel('ERROR');
            this.info('T', 'x');
            if (this.history.length) throw new Error('not filtered');
        });

        t('export JSON', () => { JSON.parse(this.export()); });

        this.level = orig;
        this.clear();
        console.log('[Logger.test]', r.pass + '/' + (r.pass + r.fail), 'passed');
        return r;
    }
};

if (typeof module !== 'undefined') module.exports = Logger;
