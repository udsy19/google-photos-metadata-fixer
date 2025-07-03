import React from 'react';
import '../styles/ProgressBar.css';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressBarProps {
  value: number;
  max: number;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  height?: number;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max,
  showPercentage = false,
  variant = 'default',
  height = 8,
  animated = true
}) => {
  const { theme } = useTheme();
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  
  // Avoid division by zero
  const safePercentage = max === 0 ? 0 : percentage;
  
  return (
    <div className={`progress-bar-wrapper ${showPercentage ? 'with-percentage' : ''}`}>
      <div 
        className={`progress-bar-container ${theme === 'dark' ? 'dark-theme' : ''}`}
        style={{ height: `${height}px` }}
      >
        <div 
          className={`progress-bar-fill ${variant} ${animated ? 'animated' : ''}`}
          style={{ width: `${safePercentage}%` }} 
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      
      {showPercentage && (
        <div className="progress-percentage">
          {safePercentage}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
