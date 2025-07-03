# Development Guide

This document outlines the development process, challenges faced, and solutions implemented in the Google Photos Metadata Fixer application.

## Project Structure

The application is built with Electron and React using TypeScript. The project structure is organized as follows:

```
/
├── dist/                # Compiled output
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point
│   │   ├── preload.js  # Preload script for IPC
│   │   ├── exif-tool.ts # ExifTool integration
│   │   └── processor.ts # File processing logic
│   └── renderer/       # React UI (renderer process)
│       ├── components/ # React components
│       ├── contexts/   # React contexts
│       ├── styles/     # CSS styles
│       ├── App.tsx     # Main React component
│       └── index.tsx   # Renderer entry point
├── package.json        # Project dependencies and scripts
└── webpack.config.js   # Webpack configuration
```

## Development Workflow

1. **Setup**: Run `./setup.sh` to install dependencies and create necessary directories
2. **Development**: Run `npm run dev` to start the development server
3. **Building**: Run `npm run build` for production builds

## Challenges and Solutions

### ExifTool Integration

We faced challenges integrating the ExifTool library due to its native dependencies. Our solution:

1. Created a mock ExifTool implementation for development
2. In production, the application would use the real ExifTool binary

### Multi-threaded Processing

To improve performance with large archives, we implemented:

1. A worker thread pool for parallel processing
2. Configurable thread count based on system capabilities
3. Task queuing system to manage worker assignments

### Stateful Recovery System

For handling interruptions and errors, we implemented:

1. Checkpointing system to save progress periodically
2. Filesystem-based storage for recovery data
3. Automatic detection and recovery of previously interrupted jobs
4. Exponential backoff for failed files with retry capability

### Electron Preload Script

The preload script is crucial for secure IPC between the main and renderer processes. We implemented:

1. A secure preload script with contextIsolation
2. Proper webpack configuration to copy the preload script to the output directory
3. Type definitions for better development experience

### Webpack Configuration

We used webpack to bundle both main and renderer processes:

1. Separate configurations for main and renderer processes
2. CopyPlugin to handle the preload script
3. HtmlWebpackPlugin for the renderer process

## Mock Implementation for Development

To facilitate development without requiring external dependencies, we implemented:

1. A mock ExifTool implementation
2. Simulated file processing logic
3. UI for interaction with the mocked backend

## Key Components

### Processor.ts

The core file processing system with:
- Multi-threaded worker pool for parallel processing
- Checkpointing and recovery mechanisms
- Progress tracking with ETA calculation
- File history recording for detailed logging

### Compression-util.ts

Archive extraction capabilities including:
- ZIP file extraction with progress reporting
- TAR/TGZ/GZ extraction with streaming
- Parallel extraction of multiple archives
- Error handling with detailed feedback

### UI Components

- **ProcessorView**: Main processing interface with drag-and-drop support
- **FileHistoryList**: Real-time visualization of processing history
- **FileProgressItem**: Individual file status with detailed information
- **ProgressBar**: Enhanced progress visualization with themes and variants

## Production Considerations

For a production-ready application, consider:

1. Replace mock ExifTool with the real implementation (exiftool-vendored)
2. Add telemetry option for crash reporting (opt-in only)
3. Implement proper test coverage with Jest/Testing Library
4. Add auto-update functionality with electron-updater
5. Create signed packages for app store distribution
6. Implement more sophisticated error recovery mechanisms

## Troubleshooting

If you encounter issues:

1. **Missing preload.js**: Ensure the preload script is properly copied to the dist directory
2. **ExifTool errors**: Check the mock implementation or ExifTool installation
3. **UI not loading**: Verify the webpack configuration and HTML template