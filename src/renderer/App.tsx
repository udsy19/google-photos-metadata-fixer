import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import './styles/App.css';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('processor');
  
  return (
    <ThemeProvider>
      <div className="app">
        <TitleBar />
        <div className="app-container">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <MainContent activeView={activeView} />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
