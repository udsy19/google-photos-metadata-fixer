import React, { useState, useEffect } from 'react';
import FileProgressItem from './FileProgressItem';
import '../styles/ArchiveExtractionList.css';

interface ExtractionStatus {
  file: string;
  progress: number;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

interface ArchiveExtractionListProps {
  archives: ExtractionStatus[];
  isExtracting: boolean;
  onCancel: () => void;
}

const ArchiveExtractionList: React.FC<ArchiveExtractionListProps> = ({ 
  archives, 
  isExtracting,
  onCancel
}) => {
  const [pulsing, setPulsing] = useState<boolean>(false);
  const completedCount = archives.filter(a => a.status !== 'pending').length;
  const hasErrors = archives.some(a => a.status === 'error');
  
  const totalProgress = archives.length > 0
    ? archives.reduce((acc, curr) => acc + curr.progress, 0) / archives.length
    : 0;
  
  // Add pulsing effect when progress appears stuck
  useEffect(() => {
    if (!isExtracting) {
      setPulsing(false);
      return;
    }
    
    // If progress is slow or uncertain (like when totalFiles is null),
    // add a pulsing effect to show that extraction is still working
    const hasMissingTotal = archives.some(a => 
      a.status === 'pending' && a.message?.includes('Analyzing')
    );
    
    if (hasMissingTotal || archives.some(a => a.progress < 0.05 && a.status === 'pending')) {
      setPulsing(true);
    } else {
      setPulsing(false);
    }
  }, [archives, isExtracting]);
  
  return (
    <div className="archive-extraction-list">
      <div className="extraction-header">
        <h3>
          {isExtracting 
            ? 'Extracting Archives...' 
            : completedCount === archives.length 
              ? 'Extraction Complete' 
              : 'Archive Extraction'
          }
        </h3>
        {isExtracting && (
          <button 
            className="btn btn-outline-danger btn-sm" 
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="extraction-progress-summary">
        <div className="extraction-progress-bar-container">
          <div 
            className={`extraction-progress-bar-fill ${pulsing ? 'pulsing' : ''}`}
            style={{ width: `${Math.round(totalProgress * 100)}%` }}
          />
        </div>
        <div className="extraction-stats">
          <div>{completedCount} of {archives.length} complete</div>
          <div>{Math.round(totalProgress * 100)}%</div>
        </div>
      </div>
      
      <div className="archive-list">
        {archives.map((archive) => (
          <FileProgressItem
            key={archive.file}
            fileName={archive.file}
            progress={archive.progress}
            status={archive.status}
            message={archive.message}
          />
        ))}
      </div>
      
      {archives.length > 0 && !isExtracting && (
        <div className={`extraction-summary ${hasErrors ? 'has-errors' : ''}`}>
          {hasErrors ? (
            <div className="extraction-error-message">
              Some archives failed to extract. You can continue with the successfully extracted files or try again.
            </div>
          ) : completedCount === archives.length ? (
            <div className="extraction-success-message">
              All archives successfully extracted and ready for processing!
            </div>
          ) : (
            <div className="extraction-pending-message">
              Extraction paused. Click &quot;Extract Archives&quot; to continue.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ArchiveExtractionList;