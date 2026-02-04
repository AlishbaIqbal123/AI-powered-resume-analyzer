import React, { useState, useEffect, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaDraftingCompass, FaChartLine, FaSearch, FaUserTie } from 'react-icons/fa';
import { analyzeResume } from '../services/resumeParser';
import './AIAnalysisEngine.css';

const AIAnalysisEngine = ({ resumeData, analysisResults: propAnalysisResults, onAnalysisComplete }) => {
  const [localAnalysisResults, setLocalAnalysisResults] = useState(propAnalysisResults);
  const [isLoading, setIsLoading] = useState(!propAnalysisResults);
  const [error, setError] = useState(null);
  const [overallScore, setOverallScore] = useState(propAnalysisResults?.overallScore || 0);
  const [selectedImprovement, setSelectedImprovement] = useState(null);
  const [selectedStrength, setSelectedStrength] = useState(null);
  const [selectedWeakness, setSelectedWeakness] = useState(null);

  const performAnalysis = useCallback(async () => {
    // If we already have results (from props or local), don't re-run
    if (localAnalysisResults || propAnalysisResults) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await analyzeResume(resumeData);
      setLocalAnalysisResults(analysis);
      setOverallScore(analysis.overallScore);

      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (err) {
      console.error('Error performing analysis:', err);
      setError(err.message || 'The AI service is currently overwhelmed. Please try again in a few seconds.');
    } finally {
      setIsLoading(false);
    }
  }, [resumeData, onAnalysisComplete, localAnalysisResults, propAnalysisResults]);

  useEffect(() => {
    if (resumeData && !localAnalysisResults && !propAnalysisResults) {
      performAnalysis();
    }
  }, [resumeData, performAnalysis, localAnalysisResults, propAnalysisResults]);

  // Sync prop results to local state if they change externally
  useEffect(() => {
    if (propAnalysisResults) {
      setLocalAnalysisResults(propAnalysisResults);
      // Calculate dynamic market score based on component scores
      const scores = propAnalysisResults.scores || {};
      const calculatedScore = Math.round(
        ((scores.ats || 0) + (scores.keyword || 0) + (scores.content || 0) + (scores.relevance || 0)) / 100 * 100
      );
      setOverallScore(calculatedScore);
      setIsLoading(false);
    }
  }, [propAnalysisResults]);

  const displayResults = localAnalysisResults || propAnalysisResults;

  return (
    <div className="ai-analysis-page-wrapper fade-in" key={resumeData?.fileName}>
      <div className="analysis-status-header">
        <h2>{isLoading ? 'Processing Neural Insights...' : 'AI Career Strategy Report'}</h2>
        <p>Advanced algorithmic evaluation of your professional trajectory.</p>
      </div>

      <div className={`analysis-main-container ${isLoading ? 'is-loading' : 'is-ready'}`}>
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-spinner-large"></div>
              <h3>Analyzing Professional DNA...</h3>
              <div className="loading-steps">
                <div className="step-tag"><FaSearch /> Scrutinizing Keywords</div>
                <div className="step-tag"><FaDraftingCompass /> Validating Syntax</div>
                <div className="step-tag"><FaChartLine /> Projecting Market Fit</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="analysis-error-panel">
            <FaExclamationTriangle className="error-icon" />
            <h3>Service Temporarily Unavailable</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={performAnalysis}>Retry Analysis</button>
          </div>
        )}

        {!isLoading && !error && displayResults && (
          <div className="analysis-results-view">
            {/* Score Overview */}
            <div className="score-overview-premium">
              <div className="circular-score-container">
                <svg viewBox="0 0 36 36" className="circular-chart-premium">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-progress" strokeDasharray={`${overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21" className="score-text">{overallScore}%</text>
                </svg>
                <div className="score-sub-label">Market Score</div>
              </div>

              <div className="score-breakdown-grid">
                <div className="metric-card">
                  <span className="metric-val">{displayResults.scores?.ats || 0}/30</span>
                  <span className="metric-name">ATS Compliance</span>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${Math.min(((displayResults.scores?.ats || 0) / 30 * 100), 100)}%` }}></div>
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-val">{displayResults.scores?.keyword || 0}/30</span>
                  <span className="metric-name">Keyword Alignment</span>
                  <div className="metric-bar">
                    <div className="keyword-fill" style={{ width: `${Math.min(((displayResults.scores?.keyword || 0) / 30 * 100), 100)}%` }}></div>
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-val">{displayResults.scores?.content || 0}/20</span>
                  <span className="metric-name">Content Authority</span>
                  <div className="metric-bar">
                    <div className="content-fill" style={{ width: `${Math.min(((displayResults.scores?.content || 0) / 20 * 100), 100)}%` }}></div>
                  </div>
                </div>
                <div className="metric-card">
                  <span className="metric-val">{displayResults.scores?.relevance || 0}/20</span>
                  <span className="metric-name">Role Relevance</span>
                  <div className="metric-bar">
                    <div className="relevance-fill" style={{ width: `${Math.min(((displayResults.scores?.relevance || 0) / 20 * 100), 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="insights-grid">
              <div className="insight-card strengths clickable-card" onClick={() => setSelectedStrength(displayResults.strengths)}>
                <h3><FaCheckCircle /> Competitive Advantages</h3>
                <ul>
                  {displayResults.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                </ul>
                {displayResults.strengths.length > 3 && (
                  <p className="view-more-hint">Click to view all {displayResults.strengths.length} advantages</p>
                )}
              </div>

              <div className="insight-card weaknesses clickable-card" onClick={() => setSelectedWeakness(displayResults.weaknesses)}>
                <h3><FaExclamationTriangle /> Critical Gaps</h3>
                <ul>
                  {displayResults.weaknesses.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
                {displayResults.weaknesses.length > 3 && (
                  <p className="view-more-hint">Click to view all {displayResults.weaknesses.length} gaps</p>
                )}
              </div>

              <div className="insight-card full-width suggestions">
                <h3><FaLightbulb /> Actionable Roadmap</h3>
                <div className="suggestion-grid">
                  {/* Handle new structured improvements or legacy strings */}
                  {(displayResults.improvements || displayResults.suggestions || []).map((item, i) => (
                    <div
                      key={i}
                      className={`suggestion-pill clickable ${item.priority ? item.priority.toLowerCase() : ''}`}
                      onClick={() => typeof item === 'object' ? setSelectedImprovement(item) : null}
                    >
                      {typeof item === 'object' ? (
                        <>
                          <div className="pill-header">
                            <span className="pill-title">{item.action}</span>
                            {item.priority && <span className="priority-badge">{item.priority}</span>}
                          </div>
                          <div className="pill-hint">Click for details</div>
                        </>
                      ) : (
                        item
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="insight-card full-width feedback">
                <h3><FaUserTie /> Career Coach Perspective</h3>
                <div className="feedback-content">
                  <div className="fit-badge">
                    <strong>Role Alignment:</strong> {displayResults.personalization.targetRoleFit}
                  </div>
                  <p className="coach-advice">{displayResults.personalization.customFeedback}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Improvement Details Modal */}
        {selectedImprovement && (
          <div className="modal-overlay animate-in" onClick={() => setSelectedImprovement(null)}>
            <div className="modal-content improvement-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedImprovement.action}</h3>
                <button className="close-btn" onClick={() => setSelectedImprovement(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="priority-section">
                  <span className={`priority-tag ${selectedImprovement.priority?.toLowerCase()}`}>
                    {selectedImprovement.priority} Priority
                  </span>
                </div>
                <h4>Implementation Plan:</h4>
                <ul className="implementation-steps">
                  {selectedImprovement.details?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setSelectedImprovement(null)}>Got it</button>
              </div>
            </div>
          </div>
        )}

        {/* Strengths Modal */}
        {selectedStrength && (
          <div className="modal-overlay animate-in" onClick={() => setSelectedStrength(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3><FaCheckCircle style={{ color: '#2dd4bf', marginRight: '0.5rem' }} /> Competitive Advantages</h3>
                <button className="close-btn" onClick={() => setSelectedStrength(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                  These are the strong points in your resume that give you a competitive edge in the job market.
                </p>
                <ul className="implementation-steps">
                  {selectedStrength.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setSelectedStrength(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Weaknesses Modal */}
        {selectedWeakness && (
          <div className="modal-overlay animate-in" onClick={() => setSelectedWeakness(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3><FaExclamationTriangle style={{ color: '#f472b6', marginRight: '0.5rem' }} /> Critical Gaps</h3>
                <button className="close-btn" onClick={() => setSelectedWeakness(null)}>&times;</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                  These areas need improvement to make your resume more competitive. Focus on addressing these gaps to increase your chances.
                </p>
                <ul className="implementation-steps">
                  {selectedWeakness.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setSelectedWeakness(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisEngine;