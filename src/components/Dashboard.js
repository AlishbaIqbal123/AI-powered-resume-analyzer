import React, { useState } from 'react';
import ChatbotContainer from './Chatbot/ChatbotContainer';
import './Dashboard.css';

const Dashboard = ({ resumeData, analysisResults }) => {
  const [activeTab, setActiveTab] = useState('overview');

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
    
    // Determine which areas need the most attention based on scores
    const areas = [
      { name: 'Content', score: analysisResults.contentScore, priority: 1 },
      { name: 'Formatting', score: analysisResults.formattingScore, priority: 2 },
      { name: 'Relevance', score: analysisResults.relevanceScore, priority: 3 }
    ];
    
    // Sort by lowest score (highest need for improvement)
    return areas.sort((a, b) => a.score - b.score);
  };

  const exportResults = () => {
    // In a real app, this would export the results to a file
    alert('Export functionality would save your analysis results in a real application');
  };

  return (
    <div className="dashboard-container">
      <h2>Resume Analysis Dashboard</h2>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Detailed Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'improvements' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvements')}
        >
          Improvement Plan
        </button>
        <button 
          className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Progress Tracking
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {analysisResults ? (
              <>
                <div className="summary-cards">
                  <div className="summary-card primary">
                    <h3>Overall Score</h3>
                    <div className="score-display">{analysisResults.overallScore}/100</div>
                    <p>{getProgressStatus()}</p>
                  </div>
                  
                  <div className="summary-card secondary">
                    <h3>Resume Quality</h3>
                    <div className="progress-status">
                      <div className="status-indicator excellent"></div>
                      <span>Excellent</span>
                    </div>
                    <div className="progress-status">
                      <div className="status-indicator good"></div>
                      <span>Good</span>
                    </div>
                    <div className="progress-status">
                      <div className="status-indicator average"></div>
                      <span>Average</span>
                    </div>
                    <div className="progress-status">
                      <div className="status-indicator needs-work"></div>
                      <span>Needs Work</span>
                    </div>
                  </div>
                  
                  <div className="summary-card tertiary">
                    <h3>Target Role Fit</h3>
                    <div className="role-fit">
                      <div className="fit-indicator">
                        <span className="fit-value">{analysisResults.personalization.targetRoleFit}</span>
                      </div>
                      <p>Alignment with your career goals</p>
                    </div>
                  </div>
                </div>

                <div className="breakdown-section">
                  <h3>Score Breakdown</h3>
                  <div className="score-breakdown">
                    <div className="breakdown-item">
                      <span>Content Quality</span>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill content" 
                          style={{ width: `${analysisResults.contentScore}%` }}
                        ></div>
                        <span className="breakdown-percent">{analysisResults.contentScore}%</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-item">
                      <span>Formatting</span>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill formatting" 
                          style={{ width: `${analysisResults.formattingScore}%` }}
                        ></div>
                        <span className="breakdown-percent">{analysisResults.formattingScore}%</span>
                      </div>
                    </div>
                    
                    <div className="breakdown-item">
                      <span>Job Relevance</span>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill relevance" 
                          style={{ width: `${analysisResults.relevanceScore}%` }}
                        ></div>
                        <span className="breakdown-percent">{analysisResults.relevanceScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button className="action-btn primary" onClick={exportResults}>
                      Export Results
                    </button>
                    <button className="action-btn secondary" onClick={() => window.location.hash = '#keyword-matcher'}>
                      Compare with Job Description
                    </button>
                    <button className="action-btn tertiary">
                      Share Feedback
                    </button>
                  </div>
                </div>
                
                <div className="chatbot-section">
                  <h3>AI Resume Advisor</h3>
                  <ChatbotContainer 
                    resumeData={resumeData} 
                    analysisResults={analysisResults} 
                  />
                </div>
              </>
            ) : (
              <div className="no-analysis-placeholder">
                <h3>No Analysis Available</h3>
                <p>Upload a resume and complete the AI analysis to see your dashboard</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            {analysisResults ? (
              <>
                <div className="strengths-section">
                  <h3>Resume Strengths</h3>
                  <ul className="strengths-list">
                    {analysisResults.strengths.map((strength, index) => (
                      <li key={index} className="strength-item">✓ {strength}</li>
                    ))}
                  </ul>
                </div>

                <div className="weaknesses-section">
                  <h3>Areas for Improvement</h3>
                  <ul className="weaknesses-list">
                    {analysisResults.weaknesses.map((weakness, index) => (
                      <li key={index} className="weakness-item">⚠ {weakness}</li>
                    ))}
                  </ul>
                </div>

                <div className="suggestions-section">
                  <h3>Detailed Suggestions</h3>
                  <ol className="suggestions-list">
                    {analysisResults.suggestions.map((suggestion, index) => (
                      <li key={index} className="suggestion-item">{suggestion}</li>
                    ))}
                  </ol>
                </div>
                
                <div className="industry-recommendations-section">
                  <h3>Industry-Specific Recommendations</h3>
                  <ul className="industry-recommendations-list">
                    {analysisResults.industrySpecific.recommendations.map((rec, index) => (
                      <li key={index} className="industry-rec-item">💡 {rec}</li>
                    ))}
                  </ul>
                  <div className="trending-keywords-section">
                    <h4>Trending Keywords in Your Field:</h4>
                    <div className="trending-keyword-chips">
                      {analysisResults.industrySpecific.trendingKeywords.map((keyword, index) => (
                        <span key={index} className="trending-keyword-chip">{keyword}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-analysis-placeholder">
                <h3>No Detailed Analysis Available</h3>
                <p>Complete the AI analysis to see detailed feedback</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="improvements-tab">
            {analysisResults ? (
              <>
                <div className="priority-section">
                  <h3>Improvement Priority</h3>
                  <p>Focus on these areas in order of importance to maximize your resume's effectiveness:</p>
                  
                  <div className="priority-list">
                    {getImprovementPriority().map((area, index) => (
                      <div key={index} className="priority-item">
                        <div className="priority-number">#{index + 1}</div>
                        <div className="priority-info">
                          <h4>{area.name}</h4>
                          <p>Current score: {area.score}/100</p>
                          <div className="priority-bar">
                            <div 
                              className="priority-fill" 
                              style={{ width: `${area.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="action-plan">
                  <h3>Recommended Action Plan</h3>
                  <div className="plan-steps">
                    <div className="plan-step">
                      <div className="step-number">1</div>
                      <div className="step-content">
                        <h4>Immediate Improvements</h4>
                        <p>Address the highest priority items from your analysis</p>
                      </div>
                    </div>
                    
                    <div className="plan-step">
                      <div className="step-number">2</div>
                      <div className="step-content">
                        <h4>Content Enhancement</h4>
                        <p>Strengthen your experience descriptions with quantifiable achievements</p>
                      </div>
                    </div>
                    
                    <div className="plan-step">
                      <div className="step-number">3</div>
                      <div className="step-content">
                        <h4>Format Optimization</h4>
                        <p>Ensure your resume is ATS-friendly and visually appealing</p>
                      </div>
                    </div>
                    
                    <div className="plan-step">
                      <div className="step-number">4</div>
                      <div className="step-content">
                        <h4>Keyword Alignment</h4>
                        <p>Incorporate relevant keywords for your target roles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-analysis-placeholder">
                <h3>No Improvement Plan Available</h3>
                <p>Complete the AI analysis to receive a personalized improvement plan</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="tracking-tab">
            <h3>Progress Tracking</h3>
            <p>Track your resume improvements over time:</p>
            
            <div className="tracking-chart">
              <div className="chart-placeholder">
                <p>Historical analysis data would be displayed here in a real application</p>
                <p>Each time you update and re-analyze your resume, your progress would be tracked</p>
              </div>
            </div>

            <div className="milestones">
              <h4>Recent Milestones</h4>
              <div className="milestone-list">
                <div className="milestone-item">
                  <div className="milestone-check">✓</div>
                  <div className="milestone-content">
                    <h5>Resume Uploaded</h5>
                    <p>Initial resume analysis completed</p>
                  </div>
                </div>
                
                {analysisResults && (
                  <div className="milestone-item">
                    <div className="milestone-check">✓</div>
                    <div className="milestone-content">
                      <h5>AI Analysis Completed</h5>
                      <p>Received detailed feedback and recommendations</p>
                    </div>
                  </div>
                )}
                
                <div className="milestone-item pending">
                  <div className="milestone-check">—</div>
                  <div className="milestone-content">
                    <h5>Improvements Made</h5>
                    <p>Apply recommended changes to your resume</p>
                  </div>
                </div>
                
                <div className="milestone-item pending">
                  <div className="milestone-check">—</div>
                  <div className="milestone-content">
                    <h5>Re-analyze Resume</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;