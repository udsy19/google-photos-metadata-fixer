import { contextBridge, ipcRenderer } from 'electron';

// Add window control functions
function sendWindowControl(action: string) {
  return () => ipcRenderer.send('window-control', action);
}

contextBridge.exposeInMainWorld('electron', {
  // Window control
  windowMinimize: sendWindowControl('minimize'),
  windowMaximize: sendWindowControl('maximize'),
  windowClose: sendWindowControl('close'),
  // File selection
  selectSources: () => ipcRenderer.invoke('select-sources'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  
  // Source checking and handling
  checkSources: (paths: string[]) => ipcRenderer.invoke('check-sources', paths),
  extractArchives: (archives: string[]) => ipcRenderer.invoke('extract-archives', archives),
  
  // Processing
  processFiles: (options: any) => ipcRenderer.invoke('process-files', options),
  resumeProcessing: (jobId?: string) => ipcRenderer.invoke('resume-processing', jobId),
  cancelProcessing: () => ipcRenderer.invoke('cancel-processing'),
  
  // Progress listeners
  onExtractionProgress: (callback: (progress: any) => void) => {
    const listener = (_: any, progress: any) => callback(progress);
    ipcRenderer.on('extraction-progress', listener);
    return () => ipcRenderer.removeListener('extraction-progress', listener);
  },
  
  onExtractionError: (callback: (error: any) => void) => {
    const listener = (_: any, error: any) => callback(error);
    ipcRenderer.on('extraction-error', listener);
    return () => ipcRenderer.removeListener('extraction-error', listener);
  },
  
  onProgress: (callback: (progress: any) => void) => {
    const listener = (_: any, progress: any) => callback(progress);
    ipcRenderer.on('processing-progress', listener);
    return () => ipcRenderer.removeListener('processing-progress', listener);
  },
});
