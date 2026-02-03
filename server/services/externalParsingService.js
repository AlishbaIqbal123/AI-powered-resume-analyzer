/**
 * External Resume Parsing Service
 * Integrates with third-party resume parsing APIs for enhanced accuracy
 */

const axios = require('axios');

// Configuration for different external APIs
const API_CONFIGS = {
  RAPIDAPI_RESUMEPARSER: {
    url: 'https://resume-parsing-api2.p.rapidapi.com/processDocument',
    host: 'resume-parsing-api2.p.rapidapi.com',
    requiredFields: ['name', 'email', 'phone', 'skills', 'experience', 'education']
  },
  RAPIDAPI_CVPARSER: {
    url: 'https://cv-parser-pro.p.rapidapi.com/parse',
    host: 'cv-parser-pro.p.rapidapi.com',
    requiredFields: ['personal_info', 'work_experience', 'education', 'skills']
  },

};

class ExternalParsingService {
  constructor(apiKey, apiType = 'RAPIDAPI_RESUMEPARSER') {
    this.apiKey = apiKey;
    this.apiType = apiType;
    this.config = API_CONFIGS[apiType];
    
    if (!this.apiKey) {
      console.warn('No API key provided for external parsing service');
    }
  }

  /**
   * Parse resume using external API
   * @param {Buffer} fileBuffer - The resume file buffer
   * @param {string} filename - The original filename
   * @returns {Promise<Object>} Parsed resume data
   */
  async parseResume(fileBuffer, filename) {
    if (!this.apiKey) {
      throw new Error('API key is required for external parsing service');
    }

    try {
      console.log(`Parsing resume with ${this.apiType} API: ${filename}`);
      
      // Prepare the request based on API type
      const requestData = await this.prepareRequestData(fileBuffer, filename);
      
      // Make the API call
      const response = await axios(requestData);
      
      // Process and normalize the response
      const parsedData = this.normalizeApiResponse(response.data);
      
      return parsedData;
    } catch (error) {
      console.error(`External parsing failed (${this.apiType}):`, error.message);
      
      // Check if it's a 404 error specifically
      if (error.response && error.response.status === 404) {
        console.log('API endpoint not found - this API may not be available or has changed endpoints');
        return null; // Return null instead of throwing to allow fallback
      }
      
      // For other errors, return null to allow fallback to internal parsing
      return null;
    }
  }

  /**
   * Try alternative API configurations if the primary one fails
   */
  async tryAlternativeApi(fileBuffer, filename) {
    // No alternative API configurations available since we've updated to the correct endpoint
    console.log('No alternative API configurations available');
    return null;
  }

  /**
   * Prepare request data based on API type
   */
  async prepareRequestData(fileBuffer, filename) {
    // For the Resume Parsing API2, based on testing, we need to send multipart form data
    if (this.apiType === 'RAPIDAPI_RESUMEPARSER') {
      // Use FormData for multipart request
      const formData = new FormData();
      
      // Create a blob from the buffer
      const fileBlob = new Blob([fileBuffer], { type: this.getFileType(filename) });
      formData.append('file', fileBlob, filename);
      
      // Add extraction details as JSON string
      const extractionDetails = {
        name: "Resume - Extraction",
        language: "English",
        fields: [
          {
            key: "personal_info",
            description: "personal information of the person",
            type: "object",
            properties: [
              { key: "name", description: "name of the person", example: "Alex Smith", type: "string" },
              { key: "email", description: "email of the person", example: "alex.smith@gmail.com", type: "string" },
              { key: "phone", description: "phone of the person", example: "0712 123 123", type: "string" },
              { key: "address", description: "address of the person", example: "Bucharest, Romania", type: "string" }
            ]
          },
          {
            key: "work_experience",
            description: "work experience of the person",
            type: "array",
            items: {
              type: "object",
              properties: [
                { key: "title", description: "title of the job", example: "Software Engineer", type: "string" },
                { key: "start_date", description: "start date of the job", example: "2022", type: "string" },
                { key: "end_date", description: "end date of the job", example: "2023", type: "string" },
                { key: "company", description: "company of the job", example: "Fastapp Development", type: "string" },
                { key: "location", description: "location of the job", example: "Bucharest, Romania", type: "string" },
                { key: "description", description: "description of the job", example: "Designing and implementing server-side logic to ensure high performance and responsiveness of applications.", type: "string" }
              ]
            }
          },
          {
            key: "education",
            description: "school education of the person",
            type: "array",
            items: {
              type: "object",
              properties: [
                { key: "title", description: "title of the education", example: "Master of Science in Computer Science", type: "string" },
                { key: "start_date", description: "start date of the education", example: "2022", type: "string" },
                { key: "end_date", description: "end date of the education", example: "2023", type: "string" },
                { key: "institute", description: "institute of the education", example: "Bucharest Academy of Economic Studies", type: "string" },
                { key: "location", description: "location of the education", example: "Bucharest, Romania", type: "string" },
                { key: "description", description: "description of the education", example: "Advanced academic degree focusing on developing a deep understanding of theoretical foundations and practical applications of computer technology.", type: "string" }
              ]
            }
          },
          {
            key: "languages",
            description: "languages spoken by the person",
            type: "array",
            items: { type: "string", example: "English" }
          },
          {
            key: "skills",
            description: "skills of the person",
            type: "array",
            items: { type: "string", example: "NodeJS" }
          },
          {
            key: "certificates",
            description: "certificates of the person",
            type: "array",
            items: { type: "string", example: "AWS Certified Developer - Associate" }
          }
        ]
      };
      
      formData.append('extractionDetails', JSON.stringify(extractionDetails));
      
      console.log(`Preparing multipart request for ${filename}, file size: ${fileBuffer.length} bytes`);
      
      return {
        method: 'POST',
        url: this.config.url,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.config.host,
          // Don't set Content-Type manually - let FormData set it with boundary
        },
        data: formData
      };
    }
    // For other API types, use the original form data approach
    else {
      const formData = new FormData();
      
      // Create a blob from the buffer
      const fileBlob = new Blob([fileBuffer], { type: this.getFileType(filename) });
      formData.append('file', fileBlob, filename);
      
      // Additional extraction details for ResumeParserAPI
      if (this.apiType === 'RAPIDAPI_CVPARSER') {
        formData.append('extractionDetails', JSON.stringify({
          name: "Resume - Extraction",
          language: "English",
          fields: [
            {
              key: "personal_info",
              description: "personal information of the person",
              type: "object",
              properties: [
                { key: "name", description: "name of the person", example: "Alex Smith", type: "string" },
                { key: "email", description: "email of the person", example: "alex.smith@gmail.com", type: "string" },
                { key: "phone", description: "phone of the person", example: "0712 123 123", type: "string" },
                { key: "address", description: "address of the person", example: "Bucharest, Romania", type: "string" }
              ]
            },
            {
              key: "work_experience",
              description: "work experience of the person",
              type: "array",
              items: {
                type: "object",
                properties: [
                  { key: "title", description: "title of the job", example: "Software Engineer", type: "string" },
                  { key: "start_date", description: "start date of the job", example: "2022", type: "string" },
                  { key: "end_date", description: "end date of the job", example: "2023", type: "string" },
                  { key: "company", description: "company of the job", example: "Fastapp Development", type: "string" },
                  { key: "location", description: "location of the job", example: "Bucharest, Romania", type: "string" },
                  { key: "description", description: "description of the job", example: "Designing and implementing server-side logic to ensure high performance and responsiveness of applications.", type: "string" }
                ]
              }
            }
          ]
        }));
      }

      return {
        method: 'POST',
        url: this.config.url,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.config.host,
          'Content-Type': 'multipart/form-data'
        },
        data: formData
      };
    }
  }

  /**
   * Get appropriate file type for the given filename
   */
  getFileType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Normalize API response to match our internal structure
   */
  normalizeApiResponse(apiResponse) {
    // This is a simplified normalization - in reality, you'd map the specific 
    // API response structure to your internal structure
    const normalized = {
      name: apiResponse.name || apiResponse.personal_info?.name || null,
      email: apiResponse.email || apiResponse.personal_info?.email || null,
      phone: apiResponse.phone || apiResponse.personal_info?.phone || null,
      address: apiResponse.address || apiResponse.personal_info?.address || null,
      experience: apiResponse.work_experience || apiResponse.experience || [],
      education: apiResponse.education || [],
      skills: apiResponse.skills || [],
      languages: apiResponse.languages || [],
      certificates: apiResponse.certificates || []
    };

    return normalized;
  }

  /**
   * Validate if the parsed data meets minimum requirements
   */
  validateParsedData(parsedData) {
    const requiredFields = this.config.requiredFields;
    const missingFields = requiredFields.filter(field => !parsedData[field]);
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      completeness: (requiredFields.length - missingFields.length) / requiredFields.length
    };
  }
}

module.exports = ExternalParsingService;