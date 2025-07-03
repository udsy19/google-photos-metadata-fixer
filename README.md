# Google Photos Metadata Fixer

A modern cross-platform desktop application that automatically fixes metadata issues in files exported through Google Takeout. This application focuses on restoring accurate timestamps, geolocation data, and other crucial metadata that is often corrupted or lost during the Google Takeout export process.

![App Screenshot](https://via.placeholder.com/800x450.png?text=Google+Photos+Metadata+Fixer)

## Features

- Batch process entire Google Takeout archives with just a few clicks
- Fix incorrect creation dates and timestamps from JSON metadata
- Restore original geolocation data for your photos
- Preserve and repair EXIF/IPTC/XMP metadata
- Modern, intuitive UI with smooth animations and transitions
- Dark and light theme support with automatic system detection
- Multiple export options with in-place editing or to new locations
- Advanced error recovery with auto-retry and resumable processing
- Progress monitoring with estimated time remaining
- Drag-and-drop support for files and directories

## Modern UI Design

The application features a sleek, modern user interface with:

- Card-based design with subtle shadows and animations
- Smooth transitions between views and interactions
- Accessible layout with clear visual hierarchy
- Custom form controls with interactive feedback
- Progress visualization with animated indicators
- Responsive layout that adapts to different window sizes
- Professional color scheme with light and dark themes

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
```

## Building Distribution Packages

To create installable packages:

```bash
# For macOS (.dmg)
npm run build:mac

# For Windows (.exe)
npm run build:win
```

See [BUILD.md](BUILD.md) for detailed build instructions.

## How to Use

### Getting Started

1. **Download and Install**: 
   - Download the appropriate installer for your platform (.dmg for macOS, .exe for Windows)
   - Install the application by following the platform-specific instructions

2. **Export Google Takeout Data**:
   - Go to [Google Takeout](https://takeout.google.com/)
   - Select only "Google Photos" data
   - Choose your preferred export format (zip files recommended)
   - Download your Google Photos archive(s)

3. **Process Your Files**:
   - Launch Google Photos Metadata Fixer
   - Select your Google Takeout archives or extracted folders by clicking "Browse" or dragging files onto the application
   - Choose your output preferences (modify in place or create new copies)
   - Configure processing options (timestamps, geolocation, etc.)
   - Click "Extract and Process" to begin

### Processing Options

- **Fix timestamps**: Restores correct creation dates and other time metadata
- **Fix geolocation data**: Adds back GPS coordinates and location information
- **Maintain folder structure**: Keeps original folder organization when creating new copies
- **Rename by date**: Renames files based on their capture date (YYYYMMDD_HHMMSS format)

### Advanced Features

- **Error recovery**: If processing is interrupted, the app can resume from where it left off
- **Batch processing**: Handle multiple archives with a single operation
- **Progress tracking**: Monitor processing with detailed progress information and time estimates
- **Dark/light theme**: Use the theme toggle to switch between visual modes

## Privacy

This application processes all your photos locally. No data is ever sent to remote servers, and the application does not collect any telemetry or personal information.

## Author

Created by **Udaya Vijay Anand**

## License

MIT