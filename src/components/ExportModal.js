import React, { useState } from 'react';
import { exportResumeAnalysis, exportImprovedResume } from '../services/exportService';
import './ExportModal.css';

const ExportModal = ({ isOpen, onClose, resumeData, analysisResults }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('analysis'); // 'analysis' or 'improved'

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportType === 'analysis') {
        await exportResumeAnalysis(resumeData, analysisResults, selectedFormat);
      } else {
        await exportImprovedResume(resumeData, analysisResults);
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h3>Export Your Results</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="export-modal-body">
          <div className="export-type-selector">
            <h4>What would you like to export?</h4>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="exportType"
                  value="analysis"
                  checked={exportType === 'analysis'}
                  onChange={(e) => setExportType(e.target.value)}
                />
                <span className="radio-label">Analysis Report</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="exportType"
                  value="improved"
                  checked={exportType === 'improved'}
                  onChange={(e) => setExportType(e.target.value)}
                />
                <span className="radio-label">Improved Resume Suggestions</span>
              </label>
            </div>
          </div>
          
          {exportType === 'analysis' && (
            <div className="export-format-selector">
              <h4>Select Export Format</h4>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={selectedFormat === 'pdf'}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  />
                  <span className="radio-label">PDF (Report)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={selectedFormat === 'json'}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  />
                  <span className="radio-label">JSON (Data)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="format"
                    value="docx"
                    checked={selectedFormat === 'docx'}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  />
                  <span className="radio-label">DOCX (Document)</span>
                </label>
              </div>
            </div>
          )}
          
          <div className="export-summary">
            <h4>Export Summary</h4>
            <div className="summary-details">
              <p><strong>File:</strong> {resumeData?.fileName}</p>
              <p><strong>Type:</strong> {exportType === 'analysis' ? 'Analysis Report' : 'Improved Resume Suggestions'}</p>
              {exportType === 'analysis' && <p><strong>Format:</strong> {selectedFormat.toUpperCase()}</p>}
              <p><strong>Score:</strong> {analysisResults?.overallScore || 0}%</p>
            </div>
          </div>
        </div>
        
        <div className="export-modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button 
            className="export-btn" 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;