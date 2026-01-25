import React, { useState, useEffect, useCallback } from 'react';
import { analyzeResume } from '../services/resumeParser';
import './AIAnalysisEngine.css';

const AIAnalysisEngine = ({ resumeData, onAnalysisComplete }) => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  const performAnalysis = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const analysis = await analyzeResume(resumeData);
      setAnalysisResults(analysis);
      setOverallScore(analysis.overallScore);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (err) {
      console.error('Error performing analysis:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resumeData, onAnalysisComplete]);

  useEffect(() => {
    if (resumeData) {
      performAnalysis();
    }
  }, [resumeData, performAnalysis]);

  if (isLoading) {
    return (
      <div className="ai-analysis-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>AI is analyzing your resume...</p>
          <p className="subtext">Evaluating content, format, and keyword relevance</p>
        </div>
      </div>
    );
  }

  if (!analysisResults) {
    return null;
  }

  return (
    <div className="ai-analysis-container">
      <h2>AI-Powered Resume Analysis</h2>
      
      <div className="score-overview">
        <div className="overall-score">
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                className="circle"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#7ca982"
                strokeWidth="3"
                strokeDasharray={`${overallScore}, 100`}
              />
              <text x="18" y="20.5" className="percentage-text">{overallScore}%</text>
            </svg>
          </div>
          <div className="score-label">Overall Score</div>
        </div>
        
        <div className="detailed-scores">
          <div className="score-card">
            <div className="score-value">{analysisResults.formattingScore}%</div>
            <div className="score-title">Formatting</div>
          </div>
          <div className="score-card">
            <div className="score-value">{analysisResults.contentScore}%</div>
            <div className="score-title">Content</div>
          </div>
          <div className="score-card">
            <div className="score-value">{analysisResults.relevanceScore}%</div>
            <div className="score-title">Relevance</div>
          </div>
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Strengths</h3>
        <ul className="strengths-list">
          {analysisResults.strengths.map((strength, index) => (
            <li key={index} className="strength-item">✓ {strength}</li>
          ))}
        </ul>
      </div>
      
      <div className="analysis-section">
        <h3>Areas for Improvement</h3>
        <ul className="weaknesses-list">
          {analysisResults.weaknesses.map((weakness, index) => (
            <li key={index} className="weakness-item">⚠ {weakness}</li>
          ))}
        </ul>
      </div>
      
      <div className="analysis-section">
        <h3>Actionable Suggestions</h3>
        <ol className="suggestions-list">
          {analysisResults.suggestions.map((suggestion, index) => (
            <li key={index} className="suggestion-item">{suggestion}</li>
          ))}
        </ol>
      </div>
      
      <div className="analysis-section">
        <h3>Industry-Specific Recommendations</h3>
        <ul className="industry-rec-list">
          {analysisResults.industrySpecific.recommendations.map((rec, index) => (
            <li key={index} className="industry-rec-item">💡 {rec}</li>
          ))}
        </ul>
        <div className="trending-keywords">
          <h4>Trending Keywords in Your Field:</h4>
          <div className="keyword-chips">
            {analysisResults.industrySpecific.trendingKeywords.map((keyword, index) => (
              <span key={index} className="keyword-chip">{keyword}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Keyword Analysis</h3>
        <div className="keyword-analysis">
          <div className="matched-keywords">
            <h4>Matched Keywords: {analysisResults.keywordMatches.matched.length}</h4>
            <div className="keyword-tags">
              {analysisResults.keywordMatches.matched.map((keyword, index) => (
                <span key={index} className="keyword-tag matched">{keyword}</span>
              ))}
            </div>
          </div>
          
          <div className="missing-keywords">
            <h4>Missing Keywords: {analysisResults.keywordMatches.missing.length}</h4>
            <div className="keyword-tags">
              {analysisResults.keywordMatches.missing.map((keyword, index) => (
                <span key={index} className="keyword-tag missing">{keyword}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="analysis-section">
        <h3>Personalized Feedback</h3>
        <div className="custom-feedback">
          <p><strong>Target Role Fit:</strong> {analysisResults.personalization.targetRoleFit}</p>
          <p><strong>Career Goals Alignment:</strong> {analysisResults.personalization.careerGoalsAlignment}</p>
          <div className="feedback-text">
            {analysisResults.personalization.customFeedback}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisEngine;