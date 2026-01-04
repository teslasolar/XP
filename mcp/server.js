#!/usr/bin/env node
/**
 * v86-xp MCP Server - Model Context Protocol server for v86 VM
 */

const ENDPOINTS = {
    'v86.wasm': 'https://unpkg.com/v86@latest/build/v86.wasm',
    'libv86.js': 'https://unpkg.com/v86@latest/build/libv86.js',
    'seabios.bin': 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin',
    'vgabios.bin': 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin',
};

const tools = {
    check_status: {
        description: 'Check v86 CDN endpoint status',
        parameters: { type: 'object', properties: {} },
        async handler() {
            const results = [];
            for (const [name, url] of Object.entries(ENDPOINTS)) {
                const start = Date.now();
                try {
                    const res = await fetch(url, { method: 'HEAD' });
                    results.push({ name, url, ok: res.ok, status: res.status, ms: Date.now() - start });
                } catch (err) {
                    results.push({ name, url, ok: false, error: err.message, ms: Date.now() - start });
                }
            }
            return { endpoints: results, timestamp: new Date().toISOString() };
        }
    },

    check_url: {
        description: 'Check if a URL is accessible',
        parameters: {
            type: 'object',
            properties: { url: { type: 'string', description: 'URL to check' } },
            required: ['url']
        },
        async handler({ url }) {
            const start = Date.now();
            try {
                const res = await fetch(url, { method: 'HEAD' });
                return { url, ok: res.ok, status: res.status, ms: Date.now() - start };
            } catch (err) {
                return { url, ok: false, error: err.message, ms: Date.now() - start };
            }
        }
    },

    get_config: {
        description: 'Get recommended v86 configuration',
        parameters: { type: 'object', properties: {} },
        handler() {
            return {
                sources: ENDPOINTS,
                recommended: {
                    memory_size: 256 * 1024 * 1024,
                    vga_memory_size: 8 * 1024 * 1024,
                },
                notes: [
                    'XP image required separately (xp.img or state.bin.zst)',
                    'Use saved state for instant boot',
                    'Change ACPI PC to Standard PC in Device Manager'
                ]
            };
        }
    }
};

// MCP Protocol handler
async function handleRequest(req) {
    const { method, params, id } = req;

    if (method === 'initialize') {
        return {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'v86-xp', version: '1.0.0' }
        };
    }

    if (method === 'tools/list') {
        return {
            tools: Object.entries(tools).map(([name, t]) => ({
                name,
                description: t.description,
                inputSchema: t.parameters
            }))
        };
    }

    if (method === 'tools/call') {
        const tool = tools[params.name];
        if (!tool) return { error: { code: -32601, message: `Unknown tool: ${params.name}` } };
        const result = await tool.handler(params.arguments || {});
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }

    return { error: { code: -32601, message: `Unknown method: ${method}` } };
}

// Stdio transport
async function main() {
    const readline = await import('readline');
    const rl = readline.createInterface({ input: process.stdin });

    process.stderr.write('v86-xp MCP server started\n');

    for await (const line of rl) {
        try {
            const req = JSON.parse(line);
            const res = await handleRequest(req);
            process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: req.id, result: res }) + '\n');
        } catch (err) {
            process.stdout.write(JSON.stringify({
                jsonrpc: '2.0', id: null,
                error: { code: -32700, message: err.message }
            }) + '\n');
        }
    }
}

main();
