import React, { useState } from 'react';
import {
  FaCloudUploadAlt, FaCheckCircle,
  FaPhone, FaMapMarkerAlt,
  FaFingerprint, FaShieldAlt, FaArrowRight
} from 'react-icons/fa';
import { parseResume } from '../services/resumeParser';
import { isValidResumeType, isValidResumeSize } from '../utils/helpers';
import './ResumeUpload.css';

const ResumeUpload = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (file) => {
    if (!isValidResumeType(file)) {
      setError('Invalid format. Please use PDF or DOCX.');
      return;
    }
    if (!isValidResumeSize(file)) {
      setError('File too large (Max 5MB).');
      return;
    }

    setError('');
    setFile(file);
    setIsUploading(true);

    try {
      const parsedData = await parseResume(file);
      setPreviewData(parsedData);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try a different document.');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const renderIdle = () => (
    <div className="upload-prompt animate-in">
      <div className="upload-icon-wrapper">
        <FaCloudUploadAlt className="upload-icon" />
      </div>
      <div>
        <h3>Drop Professional Profile</h3>
        <p className="file-types-hint">Securely analyze PDF or DOCX documents</p>
      </div>
      <label className="btn-primary">
        Browse Intelligence
        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
      </label>
    </div>
  );

  const renderLoading = () => (
    <div className="upload-loading">
      <div className="scanner-line"></div>
      <FaFingerprint className="upload-icon" style={{ color: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />
      <h3>Extracting Professional DNA...</h3>
      <p className="subtext">Gemini 2.0 Flash is synthesizing your profile</p>
    </div>
  );

  const renderPreview = () => (
    <div className="preview-profile-draft animate-in">
      <div className="draft-header">
        <div className="profile-main-info">
          <div className="badge-success"><FaCheckCircle /> Extraction Verified</div>
          <h2>{previewData.extractedData.name}</h2>
          <p className="subtext">{previewData.extractedData.email}</p>
        </div>
        <FaShieldAlt style={{ fontSize: '2.5rem', color: 'var(--zinc-800)' }} />
      </div>

      <div className="draft-grid">
        <div className="draft-item">
          <span className="draft-label"><FaPhone /> Contact Line</span>
          <div className="draft-value">{previewData.extractedData.phone || 'Not Specified'}</div>
        </div>
        <div className="draft-item">
          <span className="draft-label"><FaMapMarkerAlt /> Operational Base</span>
          <div className="draft-value">{previewData.extractedData.address || 'Global / Remote'}</div>
        </div>
      </div>

      <div className="action-row">
        <button className="btn-primary" onClick={() => onFileUpload(previewData)}>
          Confirm & Initialize Dashboard <FaArrowRight />
        </button>
        <button className="btn-secondary" onClick={() => { setFile(null); setPreviewData(null); }}>
          Discard Draft
        </button>
      </div>
    </div>
  );

  return (
    <div className="resume-upload-container">
      <div
        className={`upload-area ${file ? 'uploaded' : ''}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {!file && !isUploading && renderIdle()}
        {isUploading && renderLoading()}
        {previewData && !isUploading && renderPreview()}
      </div>
      {error && <div className="error-message animate-in">{error}</div>}
    </div>
  );
};

export default ResumeUpload;