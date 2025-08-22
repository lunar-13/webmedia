# WebMedia Player

A modern, lightweight web-based media player with support for various audio formats, custom themes, and a sleek interface.

![WebMedia Player](icons/album.png)

## Features

- 🎵 Support for multiple audio formats (MP3, WAV)
- 🎨 Modern, responsive three-panel layout
- � Advanced playback controls:
  - Play/Pause
  - Next/Previous track
  - Shuffle mode
  - Repeat modes (none, one, all)
  - A-B loop functionality
  - Progress bar with seek capability
- 📊 Smart music organization:
  - Browse by artist
  - Browse by album
  - Create custom playlists
- 🎨 Advanced Theme System:
  - Built-in dark themes
  - Custom theme support (.wmtheme format)
  - Visual theme editor
  - Real-time theme preview
  - Import/Export themes
- 📱 Mobile-friendly responsive design
- 💾 Persistent storage:
  - Saves playlists
  - Remembers theme settings
  - Tracks storage usage

## Theme System

WebMedia Player includes a powerful theme system that allows for complete customization of the player's appearance:

### Built-in Themes
- Default Dark - A clean, modern dark theme
- Sunset Vibes - A warm, sunset-inspired color scheme
- Ocean Deep - A calming, ocean-inspired theme

### Custom Themes
Create your own themes using the built-in theme editor or by creating .wmtheme files. Themes can customize:
- Background colors
- Text colors
- Accent colors
- Button styles
- Custom gradients
- Transparency levels

### Theme Editor
Access the visual theme editor by clicking "Theme Editor" in the themes section. Features include:
- Live preview window
- Color pickers for all elements
- Gradient customization
- Opacity controls
- Metadata editing
- One-click export to .wmtheme format

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/webmedia.git
```

2. Open `index.html` in a modern web browser

That's it! No build process or dependencies to install.

## Usage

1. Click "Add Music" to import your audio files
2. Use the sidebar to browse your music by artists or albums
3. Click any track to play it
4. Use the player controls to manage playback
5. Customize the theme using the theme selector in the sidebar

## Browser Support

WebMedia Player works best in modern browsers that support:
- Web Audio API
- CSS Grid
- CSS Variables
- ES6+ JavaScript

## Technical Details

- Pure JavaScript with no framework dependencies
- CSS Grid and Flexbox for layout
- CSS Variables for theming
- Local Storage for settings persistence
- IndexedDB for audio storage
- Web Audio API for audio processing
- MediaTags for metadata extraction
- CSS Backdrop Filter for modern glass effects

## License

[MIT License](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Font Awesome for icons
- JSMediaTags for metadata extraction
