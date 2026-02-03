import React, { useState } from 'react';
import { FaCloudUploadAlt, FaCheckCircle, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileAlt, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { parseResume } from '../services/resumeParser';
import { isValidResumeType, isValidResumeSize, formatFileSize } from '../utils/helpers';
import './ResumeUpload.css';

const ResumeUpload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      if (!isValidResumeType(selectedFile)) {
        setError('Please upload a PDF or Word document (.docx)');
        return;
      }

      if (!isValidResumeSize(selectedFile)) {
        setError('File size exceeds 5MB limit');
        return;
      }

      setError('');
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file) => {
    setIsUploading(true);
    setError('');
    try {
      const parsedData = await parseResume(file);
      setPreviewData(parsedData);
    } catch (err) {
      console.error("Parsing Failure:", err);
      // Display the specific error message from the parser if available
      const message = err.message || 'Error parsing resume. Please ensure the file is not corrupted or password protected.';
      setError(message);
      setFile(null); // Reset file on error to let them try again
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    if (file && previewData) {
      onFileUpload(previewData);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setError('');
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  return (
    <div className="resume-upload-container">
      <div
        className={`upload-area ${file ? 'uploaded' : ''}`}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {!file && !isUploading && (
          <div className="upload-prompt">
            <div className="upload-icon"><FaCloudUploadAlt /></div>
            <p>Drag and drop your resume here</p>
            <p className="file-types">Supports PDF, DOCX (Max 5MB)</p>
            <label className="browse-button">
              Browse Files
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="upload-loading">
            <div className="spinner"></div>
            <h3>Analyzing your document...</h3>
            <p className="subtext">AI is extracting your professional profile</p>
          </div>
        )}

        {previewData && !isUploading && (
          <div className="preview-section academic-preview">
            <div className="preview-header">
              <div className="success-badge">
                <span className="badge-icon"><FaCheckCircle /></span>
                <span className="badge-text">Analysis Complete</span>
              </div>
              <h3>Extracted Information</h3>
            </div>

            <div className="contact-info-grid">
              <div className="info-card">
                <span className="info-label"><FaUser /> Name</span>
                <span className="info-value">{previewData.extractedData.name || 'Name Not Detected'}</span>
              </div>
              <div className="info-card">
                <span className="info-label"><FaEnvelope /> Email</span>
                <span className="info-value">{previewData.extractedData.email || 'Email Not Found'}</span>
              </div>
              <div className="info-card">
                <span className="info-label"><FaPhone /> Phone</span>
                <span className="info-value">{previewData.extractedData.phone || 'Phone Not Found'}</span>
              </div>
              <div className="info-card">
                <span className="info-label"><FaMapMarkerAlt /> Location</span>
                <span className="info-value">{previewData.extractedData.address || 'No Location Detected'}</span>
              </div>
            </div>

            <div className="detailed-stats">
              <div className="stat-item">
                <span className="stat-label"><FaChartLine /> Experience</span>
                <span className="stat-value">{previewData.extractedData.experience?.length || 0} Positions</span>
              </div>
              <div className="stat-item">
                <span className="stat-label"><FaFileAlt /> File Info</span>
                <span className="stat-value">{formatFileSize(file.size)}</span>
              </div>
            </div>

            {previewData.extractionMetadata?.validationIssues?.length > 0 && (
              <div className="validation-warning glass-panel">
                <strong><FaExclamationTriangle /> Validation Notices:</strong>
                <ul>
                  {previewData.extractionMetadata.validationIssues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="action-buttons">
              <button className="analyze-button glass-button" onClick={handleUpload}>
                Confirm & Start Deep Analysis
              </button>
              <button className="reset-button" onClick={handleReset}>
                Discard & Retry
              </button>
            </div>

            <div className="debug-toggle-container">
              <button
                className="debug-button"
                onClick={() => setFile({ ...file, showRaw: !file.showRaw })}
              >
                {file.showRaw ? 'Hide Raw Extraction' : 'View Raw Extracted JSON'}
              </button>
              {file.showRaw && (
                <pre className="raw-json-view">
                  {JSON.stringify(previewData.extractedData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
    </div>
  );
};

export default ResumeUpload;