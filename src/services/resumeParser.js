import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

/**
 * Resume Parser Service
 * Connects to the backend to parse resume files
 */
const parseResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  try {
    const response = await axios.post(`${API_URL}/resume/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to parse resume');
    }
  } catch (error) {
    console.error('Error in parseResume service:', error);
    throw new Error(error.response?.data?.error || 'Error connecting to the parsing server. Make sure the backend is running.');
  }
};

/**
 * Advanced AI analysis service
 */
const analyzeResume = async (resumeData) => {
  try {
    const response = await axios.post(`${API_URL}/resume/analyze`, { resumeData });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to analyze resume');
    }
  } catch (error) {
    console.error('Error in analyzeResume service:', error);
    throw new Error(error.response?.data?.error || 'Error connecting to the analysis server.');
  }
};

/**
 * Keyword matching service
 */
const matchKeywords = async (resumeData, jobDescription) => {
  try {
    const response = await axios.post(`${API_URL}/resume/match-keywords`, {
      resumeData,
      jobDescription
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to match keywords');
    }
  } catch (error) {
    console.error('Error in matchKeywords service:', error);
    throw new Error(error.response?.data?.error || 'Error connecting to the keyword matcher server.');
  }
};

/**
 * AI Advice service
 */
const generateResumeAdvice = async (message, resumeData, analysisResults) => {
  try {
    const response = await axios.post(`${API_URL}/resume/advice`, {
      message,
      resumeData,
      analysisResults
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to get AI advice');
    }
  } catch (error) {
    console.error('Error in generateResumeAdvice service:', error);
    if (error.response) {
      // Re-throw with more context
      const newErr = new Error(error.response.data.error || 'Server error');
      newErr.response = error.response;
      throw newErr;
    }
    throw new Error('Error connecting to the advice server. Check if backend is running.');
  }
};

export {
  parseResume,
  analyzeResume,
  matchKeywords,
  generateResumeAdvice
};
