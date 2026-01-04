/**
 * v86 Windows XP VM Configuration
 * Modify these settings to customize your VM
 */
const VM_CONFIG = {
    // v86 engine files (required)
    wasm_path: "v86.wasm",
    bios_path: "seabios.bin",
    vga_bios_path: "vgabios.bin",

    // Memory configuration
    memory_size: 256 * 1024 * 1024,      // 256MB RAM (max practical for XP in browser)
    vga_memory_size: 8 * 1024 * 1024,    // 8MB VRAM

    // Boot source - choose ONE:
    // Option 1: Cold boot from disk image (slow, 2-5 minutes)
    hda_url: "xp.img",

    // Option 2: Instant boot from saved state (recommended)
    // initial_state: "state.bin.zst",

    // Optional: WebSocket network proxy
    // network_relay_url: "wss://relay.widgetry.org/",

    // Auto-start VM on page load
    autostart: false,
};
