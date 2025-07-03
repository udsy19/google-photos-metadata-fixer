import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Worker } from 'worker_threads';
import { readMetadata, writeMetadata } from './exif-tool';

interface ProcessOptions {
  inputPaths: string[];
  outputPath?: string;
  fixTimestamps: boolean;
  fixGeolocation: boolean;
  maintainFolderStructure: boolean;
  renameByDate: boolean;
  workerCount?: number;
  retryCount?: number;
  resumePreviousJob?: boolean;
}

interface ProcessProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  success: number;
  errors: number;
  failedFiles: string[];
  eta?: number; // estimated time remaining in seconds
  startTime?: number;
  fileHistory: FileProgressHistory[];
}

interface FileProgressHistory {
  file: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

interface CheckpointData {
  jobId: string;
  options: ProcessOptions;
  progress: ProcessProgress;
  completedFiles: Set<string>;
  failedFiles: Map<string, string>; // filename -> error message
  timestamp: number;
}

async function findMediaFiles(dirPath: string): Promise<string[]> {
  const mediaExtensions = new Set([
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif',
    '.mp4', '.mov', '.avi', '.webm', '.mkv'
  ]);
  
  const allFiles: string[] = [];
  
  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (mediaExtensions.has(ext)) {
          allFiles.push(fullPath);
        }
      }
    }
  }
  
  await scanDirectory(dirPath);
  return allFiles;
}

async function findJsonForMediaFile(mediaPath: string): Promise<string | null> {
  const dir = path.dirname(mediaPath);
  const baseName = path.basename(mediaPath, path.extname(mediaPath));
  const jsonPath = path.join(dir, `${baseName}.json`);
  
  try {
    await fs.access(jsonPath);
    return jsonPath;
  } catch {
    return null;
  }
}

async function extractMetadataFromJson(jsonPath: string) {
  try {
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const data = JSON.parse(jsonContent);
    
    const metadata: Record<string, any> = {};
    
    // Extract timestamp
    if (data.photoTakenTime?.timestamp) {
      const timestamp = parseInt(data.photoTakenTime.timestamp, 10) * 1000;
      const date = new Date(timestamp);
      metadata.DateTimeOriginal = date.toISOString();
    }
    
    // Extract geo coordinates
    if (data.geoData?.latitude && data.geoData?.longitude) {
      metadata.GPSLatitude = data.geoData.latitude;
      metadata.GPSLongitude = data.geoData.longitude;
      metadata.GPSLatitudeRef = data.geoData.latitude >= 0 ? 'N' : 'S';
      metadata.GPSLongitudeRef = data.geoData.longitude >= 0 ? 'E' : 'W';
    }
    
    return metadata;
  } catch (error) {
    console.error(`Failed to extract metadata from JSON: ${jsonPath}`, error);
    return null;
  }
}

/**
 * Saves the current processing state to a checkpoint file
 */
async function saveCheckpoint(data: CheckpointData): Promise<string> {
  const checkpointDir = path.join(os.homedir(), '.google-photos-fixer', 'checkpoints');
  await fs.mkdir(checkpointDir, { recursive: true });
  
  const checkpointPath = path.join(checkpointDir, `${data.jobId}.json`);
  
  // Convert Sets and Maps to arrays for JSON serialization
  const serializableData = {
    ...data,
    completedFiles: Array.from(data.completedFiles),
    failedFiles: Array.from(data.failedFiles.entries())
  };
  
  await fs.writeFile(checkpointPath, JSON.stringify(serializableData, null, 2));
  return checkpointPath;
}

/**
 * Loads a processing checkpoint from a file
 */
async function loadCheckpoint(jobId: string): Promise<CheckpointData | null> {
  try {
    const checkpointDir = path.join(os.homedir(), '.google-photos-fixer', 'checkpoints');
    const checkpointPath = path.join(checkpointDir, `${jobId}.json`);
    
    const content = await fs.readFile(checkpointPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Convert arrays back to Sets and Maps
    return {
      ...data,
      completedFiles: new Set(data.completedFiles),
      failedFiles: new Map(data.failedFiles)
    };
  } catch (error) {
    console.error(`Failed to load checkpoint: ${jobId}`, error);
    return null;
  }
}

/**
 * Find the most recent checkpoint for resuming
 */
async function findLatestCheckpoint(): Promise<string | null> {
  try {
    const checkpointDir = path.join(os.homedir(), '.google-photos-fixer', 'checkpoints');
    await fs.mkdir(checkpointDir, { recursive: true });
    
    const files = await fs.readdir(checkpointDir);
    if (files.length === 0) return null;
    
    // Get file stats and sort by modification time (most recent first)
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(checkpointDir, file);
        const stats = await fs.stat(filePath);
        return { file, stats };
      })
    );
    
    fileStats.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
    
    return fileStats[0].file.replace('.json', '');
  } catch (error) {
    console.error('Failed to find latest checkpoint', error);
    return null;
  }
}

/**
 * Generate a unique job ID
 */
function generateJobId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function processFiles(
  exifTool: any,
  options: ProcessOptions,
  progressCallback: (progress: ProcessProgress) => void,
  isCancelled: () => boolean = () => false
) {
  // Set default options
  const workerCount = options.workerCount || Math.max(1, os.cpus().length - 1);
  const retryCount = options.retryCount || 3;
  
  // Initialize job state
  let jobId: string;
  let completedFiles = new Set<string>();
  let failedFiles = new Map<string, string>();
  let checkpointInterval: NodeJS.Timeout | null = null;
  
  // Find all media files in all input directories
  let allMediaFiles: string[] = [];
  
  // Initialize progress with file history
  const progress: ProcessProgress = {
    totalFiles: 0,
    processedFiles: 0,
    currentFile: '',
    success: 0,
    errors: 0,
    failedFiles: [],
    startTime: Date.now(),
    fileHistory: []
  };
  
  // Try to resume from previous job if requested
  if (options.resumePreviousJob) {
    const latestJobId = await findLatestCheckpoint();
    if (latestJobId) {
      const checkpoint = await loadCheckpoint(latestJobId);
      if (checkpoint) {
        jobId = checkpoint.jobId;
        completedFiles = checkpoint.completedFiles;
        failedFiles = checkpoint.failedFiles;
        
        // Restore progress from checkpoint
        progress.totalFiles = checkpoint.progress.totalFiles;
        progress.processedFiles = checkpoint.progress.processedFiles;
        progress.success = checkpoint.progress.success;
        progress.errors = checkpoint.progress.errors;
        progress.fileHistory = checkpoint.progress.fileHistory || [];
        
        console.log(`Resumed job ${jobId} with ${completedFiles.size} completed files and ${failedFiles.size} failed files`);
      } else {
        jobId = generateJobId();
      }
    } else {
      jobId = generateJobId();
    }
  } else {
    jobId = generateJobId();
  }
  
  // If we're not resuming or couldn't find a valid checkpoint, scan directories for files
  if (progress.totalFiles === 0) {
    for (const inputPath of options.inputPaths) {
      const mediaFiles = await findMediaFiles(inputPath);
      allMediaFiles = [...allMediaFiles, ...mediaFiles];
    }
    
    progress.totalFiles = allMediaFiles.length;
  } else {
    // If resuming, we need to reconstruct allMediaFiles from completed and failed files
    const completedAndFailed = [...completedFiles, ...Array.from(failedFiles.keys())];
    
    // Then add any new files from the input paths
    for (const inputPath of options.inputPaths) {
      const mediaFiles = await findMediaFiles(inputPath);
      for (const file of mediaFiles) {
        if (!completedAndFailed.includes(file)) {
          allMediaFiles.push(file);
        }
      }
    }
    
    // Update total files count with any new files found
    progress.totalFiles = completedFiles.size + failedFiles.size + allMediaFiles.length;
  }
  
  // Send initial progress update
  progressCallback({ ...progress });
  
  // Set up checkpoint saving at regular intervals (every 30 seconds)
  checkpointInterval = setInterval(async () => {
    await saveCheckpoint({
      jobId,
      options,
      progress: { ...progress },
      completedFiles,
      failedFiles,
      timestamp: Date.now()
    });
  }, 30000);
  
  // Process files using worker threads
  try {
    // First, retry previously failed files if resuming
    if (failedFiles.size > 0) {
      console.log(`Retrying ${failedFiles.size} previously failed files`);
      const failedFilesArray = Array.from(failedFiles.keys());
      
      for (let i = 0; i < failedFilesArray.length && !isCancelled(); i++) {
        const mediaFile = failedFilesArray[i];
        progress.currentFile = path.basename(mediaFile);
        progressCallback({ ...progress });
        
        const result = await processMediaFile(
          mediaFile, 
          exifTool, 
          options, 
          retryCount
        );
        
        updateProgress(progress, mediaFile, result);
        
        if (result.success) {
          completedFiles.add(mediaFile);
          failedFiles.delete(mediaFile);
        }
        
        progressCallback({ ...progress });
        
        // Calculate ETA based on processed files and elapsed time
        if (progress.processedFiles > 0) {
          const elapsed = (Date.now() - (progress.startTime || Date.now())) / 1000;
          const filesPerSecond = progress.processedFiles / elapsed;
          const remainingFiles = progress.totalFiles - progress.processedFiles;
          progress.eta = filesPerSecond > 0 ? Math.round(remainingFiles / filesPerSecond) : undefined;
        }
      }
    }
    
    // Process new files with worker threads
    if (allMediaFiles.length > 0 && !isCancelled()) {
      // Create a queue of files to process
      const queue = [...allMediaFiles];
      // Track active workers
      const activeWorkers = new Set<Promise<void>>();
      
      while (queue.length > 0 || activeWorkers.size > 0) {
        // Check if cancelled
        if (isCancelled()) {
          console.log('Processing cancelled, waiting for active workers to complete...');
          await Promise.all(activeWorkers);
          break;
        }
        
        // Fill the worker pool
        while (queue.length > 0 && activeWorkers.size < workerCount) {
          const mediaFile = queue.shift()!;
          
          const workerPromise = (async () => {
            progress.currentFile = path.basename(mediaFile);
            
            // Add to file history with pending status
            progress.fileHistory.push({
              file: path.basename(mediaFile),
              timestamp: Date.now(),
              status: 'pending'
            });
            
            // Update progress UI
            progressCallback({ ...progress });
            
            const result = await processMediaFile(
              mediaFile, 
              exifTool, 
              options, 
              retryCount
            );
            
            updateProgress(progress, mediaFile, result);
            
            if (result.success) {
              completedFiles.add(mediaFile);
            } else {
              failedFiles.set(mediaFile, result.error || 'Unknown error');
            }
            
            // Calculate ETA based on processed files and elapsed time
            if (progress.processedFiles > 0) {
              const elapsed = (Date.now() - (progress.startTime || Date.now())) / 1000;
              const filesPerSecond = progress.processedFiles / elapsed;
              const remainingFiles = progress.totalFiles - progress.processedFiles;
              progress.eta = filesPerSecond > 0 ? Math.round(remainingFiles / filesPerSecond) : undefined;
            }
            
            progressCallback({ ...progress });
          })();
          
          activeWorkers.add(workerPromise);
          
          // Remove promise from activeWorkers when completed
          workerPromise.then(() => {
            activeWorkers.delete(workerPromise);
          });
        }
        
        // Wait for any worker to complete
        if (activeWorkers.size >= workerCount || queue.length === 0) {
          await Promise.race(activeWorkers);
        }
      }
    }
    
    // Save final checkpoint
    await saveCheckpoint({
      jobId,
      options,
      progress: { ...progress },
      completedFiles,
      failedFiles,
      timestamp: Date.now()
    });
    
    return {
      processed: progress.processedFiles,
      success: progress.success,
      errors: progress.errors,
      failedFiles: Array.from(failedFiles.keys()),
      jobId
    };
  } finally {
    // Clear checkpoint interval
    if (checkpointInterval) {
      clearInterval(checkpointInterval);
    }
  }
}

/**
 * Process a single media file
 */
async function processMediaFile(
  mediaFile: string,
  exifTool: any,
  options: ProcessOptions,
  retryCount: number
): Promise<{ success: boolean; error?: string }> {
  let attempts = 0;
  let lastError: any;
  
  while (attempts < retryCount) {
    attempts++;
    try {
      // Find corresponding JSON file if it exists
      const jsonFile = await findJsonForMediaFile(mediaFile);
      let metadataToWrite: Record<string, any> = {};
      
      if (jsonFile && (options.fixTimestamps || options.fixGeolocation)) {
        // Extract metadata from JSON
        const jsonMetadata = await extractMetadataFromJson(jsonFile);
        if (jsonMetadata) {
          metadataToWrite = { ...jsonMetadata };
        }
      }
      
      // Determine output path
      let outputFilePath = mediaFile;
      
      if (options.outputPath) {
        if (options.maintainFolderStructure) {
          // Find the appropriate input path that contains this file
          const containingInputPath = options.inputPaths.find(inputPath => 
            mediaFile.startsWith(inputPath)
          ) || options.inputPaths[0];
          
          // Create the relative path from the containing input path
          const relativePath = path.relative(containingInputPath, mediaFile);
          outputFilePath = path.join(options.outputPath, relativePath);
          
          // Ensure output directory exists
          await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
        } else {
          outputFilePath = path.join(options.outputPath, path.basename(mediaFile));
        }
        
        // Copy file to output location
        await fs.copyFile(mediaFile, outputFilePath);
      }
      
      // Rename file if needed
      if (options.renameByDate && metadataToWrite.DateTimeOriginal) {
        const date = new Date(metadataToWrite.DateTimeOriginal);
        const formattedDate = date.toISOString().replace(/[:.]/g, '').slice(0, 15);
        const ext = path.extname(outputFilePath);
        const newName = `${formattedDate}${ext}`;
        const newPath = path.join(path.dirname(outputFilePath), newName);
        
        await fs.rename(outputFilePath, newPath);
        outputFilePath = newPath;
      }
      
      // Write metadata to file
      if (Object.keys(metadataToWrite).length > 0) {
        await writeMetadata(outputFilePath, metadataToWrite);
      }
      
      return { success: true };
    } catch (error) {
      lastError = error;
      console.error(`Error processing file ${mediaFile} (attempt ${attempts}/${retryCount}):`, error);
      
      // Wait a bit before retrying (exponential backoff)
      if (attempts < retryCount) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
      }
    }
  }
  
  return { 
    success: false, 
    error: lastError instanceof Error ? lastError.message : String(lastError) 
  };
}

/**
 * Update progress object with file result
 */
function updateProgress(
  progress: ProcessProgress,
  mediaFile: string,
  result: { success: boolean; error?: string }
): void {
  progress.processedFiles++;
  
  if (result.success) {
    progress.success++;
    
    // Update file history
    progress.fileHistory.push({
      file: path.basename(mediaFile),
      timestamp: Date.now(),
      status: 'success'
    });
  } else {
    progress.errors++;
    progress.failedFiles.push(mediaFile);
    
    // Update file history
    progress.fileHistory.push({
      file: path.basename(mediaFile),
      timestamp: Date.now(),
      status: 'error',
      error: result.error
    });
  }
  
  // Keep file history to most recent 100 items to prevent it from growing too large
  if (progress.fileHistory.length > 100) {
    progress.fileHistory = progress.fileHistory.slice(-100);
  }
}
