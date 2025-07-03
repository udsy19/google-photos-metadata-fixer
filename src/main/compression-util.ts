import fs from 'fs/promises';
import path from 'path';
import * as fsExtra from 'fs-extra';
import * as tar from 'tar';
import * as extract_zip from 'extract-zip';

export interface ExtractionProgress {
  file: string;
  filesProcessed: number;
  totalFiles: number | null;
  stage: 'extracting' | 'analyzing' | 'preparing';
  status: 'pending' | 'success' | 'error';
  extractedPath?: string;
  error?: string;
}

/**
 * Extract different types of compressed archives
 */
export async function extractCompressedFile(
  archivePath: string,
  destinationPath: string,
  progressCallback: (progress: ExtractionProgress) => void
): Promise<string> {
  const fileName = path.basename(archivePath);
  const fileExt = path.extname(archivePath).toLowerCase();
  
  // Create extraction directory
  const extractionDir = path.join(destinationPath, path.basename(archivePath, fileExt));
  await fs.mkdir(extractionDir, { recursive: true });
  
  try {
    progressCallback({
      file: fileName,
      filesProcessed: 0,
      totalFiles: null,
      stage: 'preparing',
      status: 'pending'
    });
    
    // Extract based on file type
    if (fileExt === '.zip') {
      await extractZip(archivePath, extractionDir, progressCallback);
    } else if (fileExt === '.tar' || fileExt === '.tgz' || fileExt === '.gz') {
      await extractTar(archivePath, extractionDir, progressCallback);
    } else {
      throw new Error(`Unsupported archive type: ${fileExt}`);
    }
    
    progressCallback({
      file: fileName,
      filesProcessed: 100,
      totalFiles: 100,
      stage: 'extracting',
      status: 'success',
      extractedPath: extractionDir
    });
    
    return extractionDir;
  } catch (error) {
    progressCallback({
      file: fileName,
      filesProcessed: 0,
      totalFiles: 1,
      stage: 'extracting',
      status: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Extract .zip archives
 */
async function extractZip(
  zipPath: string, 
  destination: string,
  progressCallback: (progress: ExtractionProgress) => void
) {
  const fileName = path.basename(zipPath);
  
  progressCallback({
    file: fileName,
    filesProcessed: 0,
    totalFiles: null,
    stage: 'analyzing',
    status: 'pending'
  });
  
  // We're using extract-zip library
  await extract_zip.default(zipPath, { 
    dir: destination,
    onEntry: (entry: any, zipFile: any) => {
      progressCallback({
        file: fileName,
        filesProcessed: zipFile.entriesRead || 0,
        totalFiles: zipFile.entryCount || null,
        stage: 'extracting',
        status: 'pending'
      });
    }
  });
}

/**
 * Extract .tar, .tgz, .tar.gz archives
 */
async function extractTar(
  tarPath: string, 
  destination: string,
  progressCallback: (progress: ExtractionProgress) => void
) {
  const fileName = path.basename(tarPath);
  let filesProcessed = 0;
  
  progressCallback({
    file: fileName,
    filesProcessed: 0,
    totalFiles: null,
    stage: 'analyzing',
    status: 'pending'
  });
  
  await tar.extract({
    file: tarPath,
    cwd: destination,
    onentry: (entry: any) => {
      filesProcessed++;
      progressCallback({
        file: fileName,
        filesProcessed: filesProcessed,
        totalFiles: null, // tar doesn't provide total count easily
        stage: 'extracting',
        status: 'pending'
      });
    }
  });
}

/**
 * Check if a file is a supported compressed archive
 */
export function isSupportedArchive(filePath: string): boolean {
  const filename = path.basename(filePath).toLowerCase();
  const fileExt = path.extname(filePath).toLowerCase();
  
  // Direct extension matches
  if (['.zip', '.tar', '.tgz'].includes(fileExt)) {
    return true;
  }
  
  // Check for .tar.gz format
  if (fileExt === '.gz' && filename.endsWith('.tar.gz')) {
    return true;
  }
  
  // Just .gz file (non-tar)
  if (fileExt === '.gz') {
    return true;
  }
  
  return false;
}

/**
 * Get a list of all files in all archives
 */
export async function listAllArchives(archivePaths: string[]): Promise<string[]> {
  return archivePaths.filter(isSupportedArchive);
}