#!/usr/bin/env node
/**
 * v86-xp CLI - Command-line interface for v86 XP VM
 */

const API_BASE = process.env.V86_API || 'http://localhost:8080';

const commands = {
    async status() {
        console.log('Checking v86 CDN endpoints...\n');
        const endpoints = [
            'https://unpkg.com/v86@latest/build/v86.wasm',
            'https://unpkg.com/v86@latest/build/libv86.js',
            'https://cdn.jsdelivr.net/npm/v86@latest/build/v86.wasm',
            'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin',
            'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin',
        ];

        for (const url of endpoints) {
            const start = Date.now();
            try {
                const res = await fetch(url, { method: 'HEAD' });
                const ms = Date.now() - start;
                console.log(`${res.ok ? '✓' : '✗'} ${res.status} ${ms}ms ${url}`);
            } catch (err) {
                console.log(`✗ ERR ${url} - ${err.message}`);
            }
        }
    },

    async check(url) {
        url = url || API_BASE;
        console.log(`Checking ${url}...`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status} ${res.statusText}`);
            console.log(`Content-Type: ${res.headers.get('content-type')}`);
        } catch (err) {
            console.error(`Error: ${err.message}`);
            process.exit(1);
        }
    },

    async download(name) {
        const urls = {
            'v86.wasm': 'https://unpkg.com/v86@latest/build/v86.wasm',
            'libv86.js': 'https://unpkg.com/v86@latest/build/libv86.js',
            'seabios.bin': 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin',
            'vgabios.bin': 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin',
        };

        if (!name || name === 'all') {
            for (const [n, url] of Object.entries(urls)) {
                await this._download(n, url);
            }
        } else if (urls[name]) {
            await this._download(name, urls[name]);
        } else {
            console.error(`Unknown file: ${name}`);
            console.log('Available:', Object.keys(urls).join(', '));
        }
    },

    async _download(name, url) {
        const fs = await import('fs');
        const path = await import('path');
        console.log(`Downloading ${name}...`);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(name, buffer);
            console.log(`✓ ${name} (${buffer.length} bytes)`);
        } catch (err) {
            console.error(`✗ ${name}: ${err.message}`);
        }
    },

    help() {
        console.log(`
v86-xp CLI

Commands:
  status              Check CDN endpoint status
  check [url]         Check API/page status
  download [file]     Download v86 files (all, v86.wasm, libv86.js, etc.)
  help                Show this help

Environment:
  V86_API             Base URL for API checks (default: http://localhost:8080)

Examples:
  npx v86-xp status
  npx v86-xp download all
  npx v86-xp check https://example.github.io/xp/
`);
    }
};

async function main() {
    const [,, cmd, ...args] = process.argv;
    const handler = commands[cmd] || commands.help;
    await handler.call(commands, ...args);
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
