# Getting Started with Google Photos Metadata Fixer

This guide will help you get started with the Google Photos Metadata Fixer application.

## Installation

### macOS

1. Download the latest macOS installer (.dmg) from the releases page
2. Open the DMG file and drag the application to your Applications folder
3. Open the application from your Applications folder

### Windows

1. Download the latest Windows installer (.exe) from the releases page
2. Run the installer and follow the instructions
3. Launch the application from the Start menu

## Basic Usage

### Step 1: Select Input Sources

1. Click the "Browse" button in the Source Files section
2. Navigate to your Google Takeout files (either ZIP archives or extracted folders)
3. Select the files/folders and click "Open"
4. Alternatively, drag and drop your files or folders directly onto the application window

### Step 2: Choose Processing Options

Select the processing options you'd like to apply:

- **Fix timestamps**: Corrects creation dates and other time-related metadata
- **Fix geolocation**: Restores geographic location data
- **Maintain folder structure**: Preserves the original folder hierarchy
- **Rename files by date**: Renames files based on their correct timestamps

### Step 3: Select Output Method

Choose one of the following:

- **Modify files in place**: Apply changes directly to the original files
- **Output to a new location**: Create modified copies in a different directory

If you choose a new location, click "Browse" to select an output directory.

### Step 4: Start Processing

Click the "Extract and Process" button to begin. This will:
1. Automatically extract any archives you've selected
2. Process all the files in one operation
3. Show detailed progress with a progress bar, file history, and estimated time remaining

## Using JSON Sidecar Files

Google Takeout includes JSON files with each media file that contain the original metadata. This application automatically finds and uses these files to restore the correct information.

## Tips and Best Practices

1. **Make a backup** of your original files before processing
2. For large archives, expect processing to take some time
3. Check a few sample files after processing to verify the results
4. If you encounter issues, try processing a smaller batch first

## Advanced Features

### Resuming Interrupted Operations

If your processing is interrupted (by a system crash, power outage, or manual cancellation):
1. Restart the application
2. If any files failed to process, you'll see a "Retry Failed Files" button
3. Click this button to automatically resume processing from where it left off

### Multi-core Processing

The application automatically detects your system's capabilities and uses multiple CPU cores for faster processing. For extremely large archives, this provides significant performance improvements.

### Error Recovery and Retries

When files fail to process, the application:
1. Automatically retries up to 3 times with increasing delays
2. Maintains a record of failed files for later recovery
3. Provides detailed error information to help diagnose issues

## Troubleshooting

- **Application won't start**: Make sure you have the latest version of macOS or Windows
- **Processing errors**: Check that you have read/write permissions to the directories
- **Metadata not updated**: Verify that the JSON sidecar files are present alongside your media files
- **Performance issues**: The application should automatically optimize for your system
- **Extraction fails**: Ensure your archive files aren't corrupted or password-protected

## Need Help?

If you encounter any issues or have questions, please:

1. Check the project's GitHub issues page for known problems
2. Submit a new issue with detailed information about your problem
3. Include error messages and steps to reproduce the issue