import React, { useState } from 'react';
import { matchKeywords } from '../services/resumeParser';
import './JobComparison.css';

const JobComparison = ({ resumeData }) => {
  const [jobDescriptions, setJobDescriptions] = useState([
    { id: 1, title: 'Software Engineer', description: '', results: null },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState([]);

  const addNewJobField = () => {
    const newId = Math.max(...jobDescriptions.map(j => j.id)) + 1;
    setJobDescriptions([
      ...jobDescriptions,
      { id: newId, title: `Job ${newId}`, description: '', results: null }
    ]);
  };

  const removeJobField = (id) => {
    if (jobDescriptions.length <= 1) return;
    setJobDescriptions(jobDescriptions.filter(job => job.id !== id));
  };

  const updateJobDescription = (id, value) => {
    setJobDescriptions(
      jobDescriptions.map(job =>
        job.id === id ? { ...job, description: value } : job
      )
    );
  };

  const updateJobTitle = (id, value) => {
    setJobDescriptions(
      jobDescriptions.map(job =>
        job.id === id ? { ...job, title: value } : job
      )
    );
  };

  const compareAllJobs = async () => {
    if (jobDescriptions.some(job => !job.description.trim())) {
      alert('Please fill in all job descriptions');
      return;
    }

    setIsAnalyzing(true);

    try {
      const results = [];
      for (const job of jobDescriptions) {
        try {
          // Use centralized matchKeywords service (Backend -> Gemini)
          const matchResult = await matchKeywords(resumeData, job.description);

          results.push({
            jobId: job.id,
            jobTitle: job.title,
            ...matchResult
          });
        } catch (err) {
          console.error(`Error analyzing job ${job.id}:`, err);
          results.push({
            jobId: job.id,
            jobTitle: job.title,
            error: err.message
          });
        }
      }

      setComparisonResults(results);
    } catch (error) {
      console.error('Error comparing jobs:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchLevel = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  };

  return (
    <div className="job-comparison-container">
      <h2>Multi-Job Comparison Tool</h2>
      <p>Compare your resume against multiple job descriptions to find the best matches and identify improvement opportunities</p>

      <div className="jobs-input-section">
        <div className="jobs-header">
          <h3>Job Descriptions</h3>
          <button className="add-job-btn" onClick={addNewJobField}>
            + Add Another Job
          </button>
        </div>

        {jobDescriptions.map((job) => (
          <div key={job.id} className="job-input-card">
            <div className="job-title-input">
              <label htmlFor={`job-title-${job.id}`}>Job Title:</label>
              <input
                id={`job-title-${job.id}`}
                type="text"
                value={job.title}
                onChange={(e) => updateJobTitle(job.id, e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager"
              />
              {jobDescriptions.length > 1 && (
                <button
                  className="remove-job-btn"
                  onClick={() => removeJobField(job.id)}
                  disabled={jobDescriptions.length <= 1}
                >
                  ×
                </button>
              )}
            </div>

            <textarea
              value={job.description}
              onChange={(e) => updateJobDescription(job.id, e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
            />
          </div>
        ))}
      </div>

      <div className="compare-actions">
        <button
          className="compare-btn"
          onClick={compareAllJobs}
          disabled={isAnalyzing || jobDescriptions.some(job => !job.description.trim())}
        >
          {isAnalyzing ? 'Comparing Jobs...' : 'Compare All Jobs'}
        </button>
      </div>

      {comparisonResults.length > 0 && (
        <div className="comparison-results">
          <h3>Comparison Results</h3>

          <div className="results-grid">
            {comparisonResults.map((result, index) => (
              <div key={result.jobId} className="result-card">
                <div className="result-header">
                  <h4>{result.jobTitle}</h4>
                  {result.error ? (
                    <div className="error-badge">Error</div>
                  ) : (
                    <div className={`match-percentage ${getMatchLevel(result.matchPercentage)}`}>
                      {result.matchPercentage}%
                    </div>
                  )}
                </div>

                {result.error ? (
                  <div className="error-section">
                    <p>Error analyzing this job: {result.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="match-summary">
                      <p>
                        <strong>Match Score:</strong> {result.matchPercentage}%<br />
                        <strong>Matched Keywords:</strong> {result.matched?.length || 0}<br />
                        <strong>Missing Keywords:</strong> {result.missing?.length || 0}
                      </p>
                    </div>

                    <div className="progress-bar-container">
                      <div
                        className={`progress-bar ${getMatchLevel(result.matchPercentage)}`}
                        style={{ width: `${result.matchPercentage}%` }}
                      ></div>
                    </div>

                    <div className="keywords-section">
                      <div className="matched-keywords">
                        <h5>✅ Matched ({result.matched?.length || 0})</h5>
                        <div className="keyword-chips">
                          {(result.matched || []).slice(0, 5).map((keyword, idx) => (
                            <span key={idx} className="keyword-chip matched">{keyword}</span>
                          ))}
                          {(result.matched || []).length > 5 && (
                            <span className="keyword-chip">+{(result.matched || []).length - 5} more</span>
                          )}
                        </div>
                      </div>

                      <div className="missing-keywords">
                        <h5>❌ Missing ({result.missing?.length || 0})</h5>
                        <div className="keyword-chips">
                          {(result.missing || []).slice(0, 5).map((keyword, idx) => (
                            <span key={idx} className="keyword-chip missing">{keyword}</span>
                          ))}
                          {(result.missing || []).length > 5 && (
                            <span className="keyword-chip">+{(result.missing || []).length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="recommendations">
                      <h5>💡 Recommendations</h5>
                      <ul>
                        {(result.recommendations || []).slice(0, 3).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                        {(result.missing || []).length > 0 && result.matchPercentage < 70 && (
                          <li>Consider adding more of the missing keywords to improve your match score</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Summary section */}
          <div className="comparison-summary">
            <h3>Overall Summary</h3>
            <div className="summary-stats">
              <div className="stat-card">
                <div className="stat-value">
                  {comparisonResults.filter(r => !r.error).length}
                </div>
                <div className="stat-label">Jobs Analyzed</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">
                  {Math.round(
                    comparisonResults
                      .filter(r => !r.error)
                      .reduce((sum, r) => sum + r.matchPercentage, 0) /
                    comparisonResults.filter(r => !r.error).length
                  ) || 0}%
                </div>
                <div className="stat-label">Avg. Match Score</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">
                  {comparisonResults
                    .filter(r => !r.error && r.matchPercentage >= 70)
                    .length}
                </div>
                <div className="stat-label">Good Matches</div>
              </div>
            </div>

            <div className="best-match">
              <h4>Top Match:
                <span className="top-match-name">
                  {comparisonResults
                    .filter(r => !r.error)
                    .sort((a, b) => b.matchPercentage - a.matchPercentage)[0]?.jobTitle || 'None'}
                </span>
              </h4>
              <p>
                This position seems to align best with your current resume.
                Focus on this opportunity or consider adjusting your resume to better match other positions.
              </p>
            </div>
          </div>
        </div>
      )}

      {!comparisonResults.length && (
        <div className="info-panel">
          <h3>How Job Comparison Works</h3>
          <ul>
            <li>Add multiple job descriptions to see which ones match your resume best</li>
            <li>Compare keyword alignment across different positions</li>
            <li>Identify common missing keywords to improve your resume for multiple roles</li>
            <li>Get tailored recommendations for each job description</li>
            <li>Find the positions that best match your current qualifications</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default JobComparison;