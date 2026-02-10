import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ResumeUpload from './components/ResumeUpload';
import AIAnalysisEngine from './components/AIAnalysisEngine';
import KeywordMatcher from './components/KeywordMatcher';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { FaFingerprint, FaShieldAlt, FaRocket, FaBullseye, FaBars } from 'react-icons/fa';
import './App.css';

function App() {
  const [resumeData, setResumeData] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleFileUpload = (data) => {
    setResumeData(data);
    setAnalysisResults(null); // Reset results for new upload
    setCurrentView('analysis');
    setIsSidebarOpen(false);
  };

  const handleAnalysisComplete = React.useCallback((results) => {
    setAnalysisResults(results);
    // User remains on analysis view to see report
  }, []);

  const viewMetadata = {
    upload: { icon: <FaFingerprint />, title: 'Intelligence Intake', sub: 'Synchronize your professional DNA with Gemini 2.0 Flash.' },
    analysis: { icon: <FaShieldAlt />, title: 'Architectural Audit', sub: 'Deep evaluation of impact factor, stack relevance, and ATS readiness.' },
    matching: { icon: <FaBullseye />, title: 'Semantic Alignment', sub: 'Cross-referencing your profile against machine-readable requirements.' },
    dashboard: { icon: <FaRocket />, title: 'Command Center', sub: 'Visualizing your professional trajectory and optimization roadmap.' }
  };

  const renderContent = () => {
    const meta = viewMetadata[currentView] || viewMetadata.upload;

    return (
      <div className="page-content animate-in">
        <header className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="view-indicator">
              {meta.icon} SYSTEM: {currentView.toUpperCase()}
            </div>
            <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(true)}>
              <FaBars />
            </button>
          </div>
          <h1 className="text-gradient">{meta.title}</h1>
          <p>{meta.sub}</p>
        </header>

        <div className="section">
          {currentView === 'upload' && <ResumeUpload onFileUpload={handleFileUpload} />}
          {currentView === 'analysis' && (
            <AIAnalysisEngine
              resumeData={resumeData}
              analysisResults={analysisResults}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
          {currentView === 'matching' && <KeywordMatcher resumeData={resumeData} />}
          {currentView === 'dashboard' && <Dashboard resumeData={resumeData} analysisResults={analysisResults} />}
        </div>
      </div>
    );
  };

  return (
    <div className="App-wrapper">
      <Sidebar
        currentView={currentView}
        setCurrentView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false);
        }}
        hasData={!!resumeData}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      <main className="app-main">
        {renderContent()}

        <footer className="app-footer">
          <p>PROPRIETARY INTELLIGENCE SYSTEM • v2.0.0 • POWERED BY GEMINI 2.0 FLASH</p>
        </footer>
      </main>
      <Analytics />
    </div>
  );
}

export default App;
