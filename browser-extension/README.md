# Leon Bookmarks Browser Extension

Chrome/Edge extension for quickly saving bookmarks to your Leon Bookmarks workspace.

## Development Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select this `browser-extension/` directory
4. The extension icon will appear in your toolbar

## Building Icons

The extension needs PNG icons. Convert the SVG:

```bash
# Using Inkscape
for size in 16 32 48 128; do
  inkscape icons/icon.svg -w $size -h $size -o icons/icon${size}.png
done
```

Or use any SVG-to-PNG converter for sizes 16x16, 32x32, 48x48, 128x128.

Alternatively, run the included script (requires Node.js `canvas` package):

```bash
chmod +x generate-icons.sh
./generate-icons.sh
```

## Usage

1. Click the extension icon in your browser toolbar
2. Sign in with your Leon Bookmarks credentials
3. Navigate to any page you want to bookmark
4. Click the extension → the title and URL are auto-filled
5. Add an optional description, category, and tags
6. Click "Save Bookmark"

## Configuration

On the login screen, you can set a custom API URL. The default is `http://localhost:4000/api`. This is persisted in `chrome.storage.local`.

## File Structure

```
browser-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background/
│   └── service-worker.js  # Background service worker
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Styles
│   └── popup.js           # Logic
├── icons/
│   ├── icon.svg           # Source SVG icon
│   ├── icon16.png         # 16x16 icon (generate from SVG)
│   ├── icon32.png         # 32x32 icon
│   ├── icon48.png         # 48x48 icon
│   └── icon128.png        # 128x128 icon
└── generate-icons.sh      # Icon generation helper
```
