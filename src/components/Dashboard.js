import React, { useState } from 'react';
import {
  FaChartLine, FaBrain, FaRocket, FaShieldAlt,
  FaCheckCircle, FaExclamationCircle, FaBolt,
  FaDownload, FaLayerGroup, FaMagic, FaTimes
} from 'react-icons/fa';
import ChatbotContainer from './Chatbot/ChatbotContainer';
import ExportModal from './ExportModal';
import './Dashboard.css';

const Dashboard = ({ resumeData, analysisResults }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState(null);

  if (!analysisResults) {
    return (
      <div className="modern-card animate-in" style={{ padding: '4rem', textAlign: 'center' }}>
        <FaBrain style={{ fontSize: '4rem', color: 'var(--zinc-800)', marginBottom: '1.5rem' }} />
        <h2 className="text-gradient">Ready for Deep Analysis</h2>
        <p className="subtext">Upload your professional profile to generate high-fidelity career insights.</p>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="animate-in">
      <div className="stats-grid">
        <div className="modern-card stat-card featured">
          <span className="stat-label">Execution Score</span>
          <div className="hero-score">
            {analysisResults?.overallScore || 0}<span>/100</span>
          </div>
          <div className="subtext">
            {(analysisResults?.overallScore || 0) > 80 ? 'Exceptional Performance' : 'Growth Potential Identified'}
          </div>
        </div>

        <div className="modern-card stat-card">
          <span className="stat-label">Role Precision</span>
          <div className="hero-score" style={{ color: 'var(--text-main)', fontSize: '2.5rem' }}>
            {(() => {
              const rawFit = analysisResults?.personalization?.targetRoleFit || analysisResults?.targetRoleFit || 'High';
              const fit = String(rawFit);

              // If it's short enough, display it
              if (fit.length <= 15) return fit;

              // If it's long, try to extract the rating keyword
              const lowerFit = fit.toLowerCase();
              if (lowerFit.includes('high') || lowerFit.includes('strong') || lowerFit.includes('excellent') || lowerFit.includes('perfect')) return 'High';
              if (lowerFit.includes('medium') || lowerFit.includes('average') || lowerFit.includes('moderate') || lowerFit.includes('good')) return 'Medium';
              if (lowerFit.includes('low') || lowerFit.includes('poor') || lowerFit.includes('weak') || lowerFit.includes('gap')) return 'Low';

              // Fallback if no keyword found
              return 'Moderate';
            })()}
          </div>
          <p className="subtext">Alignment with Market Standards</p>
        </div>

        <div className="modern-card stat-card">
          <span className="stat-label">Identity Verified</span>
          <div className="contact-info-list" style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}><strong>{resumeData.extractedData.name}</strong></p>
            <p className="subtext" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{resumeData.extractedData.email}</p>
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            onClick={() => setShowExportModal(true)}
          >
            <FaDownload /> Export Intelligence
          </button>
        </div>
      </div>

      <div className="main-dashboard-grid">
        <div className="modern-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaChartLine color="var(--primary)" /> Technical Authority Breakdown
          </h3>
          <div className="metrics-list">
            {[
              { label: 'ATS Parsing Readiness', val: analysisResults.scores?.ats || 0, max: 30 },
              { label: 'Industry Keyword Density', val: analysisResults.scores?.keyword || 0, max: 30 },
              { label: 'Impact Factor', val: analysisResults.scores?.content || 0, max: 20 },
              { label: 'Contextual Relevance', val: analysisResults.scores?.relevance || 0, max: 20 }
            ].map((m, i) => (
              <div key={i} className="metric-row">
                <div className="metric-header">
                  <span className="metric-name">{m.label}</span>
                  <span className="metric-val">{m.val || 0}/{m.max}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-thumb" style={{ width: `${Math.min(((m.val || 0) / m.max) * 100, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modern-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaLayerGroup color="var(--primary)" /> Strategic Insights
          </h3>
          <div className="insights-group">
            <div className="insight-item">
              <FaShieldAlt className="insight-icon" />
              <div className="insight-content">
                <h4>Core Strength</h4>
                <p>{analysisResults?.strengths?.[0] || 'Strategic Professional Profile'}</p>
              </div>
            </div>
            <div className="insight-item">
              <FaBolt className="insight-icon" />
              <div className="insight-content">
                <h4>Primary Objective</h4>
                <p>{(analysisResults?.improvements?.[0]?.action || analysisResults?.suggestions?.[0]) || 'Enhance your resume with quantifiable achievements'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="modern-card coach-preview">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 className="text-gradient" style={{ fontSize: '1.5rem' }}>AI Career Strategy Coach</h3>
            <p className="subtext">Hyper-personalized advice based on your extracted professional DNA.</p>
          </div>
          <FaMagic style={{ fontSize: '2rem', color: 'var(--primary)', opacity: 0.5 }} />
        </div>
        <ChatbotContainer resumeData={resumeData} analysisResults={analysisResults} />
      </div>
    </div>
  );


  const renderResumeData = () => (
    <div className="animate-in">
      <div className="modern-card" style={{ padding: '2rem' }}>
        <h2 className="text-gradient" style={{ marginBottom: '2rem' }}>Professional DNA</h2>

        {/* Skills */}
        <div className="resume-section">
          <h3>Technical Arsenal</h3>
          <div className="skill-tags">
            {resumeData.extractedData.skills?.technical?.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            )) || <p className="subtext">No technical skills detected</p>}
          </div>
        </div>

        {/* Experience */}
        <div className="resume-section" style={{ marginTop: '2rem' }}>
          <h3>Career Trajectory</h3>
          <div className="timeline">
            {resumeData.extractedData.experience?.map((exp, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>{exp.position} <span className="at-separator">@</span> {exp.company}</h4>
                  <p className="timeline-date">{exp.duration}</p>
                  <ul className="timeline-responsibilities">
                    {exp.responsibilities?.map((res, j) => <li key={j}>{res}</li>)}
                  </ul>
                </div>
              </div>
            )) || <p className="subtext">No experience detected</p>}
          </div>
        </div>

        {/* Education */}
        <div className="resume-section" style={{ marginTop: '2rem' }}>
          <h3>Academic Foundation</h3>
          <div className="education-grid">
            {resumeData.extractedData.education?.map((edu, i) => (
              <div key={i} className="edu-card">
                <h4>{edu.institution}</h4>
                <p className="edu-degree">{edu.degree}</p>
                <p className="edu-date">{edu.dates}</p>
              </div>
            )) || <p className="subtext">No education detected</p>}
          </div>
        </div>

        {/* Projects */}
        <div className="resume-section" style={{ marginTop: '2rem' }}>
          <h3>Key Projects</h3>
          <div className="education-grid">
            {resumeData.extractedData.projects?.map((proj, i) => (
              <div key={i} className="edu-card">
                <h4>{proj.name}</h4>
                <p className="edu-date" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>{proj.description}</p>
              </div>
            )) || <p className="subtext">No projects detected</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderImprovements = () => (
    <div className="animate-in">
      <div className="modern-card" style={{ padding: '3rem' }}>
        <h2 className="text-gradient" style={{ marginBottom: '2rem' }}>Actionable Roadmap</h2>
        <div className="insights-group" style={{ gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {(analysisResults.improvements || analysisResults.suggestions || []).map((item, i) => (
            <div
              key={i}
              className="insight-item clickable-card"
              style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--card-border)' }}
              onClick={() => typeof item === 'object' ? setSelectedImprovement(item) : null}
            >
              <div className="hero-score" style={{ fontSize: '2rem', minWidth: '3rem', color: 'var(--primary)' }}>0{i + 1}</div>
              <div className="insight-content">
                <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  {typeof item === 'object' ? item.action : 'Strategic Update'}
                </h4>
                {typeof item === 'object' && item.priority && (
                  <span className={`priority-badge ${item.priority.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: 'var(--card-border)', color: 'var(--text-main)', marginLeft: '0.5rem' }}>
                    {item.priority}
                  </span>
                )}
                <p style={{ fontSize: '1.05rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  {typeof item === 'object' ? 'Click for implementation details...' : item}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <div className="dashboard-title-group">
          <h1 className="text-gradient">Intelligence Overview</h1>
          <p className="subtext">Synchronized Career Analysis • Gemini 2.0 Flash</p>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaRocket /> Strategic Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FaLayerGroup /> Parsed Data
          </button>
          <button
            className={`tab-button ${activeTab === 'improvements' ? 'active' : ''}`}
            onClick={() => setActiveTab('improvements')}
          >
            <FaMagic /> Optimization Roadmap
          </button>
        </div>
      </div>

      <div className="dashboard-body">
        {activeTab === 'overview' && analysisResults && renderOverview()}
        {activeTab === 'resume' && resumeData && renderResumeData()}
        {activeTab === 'improvements' && analysisResults && renderImprovements()}
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        resumeData={resumeData}
        analysisResults={analysisResults}
      />

      {/* Improvement Modal */}
      {selectedImprovement && (
        <div className="roadmap-modal-overlay" onClick={() => setSelectedImprovement(null)}>
          <div className="roadmap-modal-content" onClick={e => e.stopPropagation()}>
            <div className="roadmap-modal-header">
              <span className="badge-priority" style={{
                background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold'
              }}>
                {selectedImprovement.priority} Priority
              </span>
              <button className="roadmap-modal-close" onClick={() => setSelectedImprovement(null)}>
                <FaTimes />
              </button>
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontSize: '1.5rem' }}>
              {selectedImprovement.action}
            </h3>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <FaBolt /> Implementation Steps:
              </h4>
              <ul className="improvement-detail-list">
                {selectedImprovement.details?.map((step, i) => (
                  <li key={i}>{step}</li>
                )) || <li>Detailed steps will appear here after specialized analysis.</li>}
              </ul>
            </div>

            <div className="modal-footer" style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setSelectedImprovement(null)}>Close Action Plan</button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default Dashboard;
