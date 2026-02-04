import React, { useState } from 'react';
import { FaBullseye, FaCheckCircle, FaExclamationCircle, FaTerminal, FaMagic, FaHistory } from 'react-icons/fa';
import { matchKeywords } from '../services/resumeParser';
import './KeywordMatcher.css';

const KeywordMatcher = ({ resumeData }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [matchResults, setMatchResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const analyzeKeywords = async () => {
    if (!jobDescription.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Use centralized matchKeywords service
      const result = await matchKeywords(resumeData, jobDescription);
      setMatchResults(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || "Synchronous Analysis encountered a latency issue. Gemini 2.0 Flash might be throttled.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = () => {
    setJobDescription(`Senior Full Stack Developer
Requirements:
- Strong proficiency in React, Node.js and TypeScript
- Experience with Cloud Infrastructure (AWS/GCP)
- Proven record of optimizing web performance
- Knowledge of Vector Databases and LLM integration
- Minimum 5+ years of professional engineering experience`);
  };

  return (
    <div className="keyword-matcher-container animate-in">
      <div className="matcher-header">
        <h1 className="text-gradient">Semantic Matcher</h1>
        <p className="subtext">Deep architectural alignment between your profile and target roles.</p>
      </div>

      <div className="jd-input-area">
        <div className="modern-card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="stat-label"><FaTerminal /> Intelligence Input</span>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={loadSample}>
              Load Sample Case
            </button>
          </div>
          <textarea
            className="jd-textarea"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste technical job description here for deep alignment analysis..."
          />
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }}
            onClick={analyzeKeywords}
            disabled={isAnalyzing || !jobDescription.trim()}
          >
            {isAnalyzing ? <><FaMagic className="animate-spin" /> Cross-Referencing DNA...</> : <><FaBullseye /> Execute Semantic Match</>}
          </button>
        </div>
      </div>

      {matchResults && (
        <div className="results-panel animate-in">
          <div className="modern-card match-hero-card">
            <span className="stat-label">Compatibility Index</span>
            <div className="score-circle-group">
              <div className="percent-display">{matchResults.matchPercentage}<span>%</span></div>
            </div>
            <p className="analysis-text" style={{ maxWidth: '600px', margin: '0 auto' }}>
              {matchResults.analysis}
            </p>
          </div>

          <div className="comparison-grid">
            <div className="modern-card keyword-bank" style={{ padding: '1.5rem' }}>
              <h4><FaCheckCircle color="var(--primary)" /> DNA Alignment</h4>
              <div className="tag-cloud">
                {(matchResults.matched || []).map((tag, i) => (
                  <span key={i} className="keyword-pill match">{tag}</span>
                ))}
              </div>
            </div>
            <div className="modern-card keyword-bank" style={{ padding: '1.5rem' }}>
              <h4><FaExclamationCircle color="#fb7185" /> Critical Gaps</h4>
              <div className="tag-cloud">
                {(matchResults.missing || []).map((tag, i) => (
                  <span key={i} className="keyword-pill gap">{tag}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default KeywordMatcher;