import React, { useState } from 'react';
import './ResumeTemplates.css';

const ResumeTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean and contemporary design with clear sections',
      preview: 'https://placehold.co/300x400/e2e8f0/64748b?text=Modern+Template'
    },
    {
      id: 'classic',
      name: 'Classic Executive',
      description: 'Traditional layout with professional appearance',
      preview: 'https://placehold.co/300x400/f1f5f9/475569?text=Classic+Template'
    },
    {
      id: 'creative',
      name: 'Creative Designer',
      description: 'Visually appealing with creative elements',
      preview: 'https://placehold.co/300x400/f8fafc/0f172a?text=Creative+Template'
    },
    {
      id: 'minimal',
      name: 'Minimalist',
      description: 'Simple and clean design focusing on content',
      preview: 'https://placehold.co/300x400/fefefe/1e293b?text=Minimal+Template'
    }
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    setShowTemplates(false);
    alert(`Template "${templates.find(t => t.id === templateId).name}" selected! In a real application, this would apply the template to your resume.`);
  };

  return (
    <div className="resume-templates-container">
      <div className="templates-header">
        <h2>Professional Resume Templates</h2>
        <p>Choose from our collection of ATS-friendly templates designed to make your resume stand out</p>
      </div>

      <div className="current-template">
        <h3>Current Template: {templates.find(t => t.id === selectedTemplate)?.name}</h3>
        <div className="template-preview">
          <img 
            src={templates.find(t => t.id === selectedTemplate)?.preview} 
            alt={`Preview of ${templates.find(t => t.id === selectedTemplate)?.name} template`}
          />
        </div>
        <button className="apply-template-btn" onClick={() => alert('Template applied successfully!')}>
          Apply Current Template
        </button>
      </div>

      <div className="template-gallery">
        <div className="gallery-header">
          <h3>Browse All Templates</h3>
          <button className="browse-btn" onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>
        </div>

        {showTemplates && (
          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <img 
                  src={template.preview} 
                  alt={template.name}
                  className="template-image"
                />
                <div className="template-info">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <button 
                    className={`select-btn ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {selectedTemplate === template.id ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="template-features">
        <h3>Why Our Templates Work</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h4>ATS Compatible</h4>
            <p>All templates are designed to pass through Applicant Tracking Systems (ATS) without issues.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h4>Professional Design</h4>
            <p>Clean layouts that look great to hiring managers and recruiters.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h4>Easy Customization</h4>
            <p>Simply input your information and our system generates your perfect resume.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h4>Industry Specific</h4>
            <p>Templates tailored to different industries and job types.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplates;