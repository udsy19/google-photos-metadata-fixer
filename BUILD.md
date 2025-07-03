# Building Distributable Packages

This guide explains how to create distributable packages (DMG for macOS or EXE for Windows) of the Google Photos Metadata Fixer application.

## Prerequisites

Before building, make sure you have:

1. Node.js installed (v14 or later)
2. All dependencies installed (`npm install`)
3. A clean development environment (`npm run lint` and `npm run typecheck` pass)

## Icons

For proper application icons, you need to place the following files in the `build` directory:

- For macOS: `build/icon.icns` (an Apple Icon Image file)
- For Windows: `build/icon.ico` (an Icon file)

You can create these icons from a high-resolution PNG image using tools like:
- macOS: IconUtil or online converters
- Windows: Online ICO converters

## Building for macOS

To build a DMG installer for macOS, run:

```bash
npm run build:mac
```

This will create a `.dmg` file in the `dist` directory that users can mount and drag the application to their Applications folder.

## Building for Windows

To build an NSIS installer for Windows, run:

```bash
npm run build:win
```

This will create an `.exe` installer in the `dist` directory that users can run to install the application.

## Building for Both Platforms

To build for both platforms (if your system supports it), run:

```bash
npm run build
```

## Cross-Platform Building

Note that building for a specific platform typically requires being on that platform:

- Building for macOS requires a Mac
- Building for Windows works best on Windows

For cross-platform building, consider using:
- GitHub Actions CI/CD workflows
- Electron Forge with Docker
- A build service like electron-builder's cloud build

## Troubleshooting

### Common Issues

1. **Missing icons**: If your application is built without custom icons, check that the icon files are in the correct location and format.

2. **Code signing errors**: For distribution, you might need to sign your application with a developer certificate.

3. **Build errors**: Make sure all dependencies are installed and your code compiles without errors.

4. **Large file size**: Use the `--publish never` flag to avoid including the full Git history in your build.

### Ensuring a Clean Build

For a clean build, try:

```bash
rm -rf dist node_modules
npm install
npm run build
```

## Advanced Configuration

For more advanced build configurations, see the [electron-builder documentation](https://www.electron.build/).