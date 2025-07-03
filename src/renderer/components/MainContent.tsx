import React from 'react';
import ProcessorView from './ProcessorView';
import SettingsView from './SettingsView';
import AboutView from './AboutView';
import '../styles/MainContent.css';

interface MainContentProps {
  activeView: string;
}

const MainContent: React.FC<MainContentProps> = ({ activeView }) => {
  const renderView = () => {
    switch (activeView) {
      case 'processor':
        return <ProcessorView />;
      case 'settings':
        return <SettingsView />;
      case 'about':
        return <AboutView />;
      default:
        return <ProcessorView />;
    }
  };
  
  return (
    <div className="main-content">
      {renderView()}
    </div>
  );
};

export default MainContent;
