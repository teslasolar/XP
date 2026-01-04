/**
 * Logger Module - Centralized logging with levels and formatting
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

    export: () => JSON.stringify(Logger.history, null, 2),
    setLevel: (lvl) => { Logger.level = Logger.LEVELS[lvl] ?? 1; }
};

if (typeof module !== 'undefined') module.exports = Logger;
