/**
 * v86 Windows XP VM Configuration
 */
const VM_CONFIG = {
    // Memory
    memory_size: 256 * 1024 * 1024,      // 256MB RAM
    vga_memory_size: 8 * 1024 * 1024,    // 8MB VRAM

    // Boot source - choose ONE:
    hda_url: "xp.img",                   // Cold boot (slow)
    // initial_state: "state.bin.zst",   // Instant boot (recommended)

    // Iframe embed URL (for GitHub Pages CSP workaround)
    // Set this to your Netlify/Vercel URL hosting embed.html
    // embed_url: "https://your-app.netlify.app/embed.html",

    // Optional: WebSocket network proxy
    // network_relay_url: "wss://relay.widgetry.org/",

    // Auto-start VM on page load
    autostart: false,
};
