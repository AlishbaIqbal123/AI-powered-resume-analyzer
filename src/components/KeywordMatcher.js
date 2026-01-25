import React, { useState } from 'react';
import { matchKeywords } from '../services/resumeParser';
import './KeywordMatcher.css';

const KeywordMatcher = ({ resumeData }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [matchResults, setMatchResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeKeywords = async () => {
    if (!jobDescription.trim()) {
      alert('Please enter a job description to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      const results = await matchKeywords(resumeData, jobDescription);
      setMatchResults(results);
    } catch (err) {
      console.error('Error analyzing keywords:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSampleJobDescription = () => {
    const sampleDesc = `We are looking for a Senior Software Engineer with expertise in:
      - 5+ years of experience with JavaScript and modern frameworks (React, Angular)
      - Strong Node.js backend development skills
      - Experience with cloud platforms (AWS, Azure, or GCP)
      - Knowledge of databases (SQL and NoSQL)
      - Familiarity with CI/CD pipelines and DevOps practices
      - Agile development methodologies
      - Experience with Git version control
      - Strong problem-solving and communication skills`;

    setJobDescription(sampleDesc);
  };

  return (
    <div className="keyword-matcher-container">
      <h2>Keyword Matching Tool</h2>
      <p className="subtitle">Compare your resume against job descriptions to identify matching keywords and improvement opportunities</p>
      
      <div className="input-section">
        <div className="job-description-input">
          <label htmlFor="job-desc">Job Description:</label>
          <textarea
            id="job-desc"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={6}
          />
          <button className="sample-btn" onClick={handleSampleJobDescription}>
            Load Sample Job Description
          </button>
        </div>
        
        <button 
          className="analyze-btn" 
          onClick={analyzeKeywords}
          disabled={isAnalyzing || !jobDescription.trim()}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Keywords'}
        </button>
      </div>

      {matchResults && (
        <div className="results-section">
          <div className="match-summary">
            <div className="match-score">
              <h3>Match Score: {matchResults.matchPercentage}%</h3>
              <p>{matchResults.matched.length} keywords matched out of {matchResults.totalJobKeywords} job requirements</p>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${matchResults.matchPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="keywords-section">
            <div className="matched-keywords">
              <h3>✅ Matched Keywords ({matchResults.matched.length})</h3>
              <div className="keyword-grid">
                {matchResults.matched.map((keyword, index) => (
                  <div key={index} className="keyword-card matched">
                    <span className="keyword-text">{keyword}</span>
                    <span className="keyword-status">Present</span>
                  </div>
                ))}
                {matchResults.matched.length === 0 && (
                  <p className="no-match">No matching keywords found in your resume</p>
                )}
              </div>
            </div>

            <div className="missing-keywords">
              <h3>❌ Missing Keywords ({matchResults.missing.length})</h3>
              <div className="keyword-grid">
                {matchResults.missing.map((keyword, index) => (
                  <div key={index} className="keyword-card missing">
                    <span className="keyword-text">{keyword}</span>
                    <span className="keyword-status">Missing</span>
                  </div>
                ))}
                {matchResults.missing.length === 0 && (
                  <p className="no-missing">Great job! Your resume contains all the key terms from the job description.</p>
                )}
              </div>
            </div>
          </div>

          <div className="recommendations">
            <h3>Recommendations</h3>
            <ul>
              {matchResults.missing.slice(0, 3).map((keyword, index) => (
                <li key={index}>Consider adding "{keyword}" to your resume, especially in your skills section or experience descriptions</li>
              ))}
              {matchResults.matchPercentage < 50 && (
                <li>Focus on incorporating more technical keywords that match the job requirements</li>
              )}
              {matchResults.matchPercentage >= 50 && matchResults.matchPercentage < 75 && (
                <li>Your resume has good keyword coverage, but could benefit from including a few more relevant terms</li>
              )}
              {matchResults.matchPercentage >= 75 && (
                <li>Excellent keyword alignment! Your resume is well-optimized for this position.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {!matchResults && (
        <div className="info-panel">
          <h3>How Keyword Matching Works</h3>
          <ul>
            <li>Paste a job description to see which keywords from the posting match your resume</li>
            <li>Identify missing keywords that could improve your application's ATS score</li>
            <li>Understand which skills and qualifications are most important for the role</li>
            <li>Get personalized recommendations to optimize your resume for specific positions</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default KeywordMatcher;