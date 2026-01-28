import React, { useState, useEffect } from 'react';
import ResumeUpload from './components/ResumeUpload';
import AIAnalysisEngine from './components/AIAnalysisEngine';
import KeywordMatcher from './components/KeywordMatcher';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [resumeData, setResumeData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'analysis', 'matching', 'dashboard'
  const [theme, setTheme] = useState('dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleFileUpload = (data) => {
    setResumeData(data);
    setCurrentView('analysis');
  };

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return (
          <div className="page-content">
            <header className="page-header">
              <h1>Welcome to AI Resume Analyzer</h1>
              <p>Upload your resume to get started with advanced AI-powered insights.</p>
            </header>
            <div className="section">
              <ResumeUpload onFileUpload={handleFileUpload} />
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="page-content">
            <header className="page-header">
              <h1>AI Analysis Report</h1>
              <p>In-depth evaluation of your resume content, format, and impact.</p>
            </header>
            <div className="section">
              <AIAnalysisEngine
                resumeData={resumeData}
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        );
      case 'matching':
        return (
          <div className="page-content">
            <header className="page-header">
              <h1>Job Description Matching</h1>
              <p>Compare your resume against specific job requirements.</p>
            </header>
            <div className="section">
              <KeywordMatcher
                resumeData={resumeData}
              />
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="page-content">
            <header className="page-header">
              <h1>Career Dashboard</h1>
              <p>Your personalized improvement plan and interactive career coach.</p>
            </header>
            <div className="section">
              <Dashboard
                resumeData={resumeData}
                analysisResults={analysisResults}
              />
            </div>
          </div>
        );
      default:
        return <ResumeUpload onFileUpload={handleFileUpload} />;
    }
  };

  return (
    <div className="App wrapper">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        hasData={!!resumeData}
        toggleTheme={toggleTheme}
        theme={theme}
      />

      <main className="app-main">
        {renderCurrentView()}

        <footer className="app-footer">
          <p>© 2025 AI-Powered Resume Analyzer | Designed for Professional Excellence</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
