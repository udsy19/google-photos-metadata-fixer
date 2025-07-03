import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { setupExifTool } from './exif-tool';
import { processFiles } from './processor';
import { extractCompressedFile, isSupportedArchive, listAllArchives, ExtractionProgress } from './compression-util';

let mainWindow: BrowserWindow | null = null;
let exifToolProcess: any = null;
let isProcessingCancelled = false;
const tempFolders: string[] = [];

const isDevelopment = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 10 },
    frame: false,
    backgroundColor: '#FFFFFF',
  });

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize ExifTool mock
  exifToolProcess = setupExifTool();
  
  // Clean up temp folders on app close
  mainWindow.on('close', async () => {
    await cleanupTempFolders();
  });
}

async function cleanupTempFolders() {
  for (const folder of tempFolders) {
    try {
      await fs.rm(folder, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete temp folder ${folder}:`, error);
    }
  }
  tempFolders.length = 0;
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  await cleanupTempFolders();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('quit', async () => {
  if (exifToolProcess) {
    exifToolProcess.end();
  }
  await cleanupTempFolders();
});

// Window control handlers
ipcMain.on('window-control', (_, action) => {
  if (!mainWindow) return;
  
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

// IPC handlers
ipcMain.handle('select-sources', async () => {
  if (!mainWindow) return;
  
  // Allow selecting both files and directories in one dialog
  const dialogOptions: Electron.OpenDialogOptions = {
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    title: 'Select Google Takeout Files or Directories',
    filters: [
      { name: 'All Supported Files', extensions: ['zip', 'tar', 'tgz', 'gz'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };
  
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, dialogOptions);
  
  if (canceled) return null;
  return filePaths;
});

ipcMain.handle('select-output-directory', async () => {
  if (!mainWindow) return;
  
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Output Directory',
  });
  
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('check-sources', async (_, paths: string[]) => {
  const result = {
    directories: [] as string[],
    archives: [] as string[]
  };
  
  for (const sourcePath of paths) {
    try {
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        result.directories.push(sourcePath);
      } else if (stats.isFile() && isSupportedArchive(sourcePath)) {
        result.archives.push(sourcePath);
      }
    } catch (error) {
      console.error(`Error checking source ${sourcePath}:`, error);
    }
  }
  
  return result;
});

ipcMain.handle('extract-archives', async (_, archives: string[]) => {
  if (!mainWindow) return [];
  
  isProcessingCancelled = false;
  const extractedPaths: string[] = [];
  
  // Process all archives in parallel
  const extractionPromises = archives.map(async (archivePath) => {
    if (isProcessingCancelled) return null;
    
    try {
      // Extract in the same directory as the archive
      const extractDir = path.dirname(archivePath);
      
      const sendProgress = (progress: ExtractionProgress) => {
        if (mainWindow && !isProcessingCancelled) {
          mainWindow.webContents.send('extraction-progress', progress);
        }
      };
      
      const extractedPath = await extractCompressedFile(archivePath, extractDir, sendProgress);
      return extractedPath;
    } catch (error) {
      console.error(`Failed to extract ${archivePath}:`, error);
      if (mainWindow) {
        mainWindow.webContents.send('extraction-error', {
          file: path.basename(archivePath),
          error: error instanceof Error ? error.message : String(error)
        });
      }
      return null;
    }
  });
  
  // Wait for all extractions to complete
  const results = await Promise.all(extractionPromises);
  
  // Filter out null results (failed extractions)
  for (const result of results) {
    if (result) extractedPaths.push(result);
  }
  
  return extractedPaths;
});

ipcMain.handle('process-files', async (_, options) => {
  if (!mainWindow) return;
  if (!exifToolProcess) {
    exifToolProcess = setupExifTool();
  }
  
  isProcessingCancelled = false;
  
  // Configure default worker count (use CPU count - 1 for performance)
  if (!options.workerCount) {
    options.workerCount = Math.max(1, os.cpus().length - 1);
  }
  
  // Process with cancellation support
  return processFiles(
    exifToolProcess, 
    options, 
    (progress) => {
      if (mainWindow && !isProcessingCancelled) {
        mainWindow.webContents.send('processing-progress', progress);
      }
    },
    () => isProcessingCancelled
  );
});

ipcMain.handle('cancel-processing', async () => {
  isProcessingCancelled = true;
  return { canceled: true };
});

ipcMain.handle('resume-processing', async (_, jobId) => {
  if (!mainWindow) return;
  if (!exifToolProcess) {
    exifToolProcess = setupExifTool();
  }
  
  isProcessingCancelled = false;
  
  // Create options with resume flag enabled
  const options = {
    resumePreviousJob: true,
    // Default values for any required fields
    inputPaths: [],
    fixTimestamps: true,
    fixGeolocation: true,
    maintainFolderStructure: true,
    renameByDate: false
  };
  
  // Process with cancellation support
  return processFiles(
    exifToolProcess, 
    options, 
    (progress) => {
      if (mainWindow && !isProcessingCancelled) {
        mainWindow.webContents.send('processing-progress', progress);
      }
    },
    () => isProcessingCancelled
  );
});