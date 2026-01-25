import React, { useState } from 'react';
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
      // Validate file type and size using helper functions
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
      
      // Parse file using service
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file) => {
    setIsUploading(true);
    
    try {
      const parsedData = await parseResume(file);
      setPreviewData(parsedData);
    } catch (err) {
      setError('Error parsing resume. Please try another file.');
      console.error(err);
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

  return (
    <div className="resume-upload-container">
      <h2>Upload Your Resume</h2>
      <div className={`upload-area ${file ? 'uploaded' : ''}`}>
        {!file ? (
          <div className="upload-prompt">
            <div className="upload-icon">📁</div>
            <p>Drag & drop your resume here or click to browse</p>
            <p className="file-types">Supports PDF, DOCX (Max 5MB)</p>
            <input
              type="file"
              id="file-input"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button 
              className="browse-button" 
              onClick={() => document.getElementById('file-input').click()}
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="upload-success">
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <span className="file-size">Size: {formatFileSize(file.size)}</span>
            </div>
            
            {isUploading ? (
              <div className="uploading-progress">
                <div className="spinner"></div>
                <p>Analyzing your resume...</p>
              </div>
            ) : previewData ? (
              <div className="preview-section">
                <h3>Parsed Resume Data</h3>
                <div className="parsed-data">
                  <div className="data-item">
                    <strong>Name:</strong> {previewData.extractedData.name}
                  </div>
                  <div className="data-item">
                    <strong>Email:</strong> {previewData.extractedData.email}
                  </div>
                  <div className="data-item">
                    <strong>Phone:</strong> {previewData.extractedData.phone}
                  </div>
                  <div className="data-item">
                    <strong>Location:</strong> {previewData.extractedData.address}
                  </div>
                  <div className="data-item">
                    <strong>Technical Skills:</strong> {previewData.extractedData.skills.technical.slice(0, 5).join(', ')}...
                  </div>
                  <div className="data-item">
                    <strong>Experience Count:</strong> {previewData.extractedData.experience.length} positions
                  </div>
                  <div className="data-item">
                    <strong>Education:</strong> {previewData.extractedData.education[0]?.degree || 'Not specified'}
                  </div>
                  <div className="data-item">
                    <strong>Certifications:</strong> {previewData.extractedData.certifications.length} certs
                  </div>
                  <div className="data-item">
                    <strong>Completeness Score:</strong> {Math.round(previewData.extractionMetadata.completenessScore * 100)}%
                  </div>
                  <div className="data-item">
                    <strong>Confidence Level:</strong> {Math.round(previewData.extractionConfidence * 100)}%
                  </div>
                  {previewData.extractionMetadata.validationIssues.length > 0 && (
                    <div className="validation-warning">
                      <strong>Validation Issues:</strong>
                      <ul>
                        {previewData.extractionMetadata.validationIssues.map((issue, index) => (
                          <li key={index} className="warning-item">⚠️ {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="action-buttons">
                  <button className="analyze-button" onClick={handleUpload}>
                    Analyze Resume
                  </button>
                  <button className="reset-button" onClick={handleReset}>
                    Upload Different File
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ResumeUpload;