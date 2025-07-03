import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/TitleBar.css';

const TitleBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isMac, setIsMac] = useState(false);
  
  useEffect(() => {
    // Check if running on macOS
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setIsMac(true);
    }
  }, []);
  
  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="app-logo">
          <div className="logo-icon">📷</div>
        </div>
        <div className="app-title">Google Photos Metadata Fixer</div>
      </div>
      <div className="title-bar-controls">
        <button 
          className="theme-toggle-button" 
          onClick={toggleTheme} 
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        {!isMac && (
          <div className="window-controls">
            <button 
              className="window-control minimize"
              onClick={() => window.electron.windowMinimize()}
            >
              <span className="sr-only">Minimize</span>
            </button>
            <button 
              className="window-control maximize"
              onClick={() => window.electron.windowMaximize()}
            >
              <span className="sr-only">Maximize</span>
            </button>
            <button 
              className="window-control close"
              onClick={() => window.electron.windowClose()}
            >
              <span className="sr-only">Close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TitleBar;
