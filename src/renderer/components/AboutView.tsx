import React from 'react';
import '../styles/AboutView.css';

const AboutView: React.FC = () => {
  return (
    <div className="about-view">
      <h1>About</h1>
      
      <div className="about-card">
        <div className="about-card-hero">
          <div className="app-logo-large">📷</div>
          <div className="app-info">
            <div className="app-name">Google Photos Metadata Fixer</div>
            <div className="app-description">
              A powerful tool designed to restore accurate metadata to files exported through Google Takeout
            </div>
            <div className="app-version">Version 0.1.0</div>
          </div>
        </div>
        
        <div className="about-section">
          <h2>🔎 Overview</h2>
          <p>
            Google Photos Metadata Fixer is a desktop application designed to restore accurate 
            metadata to files exported through Google Takeout. When exporting your photos and 
            videos from Google Photos, important metadata like creation dates and geolocation 
            can be corrupted or lost. This tool fixes those issues by extracting information 
            from the JSON sidecar files that Google Takeout provides.
          </p>
          <p>
            The application is built with performance and ease of use in mind, allowing you to process 
            thousands of files at once while maintaining full control over how your files are modified.
          </p>
        </div>
        
        <div className="about-section">
          <h2>✨ Key Features</h2>
          <ul>
            <li>Batch process entire Google Takeout archives with a single click</li>
            <li>Fix incorrect creation dates and timestamps from JSON metadata</li>
            <li>Restore original geolocation data for your photos</li>
            <li>Preserve and repair EXIF/IPTC/XMP metadata</li>
            <li>Choose multiple export options with in-place editing or to new locations</li>
            <li>Modern interface with light and dark theme support</li>
          </ul>
        </div>
        
        <div className="about-section">
          <h2>🔒 Privacy</h2>
          <p>
            Google Photos Metadata Fixer operates entirely on your local machine. 
            Your photos and their metadata are never uploaded to external servers, 
            and the application does not collect any telemetry or personal information.
          </p>
          <p>
            All processing is done offline, ensuring your personal media stays private.
          </p>
        </div>
        
        <div className="about-footer">
          <a href="#" className="project-link">📖 Documentation</a>
          <div className="license-badge">MIT License</div>
        </div>
      </div>
      
      <div className="about-card">
        <div className="about-section">
          <h2>🛠️ Technical Details</h2>
          <p>
            Google Photos Metadata Fixer is built with modern web technologies wrapped in a 
            desktop application framework. The core components include:
          </p>
          <ul>
            <li>Electron for cross-platform desktop capabilities</li>
            <li>React and TypeScript for a responsive, type-safe user interface</li>
            <li>ExifTool integration for professional-grade metadata handling</li>
            <li>JSON parsing for Google metadata sidecar files</li>
          </ul>
        </div>
        
        <div className="about-section">
          <h2>💡 How It Works</h2>
          <p>
            When you export your data from Google Photos using Google Takeout, each media file 
            comes with a corresponding JSON file that contains the original metadata. This application 
            reads those JSON files, extracts the relevant metadata, and applies it to your media 
            files using industry-standard tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
