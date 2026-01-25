/**
 * Helper utilities for the AI-Powered Resume Analyzer
 */

// Format file sizes in human-readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type for resume uploads
export const isValidResumeType = (file) => {
  const validTypes = [
    'application/pdf',           // PDF
    'application/msword',        // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
  ];
  
  return validTypes.includes(file.type);
};

// Validate file size (max 5MB)
export const isValidResumeSize = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  return file.size <= maxSize;
};

// Sanitize text input to prevent XSS
export const sanitizeText = (text) => {
  if (!text) return '';
  
  // Remove script tags and other potentially harmful content
  const tempElement = document.createElement('div');
  tempElement.textContent = text;
  return tempElement.innerHTML;
};

// Calculate progress percentage
export const calculateProgress = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Generate a random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Format dates consistently
export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Check if a string contains any of the specified keywords
export const containsAnyKeyword = (text, keywords) => {
  if (!text || !keywords || !Array.isArray(keywords)) return false;
  
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
};

// Extract email from text
export const extractEmail = (text) => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
};

// Extract phone number from text
export const extractPhone = (text) => {
  const phoneRegex = /[+]?[1-9][\d]{0,15}/g;
  const matches = text.match(phoneRegex);
  return matches ? matches[0] : null;
};