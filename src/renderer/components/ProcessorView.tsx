import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import ArchiveExtractionList from './ArchiveExtractionList';
import FileProgressItem from './FileProgressItem';
import FileHistoryList from './FileHistoryList';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/ProcessorView.css';

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

interface SourceInfo {
  directories: string[];
  archives: string[];
}

interface ExtractionStatus {
  file: string;
  progress: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

const ProcessorView: React.FC = () => {
  const { theme } = useTheme();
  // Sources state
  const [sources, setSources] = useState<string[]>([]);
  const [sourceInfo, setSourceInfo] = useState<SourceInfo | null>(null);
  const [extractedPaths, setExtractedPaths] = useState<string[]>([]);
  
  // Processing options
  const [outputPath, setOutputPath] = useState<string>('');
  const [useInPlace, setUseInPlace] = useState<boolean>(false);
  const [fixTimestamps, setFixTimestamps] = useState<boolean>(true);
  const [fixGeolocation, setFixGeolocation] = useState<boolean>(true);
  const [maintainFolderStructure, setMaintainFolderStructure] = useState<boolean>(true);
  const [renameByDate, setRenameByDate] = useState<boolean>(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProcessProgress | null>(null);
  const [results, setResults] = useState<{ 
    processed: number; 
    success: number; 
    errors: number;
    failedFiles?: string[];
    jobId?: string;
  } | null>(null);
  
  // Archives extraction state
  const [archiveExtractions, setArchiveExtractions] = useState<ExtractionStatus[]>([]);
  
  // Initialize event listeners
  useEffect(() => {
    // Set up progress listener for file processing
    const removeProcessListener = window.electron.onProgress((progress: ProcessProgress) => {
      setProgress(progress);
    });
    
    // Set up progress listener for archive extraction
    const removeExtractionListener = window.electron.onExtractionProgress((progress) => {
      setArchiveExtractions(prev => {
        const index = prev.findIndex(item => item.file === progress.file);
        
        if (index === -1) {
          return [...prev, { 
            file: progress.file,
            progress: progress.totalFiles ? progress.filesProcessed / progress.totalFiles : 0,
            status: progress.status,
            message: progress.stage === 'analyzing' 
              ? 'Analyzing archive contents...'
              : progress.stage === 'preparing'
                ? 'Preparing for extraction...'
                : `Extracting files (${progress.filesProcessed}${progress.totalFiles ? `/${progress.totalFiles}` : ''})...`
          }];
        }
        
        const updated = [...prev];
        updated[index] = { 
          ...updated[index],
          progress: progress.totalFiles ? progress.filesProcessed / progress.totalFiles : 
                    progress.status === 'success' ? 1 : updated[index].progress,
          status: progress.status,
          message: progress.status === 'success' 
            ? 'Extraction complete!' 
            : progress.status === 'error'
              ? progress.error || 'Failed to extract archive'
              : progress.stage === 'analyzing' 
                ? 'Analyzing archive contents...'
                : progress.stage === 'preparing'
                  ? 'Preparing for extraction...'
                  : `Extracting files (${progress.filesProcessed}${progress.totalFiles ? `/${progress.totalFiles}` : ''})...`
        };
        
        return updated;
      });
    });
    
    // Set up error listener for archive extraction
    const removeErrorListener = window.electron.onExtractionError((error) => {
      setArchiveExtractions(prev => {
        const index = prev.findIndex(item => item.file === error.file);
        
        if (index === -1) {
          return [...prev, { 
            file: error.file,
            progress: 0,
            status: 'error',
            message: error.error
          }];
        }
        
        const updated = [...prev];
        updated[index] = { 
          ...updated[index],
          status: 'error',
          message: error.error
        };
        
        return updated;
      });
    });
    
    return () => {
      if (removeProcessListener) removeProcessListener();
      if (removeExtractionListener) removeExtractionListener();
      if (removeErrorListener) removeErrorListener();
    };
  }, []);
  
  // Initialize drag and drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Add drag over class to body
      document.body.classList.add('drag-over');
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove drag over class from body
      document.body.classList.remove('drag-over');
    };
    
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Remove drag over class from body
      document.body.classList.remove('drag-over');
      
      // Process dropped files
      if (e.dataTransfer?.files) {
        const droppedPaths: string[] = [];
        
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          if (file.path) {
            droppedPaths.push(file.path);
          }
        }
        
        if (droppedPaths.length > 0) {
          setSources(droppedPaths);
          setArchiveExtractions([]);
          setExtractedPaths([]);
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);
    
    // Cleanup
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);
  
  // Update the source info when sources change
  useEffect(() => {
    const updateSourceInfo = async () => {
      if (sources.length > 0) {
        const info = await window.electron.checkSources(sources);
        setSourceInfo(info);
      } else {
        setSourceInfo(null);
      }
    };
    
    updateSourceInfo();
  }, [sources]);
  
  const handleSelectSources = async () => {
    const result = await window.electron.selectSources();
    if (result && result.length > 0) {
      setSources(result);
      setArchiveExtractions([]);
      setExtractedPaths([]);
    }
  };
  
  const handleSelectOutputDir = async () => {
    const result = await window.electron.selectOutputDirectory();
    if (result) setOutputPath(result);
  };
  
  const handleExtractArchives = async (archivesOrEvent: string[] | React.MouseEvent = []) => {
    // If this is called as an event handler, handle that case
    if (!Array.isArray(archivesOrEvent)) {
      const archives: string[] = [];
      const archivesToExtract = archives.length > 0 ? archives : sourceInfo?.archives || [];
      if (archivesToExtract.length === 0) return;
      
      setIsExtracting(true);
      
      try {
        // Reset extraction statuses for archives
        setArchiveExtractions(
          archivesToExtract.map(archive => ({
            file: archive.split('/').pop() || archive,
            progress: 0,
            status: 'pending'
          }))
        );
        
        const paths = await window.electron.extractArchives(archivesToExtract);
        setExtractedPaths(paths);
        return paths;
      } catch (error) {
        console.error('Extraction error:', error);
        return [];
      } finally {
        setIsExtracting(false);
      }
    } else {
      // Original implementation for direct calls with archives array
      const archivesToExtract = archivesOrEvent.length > 0 ? archivesOrEvent : sourceInfo?.archives || [];
      if (archivesToExtract.length === 0) return;
      
      setIsExtracting(true);
      
      try {
        // Reset extraction statuses for archives
        setArchiveExtractions(
          archivesToExtract.map(archive => ({
            file: archive.split('/').pop() || archive,
            progress: 0,
            status: 'pending'
          }))
        );
        
        const paths = await window.electron.extractArchives(archivesToExtract);
        setExtractedPaths(paths);
        return paths;
      } catch (error) {
        console.error('Extraction error:', error);
        return [];
      } finally {
        setIsExtracting(false);
      }
    }
  };
  
  const handleCancelExtraction = async () => {
    await window.electron.cancelProcessing();
    setIsExtracting(false);
  };
  
  const handleProcessFiles = async () => {
    // If we have archives, extract them first
    let allExtractedPaths = [...extractedPaths];
    
    if (sourceInfo?.archives && sourceInfo.archives.length > 0 && !isExtracting) {
      const newPaths = await handleExtractArchives(sourceInfo.archives);
      if (newPaths) {
        allExtractedPaths = [...allExtractedPaths, ...newPaths];
      }
    }
    
    // Collect all directories to process
    const allInputPaths = [
      ...(sourceInfo?.directories || []),
      ...allExtractedPaths
    ];
    
    if (allInputPaths.length === 0 || (useInPlace === false && !outputPath)) {
      alert('Please select input sources and an output directory');
      return;
    }
    
    setIsProcessing(true);
    setResults(null);
    
    try {
      const options: ProcessOptions = {
        inputPaths: allInputPaths,
        outputPath: useInPlace ? undefined : outputPath,
        fixTimestamps,
        fixGeolocation,
        maintainFolderStructure,
        renameByDate,
      };
      
      const result = await window.electron.processFiles(options);
      setResults(result);
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancel = async () => {
    await window.electron.cancelProcessing();
  };
  
  // Check if we can proceed to processing
  const canProcess = (
    (sourceInfo?.directories && sourceInfo.directories.length > 0) || 
    extractedPaths.length > 0
  ) && (!isExtracting);
  
  // Check if we need to extract archives first
  const hasUnextractedArchives = sourceInfo?.archives && 
    sourceInfo.archives.length > 0 && 
    (!archiveExtractions.length || 
      archiveExtractions.some(a => a.status === 'pending'));
  
  // Format sources display
  const getSourcesDisplay = () => {
    if (!sources.length) return "No sources selected";
    if (sources.length === 1) return sources[0];
    return `${sources.length} sources selected`;
  };
  
  return (
    <div className="processor-view">
      <h1>Process Google Takeout Files</h1>
      
      <div className="form-card">
        <div className="form-header">
          <h2>📁 Source Files</h2>
        </div>
        
        <div className="form-group">
          <label className="form-label">Google Takeout Files or Directories</label>
          <div className="form-row">
            <input 
              type="text" 
              className="form-input" 
              value={getSourcesDisplay()} 
              readOnly 
              placeholder="Select Google Takeout files or directories"
            />
            <button className="btn btn-secondary" onClick={handleSelectSources}>Browse</button>
          </div>
          
          {sourceInfo && (
            <div className="source-summary">
              <div className="source-count">
                {sourceInfo.directories.length > 0 && (
                  <span className="source-badge directories">
                    <span className="source-badge-icon">📁</span>
                    {sourceInfo.directories.length} {sourceInfo.directories.length === 1 ? 'directory' : 'directories'}
                  </span>
                )}
                
                {sourceInfo.archives.length > 0 && (
                  <span className="source-badge archives">
                    <span className="source-badge-icon">📦</span>
                    {sourceInfo.archives.length} {sourceInfo.archives.length === 1 ? 'archive' : 'archives'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Display the archive extraction UI if needed */}
        {sourceInfo?.archives && sourceInfo.archives.length > 0 && (
          <div className="form-group archive-section">
            {!isExtracting && !extractedPaths.length && (
              <button 
                className="btn btn-secondary btn-extract" 
                onClick={handleExtractArchives}
                disabled={isProcessing}
              >
                <span className="btn-icon">📦</span>
                Extract Archives
              </button>
            )}
            
            {archiveExtractions.length > 0 && (
              <ArchiveExtractionList 
                archives={archiveExtractions}
                isExtracting={isExtracting}
                onCancel={handleCancelExtraction}
              />
            )}
          </div>
        )}
        
        <div className="form-group">
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={useInPlace} 
                onChange={(e) => setUseInPlace(e.target.checked)} 
              />
              Modify files in place
            </label>
            <div className="checkbox-description">
              Apply changes directly to the original files instead of creating copies.
              <strong className="text-warning"> Use with caution - changes cannot be undone!</strong>
            </div>
          </div>
        </div>
        
        {!useInPlace && (
          <div className="form-group">
            <label className="form-label">Output Directory</label>
            <div className="form-row">
              <input 
                type="text" 
                className="form-input" 
                value={outputPath} 
                readOnly 
                placeholder="Select destination folder for processed files"
              />
              <button className="btn btn-secondary" onClick={handleSelectOutputDir}>Browse</button>
            </div>
          </div>
        )}
      </div>
      
      <div className="form-card">
        <div className="form-header">
          <h2>🛠️ Processing Options</h2>
        </div>
        
        <div className="form-group">
          <div className="checkbox-group">
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={fixTimestamps} 
                  onChange={(e) => setFixTimestamps(e.target.checked)} 
                />
                Fix timestamps
              </label>
              <div className="checkbox-description">
                Restore original creation dates and other time-related metadata from JSON files.
              </div>
            </div>
            
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={fixGeolocation} 
                  onChange={(e) => setFixGeolocation(e.target.checked)} 
                />
                Fix geolocation data
              </label>
              <div className="checkbox-description">
                Restore original geographic coordinates and location information from JSON files.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="form-card">
        <div className="form-header">
          <h2>📋 Output Options</h2>
        </div>
        
        <div className="form-group">
          <div className="checkbox-group">
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={maintainFolderStructure} 
                  onChange={(e) => setMaintainFolderStructure(e.target.checked)} 
                  disabled={useInPlace}
                />
                Maintain folder structure
              </label>
              <div className="checkbox-description">
                Preserve the original folder hierarchy in the output directory.
              </div>
            </div>
            
            <div className="checkbox-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={renameByDate} 
                  onChange={(e) => setRenameByDate(e.target.checked)} 
                />
                Rename files by date
              </label>
              <div className="checkbox-description">
                Rename files based on their restored timestamps (format: YYYYMMDD_HHMMSS).
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isProcessing && progress && (
        <div className={`progress-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
          <h2>Processing Files</h2>
          <ProgressBar 
            value={progress.processedFiles} 
            max={progress.totalFiles} 
            showPercentage={true}
            height={10}
            variant={progress.errors > 0 ? 'warning' : 'success'}
          />
          
          <div className="progress-file-count">
            <span>{progress.processedFiles} of {progress.totalFiles} files</span>
            
            {progress.eta !== undefined && (
              <span className="eta-indicator">
                <span className="eta-label">Time remaining:</span>
                <span className="eta-value">
                  {progress.eta > 60 
                    ? `${Math.floor(progress.eta / 60)}m ${progress.eta % 60}s` 
                    : `${progress.eta}s`}
                </span>
              </span>
            )}
          </div>
          
          <div className="progress-info">
            <p>
              <span>Current file:</span>
              <span className="current-file">{progress.currentFile}</span>
            </p>
          </div>
          
          <div className="progress-stats">
            <div className="progress-stat success">
              <div className="progress-stat-value">{progress.success}</div>
              <div className="progress-stat-label">Successful</div>
              <ProgressBar 
                value={progress.success} 
                max={progress.totalFiles} 
                height={6}
                variant="success"
                animated={false}
              />
            </div>
            <div className="progress-stat error">
              <div className="progress-stat-value">{progress.errors}</div>
              <div className="progress-stat-label">Errors</div>
              <ProgressBar 
                value={progress.errors} 
                max={progress.totalFiles} 
                height={6}
                variant="error"
                animated={false}
              />
            </div>
          </div>
          
          {progress.fileHistory && progress.fileHistory.length > 0 && (
            <div className="file-history-container">
              <FileHistoryList 
                history={progress.fileHistory} 
                maxItems={5}
              />
            </div>
          )}
          
          <div className="progress-actions">
            <button className="btn btn-cancel" onClick={handleCancel}>
              Cancel Processing
            </button>
            
            <button 
              className="btn btn-secondary btn-pause"
              onClick={() => {/* Pause functionality will be implemented later */}}
            >
              Pause
            </button>
          </div>
        </div>
      )}
      
      {results && (
        <div className={`results-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
          <h2>Processing Complete</h2>
          
          <div className="result-stats">
            <div className="result-stat">
              <div className="result-stat-value">{results.processed}</div>
              <div className="result-stat-label">Files Processed</div>
            </div>
            <div className="result-stat success">
              <div className="result-stat-value">{results.success}</div>
              <div className="result-stat-label">Successful</div>
            </div>
            <div className="result-stat error">
              <div className="result-stat-value">{results.errors}</div>
              <div className="result-stat-label">Errors</div>
            </div>
          </div>
          
          {results.errors > 0 && results?.failedFiles && results?.failedFiles?.length > 0 && (
            <div className="failed-files-container">
              <h3>Failed Files</h3>
              <p className="failed-files-message">
                {results?.failedFiles?.length} files failed to process. You can try again with just these files.
              </p>
              
              <div className="failed-files-list">
                {results?.failedFiles?.slice(0, 3).map((file: string, index: number) => (
                  <div key={index} className="failed-file-item">
                    {file.split('/').pop()}
                  </div>
                ))}
                
                {(results?.failedFiles?.length || 0) > 3 && (
                  <div className="failed-files-more">
                    + {(results?.failedFiles?.length || 0) - 3} more files
                  </div>
                )}
              </div>
              
              <button 
                className="btn btn-retry"
                onClick={() => {
                  // Implement retry functionality
                  if (results && results.jobId) {
                    window.electron.resumeProcessing(results.jobId);
                    setIsProcessing(true);
                    setResults(null);
                  }
                }}
              >
                Retry Failed Files
              </button>
            </div>
          )}
          
          {progress && progress.fileHistory && progress.fileHistory.length > 0 && (
            <div className="file-history-container">
              <FileHistoryList 
                history={progress.fileHistory} 
                maxItems={10}
              />
            </div>
          )}
        </div>
      )}
      
      <div className="form-actions">
        <button 
          className="btn btn-primary" 
          onClick={handleProcessFiles} 
          disabled={
            isProcessing || 
            isExtracting || 
            !sources.length || 
            (useInPlace === false && !outputPath)
          }
        >
          {isProcessing ? 'Processing...' : hasUnextractedArchives ? 'Extract and Process' : 'Start Processing'}
        </button>
      </div>
    </div>
  );
};

export default ProcessorView;
