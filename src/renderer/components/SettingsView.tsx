import React, { useState } from 'react';
import '../styles/SettingsView.css';

const SettingsView: React.FC = () => {
  const [parallelTasks, setParallelTasks] = useState<number>(4);
  const [backupOriginals, setBackupOriginals] = useState<boolean>(false);
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  const [debugLogs, setDebugLogs] = useState<boolean>(false);
  
  const handleParallelTasksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= 16) {
      setParallelTasks(value);
    }
  };
  
  return (
    <div className="settings-view">
      <h1>Settings</h1>
      
      <div className="settings-card">
        <div className="settings-header">
          <h2>⚡ Performance</h2>
        </div>
        
        <div className="settings-section">
          <div className="slider-container">
            <div className="slider-top">
              <span className="slider-label">Parallel Processing Tasks</span>
              <span className="slider-value">{parallelTasks}</span>
            </div>
            
            <input 
              type="range" 
              min="1" 
              max="16" 
              value={parallelTasks} 
              onChange={handleParallelTasksChange} 
              className="slider"
            />
            
            <div className="slider-marks">
              <div className="slider-mark">
                <span className="slider-mark-label">1</span>
              </div>
              <div className="slider-mark">
                <span className="slider-mark-label">4</span>
              </div>
              <div className="slider-mark">
                <span className="slider-mark-label">8</span>
              </div>
              <div className="slider-mark">
                <span className="slider-mark-label">12</span>
              </div>
              <div className="slider-mark">
                <span className="slider-mark-label">16</span>
              </div>
            </div>
            
            <p className="help-text">
              Controls how many files can be processed simultaneously. Higher values may 
              improve speed but will use more system resources. For most computers, 
              a value between 4-8 provides the best balance.
            </p>
          </div>
        </div>
      </div>
      
      <div className="settings-card">
        <div className="settings-header">
          <h2>🛠️ Advanced Options</h2>
        </div>
        
        <div className="settings-section">
          <div className="option-group">
            <div className="option-row">
              <div className="option-label">
                <div className="option-title">Backup Original Files</div>
                <div className="option-description">
                  Create a backup copy of original files before modifying them
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={backupOriginals}
                  onChange={(e) => setBackupOriginals(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="option-row">
              <div className="option-label">
                <div className="option-title">Skip Existing Files</div>
                <div className="option-description">
                  Skip files that already have valid metadata
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="option-row">
              <div className="option-label">
                <div className="option-title">Debug Logging</div>
                <div className="option-description">
                  Include detailed logs for troubleshooting
                </div>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={debugLogs}
                  onChange={(e) => setDebugLogs(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-card">
        <div className="settings-header">
          <h2>💾 Data Management</h2>
        </div>
        
        <div className="settings-section">
          <div className="option-group">
            <div className="option-row">
              <div className="option-label">
                <div className="option-title">Clear Application Cache</div>
                <div className="option-description">
                  Remove temporary files and cached data (does not affect your photos)
                </div>
              </div>
              <button className="btn btn-secondary">Clear Cache</button>
            </div>
            
            <div className="option-row">
              <div className="option-label">
                <div className="option-title">Reset All Settings</div>
                <div className="option-description">
                  Restore all settings to their default values
                </div>
              </div>
              <button className="btn btn-secondary">Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
