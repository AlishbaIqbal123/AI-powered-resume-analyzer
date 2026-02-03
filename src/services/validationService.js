// Validation Service for Resume Parser
// Centralized validation and quality checking functions

/**
 * Comprehensive validation for extracted resume data
 * @param {Object} parsedData - The parsed resume data object
 * @returns {Object} Validation results with detailed feedback
 */
export const validateResumeData = (parsedData) => {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    qualityScore: 0,
    fieldScores: {}
  };

  const data = parsedData.extractedData;
  
  // Field validation checks
  const fieldValidators = {
    name: {
      required: true,
      validator: (value) => {
        if (!value) return { valid: false, message: 'Name is required' };
        if (value.length < 2) return { valid: false, message: 'Name is too short' };
        if (value.length > 100) return { valid: false, message: 'Name is too long' };
        return { valid: true };
      }
    },
    email: {
      required: true,
      validator: (value) => {
        if (!value) return { valid: false, message: 'Email is required' };
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return { valid: false, message: 'Invalid email format' };
        return { valid: true };
      }
    },
    phone: {
      required: false,
      validator: (value) => {
        if (!value) return { valid: true }; // Optional field
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return { valid: false, message: 'Invalid phone number format' };
        }
        return { valid: true };
      }
    },
    experience: {
      required: false,
      validator: (value) => {
        if (!value || !Array.isArray(value)) return { valid: true };
        if (value.length === 0) return { valid: true };
        
        // Validate each experience entry
        for (let i = 0; i < value.length; i++) {
          const exp = value[i];
          if (!exp.company || exp.company.trim().length === 0) {
            return { valid: false, message: `Experience entry ${i + 1}: Company name is required` };
          }
          if (!exp.position || exp.position.trim().length === 0) {
            return { valid: false, message: `Experience entry ${i + 1}: Position is required` };
          }
        }
        return { valid: true };
      }
    },
    education: {
      required: false,
      validator: (value) => {
        if (!value || !Array.isArray(value)) return { valid: true };
        if (value.length === 0) return { valid: true };
        
        // Validate each education entry
        for (let i = 0; i < value.length; i++) {
          const edu = value[i];
          if (!edu.institution || edu.institution.trim().length === 0) {
            return { valid: false, message: `Education entry ${i + 1}: Institution name is required` };
          }
          if (!edu.degree || edu.degree.trim().length === 0) {
            return { valid: false, message: `Education entry ${i + 1}: Degree is required` };
          }
        }
        return { valid: true };
      }
    }
  };

  // Validate each field
  Object.keys(fieldValidators).forEach(field => {
    const validator = fieldValidators[field];
    const value = data[field];
    const result = validator.validator(value);
    
    validationResults.fieldScores[field] = result.valid ? 1 : 0;
    
    if (!result.valid) {
      if (validator.required) {
        validationResults.isValid = false;
        validationResults.errors.push(`${field}: ${result.message}`);
      } else {
        validationResults.warnings.push(`${field}: ${result.message}`);
      }
    }
  });

  // Calculate overall quality score
  const totalFields = Object.keys(fieldValidators).length;
  const validFields = Object.values(validationResults.fieldScores).filter(score => score === 1).length;
  validationResults.qualityScore = validFields / totalFields;

  return validationResults;
};

/**
 * Calculate completeness score for resume data
 * @param {Object} data - Extracted resume data
 * @returns {number} Completeness score between 0 and 1
 */
export const calculateCompletenessScore = (data) => {
  const isMeaningful = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      return !['', 'null', 'unknown', 'n/a', 'not provided', 'undefined', 'string', 'none'].includes(lower);
    }
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  };
  
  const requiredFields = ['name', 'email', 'phone'];
  const optionalFields = ['address', 'github', 'linkedin', 'summary'];
  const arrayFields = ['experience', 'education', 'skills'];
  
  let score = 0;
  let total = requiredFields.length + optionalFields.length + arrayFields.length;
  
  requiredFields.forEach(field => {
    if (data[field] && isMeaningful(data[field])) score++;
  });
  
  optionalFields.forEach(field => {
    if (data[field] && isMeaningful(data[field])) score++;
  });
  
  arrayFields.forEach(field => {
    if (data[field] && Array.isArray(data[field]) && data[field].length > 0) score++;
  });
  
  return score / total;
};

/**
 * Calculate confidence scores for each extracted field
 * @param {Object} parsedData - Parsed resume data
 * @returns {Object} Confidence scores for each field
 */
export const calculateConfidenceScores = (parsedData) => {
  const data = parsedData.extractedData;
  const scores = {};
  
  // Name confidence (0-1)
  scores.name = data.name ? 
    (data.name.length > 3 && data.name.split(' ').length >= 2 ? 0.9 : 0.6) : 0;
  
  // Email confidence (0-1)
  scores.email = data.email ? 
    (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? 0.95 : 0.3) : 0;
  
  // Phone confidence (0-1)
  scores.phone = data.phone ? 
    (/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/[\s\-\(\)]/g, '')) ? 0.9 : 0.4) : 0;
  
  // Experience confidence (0-1)
  if (Array.isArray(data.experience) && data.experience.length > 0) {
    const validEntries = data.experience.filter(exp => 
      exp.company && exp.position && exp.company.trim() && exp.position.trim()
    ).length;
    scores.experience = validEntries / data.experience.length;
  } else {
    scores.experience = 0;
  }
  
  // Education confidence (0-1)
  if (Array.isArray(data.education) && data.education.length > 0) {
    const validEntries = data.education.filter(edu => 
      edu.institution && edu.degree && edu.institution.trim() && edu.degree.trim()
    ).length;
    scores.education = validEntries / data.education.length;
  } else {
    scores.education = 0;
  }
  
  // Overall confidence
  const fieldCount = Object.keys(scores).length;
  scores.overall = Object.values(scores).reduce((sum, score) => sum + score, 0) / fieldCount;
  
  return scores;
};

/**
 * Detect data quality issues and provide suggestions
 * @param {Object} parsedData - Parsed resume data
 * @returns {Object} Quality analysis with suggestions
 */
export const analyzeDataQuality = (parsedData) => {
  const data = parsedData.extractedData;
  const issues = [];
  const suggestions = [];
  
  // Check for common issues
  if (data.name && data.name.toLowerCase().includes('name')) {
    issues.push('Name field contains placeholder text');
    suggestions.push('Replace "Name" placeholder with actual name');
  }
  
  if (data.email && data.email.toLowerCase().includes('email')) {
    issues.push('Email field contains placeholder text');
    suggestions.push('Replace "Email" placeholder with actual email');
  }
  
  if (data.phone && data.phone.toLowerCase().includes('phone')) {
    issues.push('Phone field contains placeholder text');
    suggestions.push('Replace "Phone" placeholder with actual phone number');
  }
  
  // Check for duplicate entries
  if (Array.isArray(data.experience)) {
    const companies = data.experience.map(exp => exp.company?.toLowerCase().trim()).filter(Boolean);
    const uniqueCompanies = [...new Set(companies)];
    if (companies.length !== uniqueCompanies.length) {
      issues.push('Duplicate experience entries detected');
      suggestions.push('Remove duplicate work experiences');
    }
  }
  
  if (Array.isArray(data.education)) {
    const institutions = data.education.map(edu => edu.institution?.toLowerCase().trim()).filter(Boolean);
    const uniqueInstitutions = [...new Set(institutions)];
    if (institutions.length !== uniqueInstitutions.length) {
      issues.push('Duplicate education entries detected');
      suggestions.push('Remove duplicate education entries');
    }
  }
  
  // Check for completeness
  const completeness = calculateCompletenessScore(data);
  if (completeness < 0.5) {
    issues.push('Resume appears incomplete');
    suggestions.push('Add missing required information (name, email, phone)');
  }
  
  return {
    issues,
    suggestions,
    completeness,
    hasIssues: issues.length > 0
  };
};

export default {
  validateResumeData,
  calculateCompletenessScore,
  calculateConfidenceScores,
  analyzeDataQuality
};