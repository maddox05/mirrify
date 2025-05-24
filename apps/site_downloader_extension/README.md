# Mirrify Chrome Extension

A Chrome extension that allows you to download entire websites as zip files.

## Features

- Download all resources from the current website
- Package everything into a convenient ZIP file
- Simple one-click interface
- Real-time file download counter

## Installation

### Development Mode

1. Clone this repository or download as a ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the extension directory

### Required Libraries

The extension requires JSZip library for creating ZIP files. Download it from:
https://github.com/Stuk/jszip/releases

Place the `jszip.min.js` file in the `lib` directory of the extension.

## Usage

1. Navigate to the website you want to download
2. Click the Mirrify extension icon in your Chrome toolbar
3. Click "Start Download" to begin capturing resources
4. Browse the website to ensure all needed resources are downloaded
5. When finished, click "Stop & Save ZIP" to create and download the ZIP file

## Permissions

This extension requires the following permissions:

- Active tab access
- Web request monitoring
- Download permission
- Storage for tracking download state

## Development

This extension is built with:

- Chrome Extension Manifest V3
- JavaScript
- JSZip library

To modify the extension, edit the source files and reload the extension in Chrome's extension page.

## License

[MIT License](LICENSE)
