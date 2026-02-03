import React, { useState } from 'react';
import { FaChartPie, FaListAlt, FaLightbulb, FaHistory, FaCheckCircle, FaExclamationTriangle, FaDownload, FaSearch, FaRocket, FaBullseye, FaArrowRight, FaClock, FaDraftingCompass } from 'react-icons/fa';
import ChatbotContainer from './Chatbot/ChatbotContainer';
import ExportModal from './ExportModal';
import './Dashboard.css';

const Dashboard = ({ resumeData, analysisResults }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);

  const getProgressStatus = () => {
    if (!analysisResults) return 'Upload and analyze your resume to see progress';

    const score = analysisResults.overallScore;
    if (score >= 85) return 'Excellent - Your resume is highly competitive!';
    if (score >= 70) return 'Good - Your resume is competitive with minor improvements needed';
    if (score >= 55) return 'Average - Consider making several improvements to strengthen your resume';
    return 'Needs Work - Significant improvements needed to make your resume competitive';
  };

  const getImprovementPriority = () => {
    if (!analysisResults) return [];

    const areas = [
      { name: 'Content Quality', score: analysisResults.contentScore, icon: <FaListAlt /> },
      { name: 'Formatting Accuracy', score: analysisResults.formattingScore, icon: <FaDraftingCompass /> },
      { name: 'Job Relevance', score: analysisResults.relevanceScore, icon: <FaBullseye /> }
    ];

    return areas.sort((a, b) => a.score - b.score);
  };

  const exportResults = () => {
    setShowExportModal(true);
  };

  return (
    <div className="dashboard-container">
      <h2>Professional Career Dashboard</h2>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartPie /> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <FaListAlt /> Detailed Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'improvements' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvements')}
        >
          <FaLightbulb /> Improvement Plan
        </button>
        <button
          className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          <FaHistory /> Tracking
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {analysisResults ? (
              <>
                <div className="summary-cards">
                  <div className="summary-card primary">
                    <div className="summary-icon"><FaRocket /></div>
                    <h3>Execution Score</h3>
                    <div className="score-display">{analysisResults.overallScore}/100</div>
                    <p>{getProgressStatus()}</p>
                  </div>

                  <div className="summary-card contact-brief">
                    <h3>Professional Identity</h3>
                    <div className="contact-info-list">
                      <div className="contact-item"><strong>Name:</strong> {resumeData.extractedData.name || 'Not Detected'}</div>
                      <div className="contact-item"><strong>Email:</strong> {resumeData.extractedData.email || 'Not Detected'}</div>
                      <div className="contact-item"><strong>Phone:</strong> {resumeData.extractedData.phone || 'Not Detected'}</div>
                      <div className="contact-item"><strong>Loc:</strong> {resumeData.extractedData.address || 'Not Detected'}</div>
                    </div>
                  </div>

                  <div className="summary-card mobility-fit">
                    <h3>Target Alignment</h3>
                    <div className="role-fit">
                      <span className="fit-value">{analysisResults.personalization.targetRoleFit}</span>
                    </div>
                    <p>Alignment with {analysisResults.industrySpecific?.targetRole || 'Software Engineering'} standards</p>
                  </div>
                </div>

                <div className="breakdown-section">
                  <h3>Precision Metrics (ATS Standards)</h3>
                  <div className="score-breakdown">
                    <div className="breakdown-item">
                      <span>ATS Compatibility (30%)</span>
                      <div className="breakdown-bar">
                        <div className="ats-fill" style={{ width: `${(analysisResults.scores?.ats / 30) * 100}%` }}></div>
                        <span className="breakdown-percent">{analysisResults.scores?.ats}/30</span>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <span>Keyword Alignment (30%)</span>
                      <div className="breakdown-bar">
                        <div className="keyword-fill" style={{ width: `${(analysisResults.scores?.keyword / 30) * 100}%` }}></div>
                        <span className="breakdown-percent">{analysisResults.scores?.keyword}/30</span>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <span>Content Authority (20%)</span>
                      <div className="breakdown-bar">
                        <div className="content-fill" style={{ width: `${(analysisResults.scores?.content / 20) * 100}%` }}></div>
                        <span className="breakdown-percent">{analysisResults.scores?.content}/20</span>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <span>Role Relevance (20%)</span>
                      <div className="breakdown-bar">
                        <div className="relevance-fill" style={{ width: `${(analysisResults.scores?.relevance / 20) * 100}%` }}></div>
                        <span className="breakdown-percent">{analysisResults.scores?.relevance}/20</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="quick-actions">
                  <div className="action-buttons">
                    <button className="action-btn primary" onClick={exportResults}>
                      <FaDownload /> Download Report
                    </button>
                    <button className="action-btn secondary" onClick={() => alert('Navigate to JD Matching via sidebar')}>
                      <FaSearch /> Compare with JD
                    </button>
                  </div>
                </div>

                <div className="chatbot-section">
                  <h3>AI Career Coach</h3>
                  <ChatbotContainer resumeData={resumeData} analysisResults={analysisResults} />
                </div>
              </>
            ) : (
              <div className="no-analysis-placeholder">
                <FaExclamationTriangle className="placeholder-icon" />
                <h3>No Data Points Detected</h3>
                <p>Complete your first analysis to populate your career dashboard.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            {analysisResults ? (
              <div className="details-grid">
                <div className="details-section">
                  <h3><FaCheckCircle className="icon-success" /> Competitive Advantages</h3>
                  <ul className="details-list">
                    {analysisResults.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="details-section">
                  <h3><FaExclamationTriangle className="icon-warning" /> Critical Knowledge Gaps</h3>
                  <ul className="details-list">
                    {analysisResults.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="improvements-tab">
            {analysisResults ? (
              <div className="action-plan">
                <h3><FaRocket className="icon-rocket" /> Recommended Action Plan</h3>
                <div className="suggestion-cards-grid">
                  {analysisResults.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card-premium">
                      <div className="suggestion-number">{index + 1}</div>
                      <div className="suggestion-body">
                        <h4>Strategic Update</h4>
                        <p>{suggestion}</p>
                        <div className="priority-tag">High Priority</div>
                      </div>
                    </div>
                  ))}
                  {analysisResults.suggestions.length === 0 && (
                    <div className="no-suggestions">
                      <FaCheckCircle /> Your resume is already in excellent shape! No major updates required.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="tracking-tab">
            <h3>Milestone Progress</h3>
            <div className="milestone-list">
              <div className="milestone-item completed">
                <div className="milestone-icon"><FaCheckCircle /></div>
                <div className="milestone-text">
                  <h5>Resume Analyzed</h5>
                  <p>System successfully processed document structure.</p>
                </div>
              </div>
              <div className="milestone-item completed">
                <div className="milestone-icon"><FaCheckCircle /></div>
                <div className="milestone-text">
                  <h5>AI Insights Generated</h5>
                  <p>Extracted semantic meaning and industry score.</p>
                </div>
              </div>
              <div className="milestone-item">
                <div className="milestone-icon"><FaClock /></div>
                <div className="milestone-text">
                  <h5>Feedback Implementation</h5>
                  <p>Pending user updates to document content.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        resumeData={resumeData}
        analysisResults={analysisResults}
      />
    </div>
  );
};

export default Dashboard;