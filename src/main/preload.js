const { contextBridge, ipcRenderer } = require('electron');

// Add window control functions
function sendWindowControl(action) {
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
  checkSources: (paths) => ipcRenderer.invoke('check-sources', paths),
  extractArchives: (archives) => ipcRenderer.invoke('extract-archives', archives),
  
  // Processing
  processFiles: (options) => ipcRenderer.invoke('process-files', options),
  resumeProcessing: (jobId) => ipcRenderer.invoke('resume-processing', jobId),
  cancelProcessing: () => ipcRenderer.invoke('cancel-processing'),
  
  // Progress listeners
  onExtractionProgress: (callback) => {
    const listener = (_, progress) => callback(progress);
    ipcRenderer.on('extraction-progress', listener);
    return () => ipcRenderer.removeListener('extraction-progress', listener);
  },
  
  onExtractionError: (callback) => {
    const listener = (_, error) => callback(error);
    ipcRenderer.on('extraction-error', listener);
    return () => ipcRenderer.removeListener('extraction-error', listener);
  },
  
  onProgress: (callback) => {
    const listener = (_, progress) => callback(progress);
    ipcRenderer.on('processing-progress', listener);
    return () => ipcRenderer.removeListener('processing-progress', listener);
  },
});