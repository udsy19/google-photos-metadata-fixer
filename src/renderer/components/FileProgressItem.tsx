import React from 'react';
import '../styles/FileProgressItem.css';
import { useTheme } from '../contexts/ThemeContext';

interface FileProgressItemProps {
  fileName: string;
  progress: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
  timestamp?: number;
  animate?: boolean;
}

const FileProgressItem: React.FC<FileProgressItemProps> = ({ 
  fileName, 
  progress, 
  status,
  message,
  timestamp,
  animate = true
}) => {
  const { theme } = useTheme();
  const progressPercent = Math.min(Math.round(progress * 100), 100);
  
  // Format timestamp if provided
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return null;
    }
  };
  
  return (
    <div className={`file-progress-item ${status} ${animate ? 'animate' : ''} ${theme === 'dark' ? 'dark-theme' : ''}`}>
      <div className="file-progress-info">
        <div className="file-name" title={fileName}>
          {fileName}
          {formattedTime && (
            <span className="file-timestamp">{formattedTime}</span>
          )}
        </div>
        {message && <div className="file-message">{message}</div>}
      </div>
      
      <div className="file-progress-bar-container">
        <div 
          className={`file-progress-bar-fill ${animate ? 'animated' : ''}`} 
          style={{ width: `${progressPercent}%` }}
        >
          {status === 'pending' && animate && <div className="file-progress-pulse"></div>}
        </div>
      </div>
      
      <div className="file-progress-status">
        {status === 'pending' ? (
          <div className="file-progress-percent">{progressPercent}%</div>
        ) : (
          <div className={`file-status-icon ${status}`}>
            {getStatusIcon()}
            {status === 'error' && message && (
              <span className="error-tooltip" title={message}>ℹ</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileProgressItem;