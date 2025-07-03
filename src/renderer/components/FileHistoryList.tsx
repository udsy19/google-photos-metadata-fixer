import React from 'react';
import FileProgressItem from './FileProgressItem';
import '../styles/FileHistoryList.css';

interface FileHistoryItem {
  file: string;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

interface FileHistoryListProps {
  history: FileHistoryItem[];
  maxItems?: number;
  emptyMessage?: string;
}

const FileHistoryList: React.FC<FileHistoryListProps> = ({ 
  history, 
  maxItems = 10,
  emptyMessage = 'No file history available'
}) => {
  // Limit displayed history to maxItems, showing the most recent first
  const limitedHistory = [...history].reverse().slice(0, maxItems);
  
  if (history.length === 0) {
    return (
      <div className="file-history-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="file-history-list">
      <div className="file-history-header">
        <h3>Recent File Activity</h3>
        <div className="file-history-count">{history.length} files</div>
      </div>
      
      <div className="file-history-items">
        {limitedHistory.map((item, index) => (
          <FileProgressItem
            key={`${item.file}-${item.timestamp}`}
            fileName={item.file}
            progress={item.status === 'pending' ? 0.5 : 1}
            status={item.status}
            message={item.error}
            timestamp={item.timestamp}
            animate={index === 0} // Only animate the most recent item
          />
        ))}
        
        {history.length > maxItems && (
          <div className="file-history-more">
            +{history.length - maxItems} more files
          </div>
        )}
      </div>
    </div>
  );
};

export default FileHistoryList;