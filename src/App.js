import React, { useState } from 'react';
import ResumeUpload from './components/ResumeUpload';
import AIAnalysisEngine from './components/AIAnalysisEngine';
import KeywordMatcher from './components/KeywordMatcher';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [resumeData, setResumeData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'analysis', 'dashboard'

  const handleFileUpload = (data) => {
    setResumeData(data);
    setCurrentView('analysis');
  };

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
  };

  const renderCurrentView = () => {
    switch(currentView) {
      case 'upload':
        return (
          <div className="section">
            <ResumeUpload onFileUpload={handleFileUpload} />
          </div>
        );
      case 'analysis':
        return (
          <div className="section">
            <AIAnalysisEngine 
              resumeData={resumeData} 
              onAnalysisComplete={handleAnalysisComplete} 
            />
            <div className="navigation-buttons">
              <button 
                className="nav-button secondary" 
                onClick={() => setCurrentView('upload')}
              >
                Back to Upload
              </button>
              <button 
                className="nav-button primary" 
                onClick={() => setCurrentView('dashboard')}
              >
                View Dashboard
              </button>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="section">
            <Dashboard 
              resumeData={resumeData} 
              analysisResults={analysisResults} 
            />
            <div id="keyword-matcher" className="keyword-matcher-section">
              <KeywordMatcher 
                resumeData={resumeData} 
              />
            </div>
            <div className="navigation-buttons">
              <button 
                className="nav-button secondary" 
                onClick={() => setCurrentView('analysis')}
              >
                Back to Analysis
              </button>
              <button 
                className="nav-button primary" 
                onClick={() => {
                  setResumeData(null);
                  setAnalysisResults(null);
                  setCurrentView('upload');
                }}
              >
                Upload New Resume
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="section">
            <ResumeUpload onFileUpload={handleFileUpload} />
          </div>
        );
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI-Powered Resume Analyzer</h1>
        <p>Upload your resume and get AI-driven insights to improve your job applications</p>
      </header>
      
      <main className="app-main">
        {renderCurrentView()}
      </main>
      
      <footer className="app-footer">
        <p>© 2025 AI-Powered Resume Analyzer | Designed to help you land your dream job</p>
      </footer>
    </div>
  );
}

export default App;
