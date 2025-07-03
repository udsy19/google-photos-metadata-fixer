interface ProcessOptions {
  inputPaths: string[];
  outputPath?: string;
  fixTimestamps: boolean;
  fixGeolocation: boolean;
  maintainFolderStructure: boolean;
  renameByDate: boolean;
}

interface FileProgressHistory {
  file: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

interface ProcessProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  success: number;
  errors: number;
  failedFiles?: string[];
  eta?: number; // Estimated time remaining in seconds
  startTime?: number; // Start time in milliseconds
  fileHistory: FileProgressHistory[];
}

interface SourceCheckResult {
  directories: string[];
  archives: string[];
}

interface ExtractionProgress {
  file: string;
  filesProcessed: number;
  totalFiles: number | null;
  stage: 'extracting' | 'analyzing' | 'preparing';
  status: 'pending' | 'success' | 'error';
  extractedPath?: string;
  error?: string;
}

interface ExtractionError {
  file: string;
  error: string;
}

interface ElectronAPI {
  // Window control
  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  
  // File and directory selection
  selectSources: () => Promise<string[] | null>;
  selectOutputDirectory: () => Promise<string | null>;
  
  // Source handling
  checkSources: (paths: string[]) => Promise<SourceCheckResult>;
  extractArchives: (archives: string[]) => Promise<string[]>;
  
  // Processing
  processFiles: (options: ProcessOptions) => Promise<{
    processed: number;
    success: number;
    errors: number;
    failedFiles?: string[];
    jobId?: string;
  }>;
  resumeProcessing: (jobId?: string) => Promise<{
    processed: number;
    success: number;
    errors: number;
    failedFiles?: string[];
    jobId?: string;
  }>;
  cancelProcessing: () => Promise<{ canceled: boolean }>;
  
  // Progress listeners
  onExtractionProgress: (callback: (progress: ExtractionProgress) => void) => (() => void) | undefined;
  onExtractionError: (callback: (error: ExtractionError) => void) => (() => void) | undefined;
  onProgress: (callback: (progress: ProcessProgress) => void) => (() => void) | undefined;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};