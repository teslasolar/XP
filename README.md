# Windows XP v86 - GitHub Pages

Browser-based Windows XP virtual machine using [v86](https://github.com/copy/v86) emulator.

**Why?** Self-limiting AI container: XP 32-bit = 4GB max, browser sandbox, ~150MB footprint.

## Quick Start

### 1. Get v86 Engine Files

```bash
git clone https://github.com/copy/v86 && cd v86
make build/libv86.js build/v86.wasm
```

Copy these files to your repo:
- `build/libv86.js`
- `build/v86.wasm`
- `bios/seabios.bin`
- `bios/vgabios.bin`

Or download pre-built from [v86 releases](https://github.com/copy/v86/releases).

### 2. Get Windows XP Image

| Image | Size | Source |
|-------|------|--------|
| TinyXP | ~100MB | [archive.org](https://archive.org/search?query=tinyxp) |
| MicroXP | ~150MB | [archive.org](https://archive.org/search?query=microxp) |
| Full XP | ~600MB | External CDN required |

Rename to `xp.img` and place in repo root.

### 3. Configure

Edit `config.js`:
```javascript
const VM_CONFIG = {
    hda_url: "xp.img",           // Cold boot (slow)
    // initial_state: "state.bin.zst",  // Instant boot (recommended)
    autostart: false,
};
```

### 4. Deploy

Enable GitHub Pages (Settings → Pages → Source: main branch).

## GitHub Pages Limits

| Limit | Value |
|-------|-------|
| Repo size | 1 GB |
| Bandwidth | 100 GB/month |
| File size | 100 MB max |
| LFS | Not supported |

**Files >100MB:** Host on external CDN (e.g., archive.org, Cloudflare R2) and update `config.js` URL.

## Instant Boot with Saved State

Cold boot takes 2-5 minutes. Use saved states for instant boot:

### Save State (after XP boots)
```javascript
// In browser console
emulator.save_state((e,s) => {
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([s]));
    a.download = "state.bin";
    a.click();
});
```

### Compress State
```bash
zstd -19 state.bin -o state.bin.zst
```

### Load State
Update `config.js`:
```javascript
// Comment out hda_url, uncomment initial_state
// hda_url: "xp.img",
initial_state: "state.bin.zst",
```

## Shrinking XP Image

Use [nLite](https://www.nliteos.com/) to remove:
- Themes
- Drivers
- Internet Explorer
- Help files
- Printer support

Target: <100MB for GitHub hosting.

## Agent I/O

### Serial Communication
```javascript
// Send command
emulator.serial0_send("dir C:\\\n");

// Receive output
emulator.add_listener("serial0-output-byte", (byte) => {
    console.log(String.fromCharCode(byte));
});
```

### Network
```javascript
// WebSocket proxy for network access
network_relay_url: "wss://relay.widgetry.org/"
```

## Troubleshooting

### XP won't boot / ACPI errors
In Device Manager: change "ACPI PC" → "Standard PC"

### Large files
Split files >100MB:
```bash
split -b 50M xp.img xp.img.part.
```
Reassemble client-side or use external hosting.

### Performance
- Use saved state (instant boot)
- 256MB RAM is optimal for browser
- Close other tabs

## File Structure

```
/
├── index.html          # Main page
├── config.js           # VM configuration
├── libv86.js           # v86 engine (download)
├── v86.wasm            # v86 WASM (download)
├── seabios.bin         # BIOS (download)
├── vgabios.bin         # VGA BIOS (download)
├── xp.img              # XP disk image (download)
└── state.bin.zst       # Saved state (optional)
```

## Legal

Windows XP is proprietary software. Post-2014 EOL, it exists in a gray area. Use at your own discretion for educational/research purposes.

## License

MIT (for the HTML/JS wrapper code)
