/**
 * Comprehensive Test Suite for Resume Parser Service
 * Tests all major functionality and edge cases
 */

import { 
  extractEmailFromFile, 
  extractPhoneFromFile, 
  extractEducationFromFile,
  extractExperienceFromFile,
  extractTechnicalSkillsFromFile,
  extractSoftSkillsFromFile,
  extractBusinessSkillsFromFile,
  extractEducationSkillsFromFile,
  extractHealthcareEducationFromFile,
  extractEducationEducationFromFile,
  extractBusinessEducationFromFile,
  extractEngineeringEducationFromFile,
  extractCreativeEducationFromFile,
  extractGenericEducation,
  parseResume,
  calculateConfidenceScores,
  validateExtractedData
} from './resumeParser';

// Mock file object for testing
const createMockFile = (content, type = 'text/plain', name = 'test.txt') => ({
  type,
  name,
  arrayBuffer: async () => new TextEncoder().encode(content).buffer,
  text: async () => content
});

// Test data
const sampleResumeContent = `
John Doe
Email: john.doe@example.com
Phone: +92 318 0623294
Location: Lahore, Pakistan

EXPERIENCE
Software Engineer at TechCorp (2020-Present)
- Developed web applications using React and Node.js
- Led team of 5 developers
- Improved system performance by 40%

EDUCATION
Bachelor of Science in Computer Science
University of Engineering and Technology, Lahore (2016-2020)
GPA: 3.7/4.0

SKILLS
Technical: JavaScript, React, Node.js, Python, SQL
Soft: Communication, Leadership, Problem Solving
Business: Project Management, Strategic Planning
Education: Curriculum Development, Instructional Design

CERTIFICATIONS
AWS Certified Developer
Google Cloud Professional
`;

describe('Resume Parser Service', () => {
  
  describe('Email Extraction', () => {
    test('should extract standard email format', () => {
      const content = 'Contact me at john.doe@example.com';
      const result = extractEmailFromFile(content);
      expect(result).toBe('john.doe@example.com');
    });

    test('should extract email with various TLDs', () => {
      const content = 'Email: user@domain.co.uk';
      const result = extractEmailFromFile(content);
      expect(result).toBe('user@domain.co.uk');
    });

    test('should handle encoded emails', () => {
      const content = 'Contact: user [at] domain [dot] com';
      const result = extractEmailFromFile(content);
      expect(result).toBe('user@domain.com');
    });

    test('should return null for invalid content', () => {
      const content = 'No email here';
      const result = extractEmailFromFile(content);
      expect(result).toBeNull();
    });
  });

  describe('Phone Extraction', () => {
    test('should extract Pakistani format with spaces', () => {
      const content = 'Phone: +92 318 0623294';
      const result = extractPhoneFromFile(content);
      expect(result).toBe('+92 318 0623294');
    });

    test('should extract compact Pakistani format', () => {
      const content = 'Mobile: +923180623294';
      const result = extractPhoneFromFile(content);
      expect(result).toBe('+923180623294');
    });

    test('should extract with hyphens', () => {
      const content = 'Tel: +92-318-0623294';
      const result = extractPhoneFromFile(content);
      expect(result).toBe('+92-318-0623294');
    });

    test('should return null for invalid phone numbers', () => {
      const content = 'Phone: 123';
      const result = extractPhoneFromFile(content);
      expect(result).toBeNull();
    });
  });

  describe('Education Extraction', () => {
    test('should extract education entries with various formats', () => {
      const content = `
        EDUCATION
        Bachelor of Science in Computer Science
        University of Engineering and Technology (2016-2020)
        Master of Business Administration
        Lahore University of Management Sciences (2020-2022)
      `;
      
      const result = extractEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle industry-specific education extraction', () => {
      // Test healthcare education
      const healthcareContent = 'Medical Doctor MD from Aga Khan University Hospital';
      const healthcareResult = extractHealthcareEducationFromFile(healthcareContent);
      expect(Array.isArray(healthcareResult)).toBe(true);
      
      // Test business education
      const businessContent = 'MBA from Wharton School of Business';
      const businessResult = extractBusinessEducationFromFile(businessContent);
      expect(Array.isArray(businessResult)).toBe(true);
    });

    test('should fall back to generic education when specific not found', () => {
      const genericContent = 'Degree in Something from Some University';
      const result = extractGenericEducation(genericContent);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Experience Extraction', () => {
    test('should extract experience with company and position', () => {
      const content = `
        EXPERIENCE
        Software Engineer at TechCorp (2020-Present)
        - Developed applications
        - Led development team
      `;
      
      const result = extractExperienceFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('company');
        expect(result[0]).toHaveProperty('position');
      }
    });

    test('should handle various date formats', () => {
      const content = 'Worked at Company (Jan 2020 - Present)';
      const result = extractExperienceFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Skills Extraction', () => {
    test('should extract technical skills', () => {
      const content = 'Technical Skills: JavaScript, React, Node.js, Python';
      const result = extractTechnicalSkillsFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should extract soft skills', () => {
      const content = 'Soft Skills: Communication, Leadership, Teamwork';
      const result = extractSoftSkillsFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should extract business skills', () => {
      const content = 'Business Skills: Project Management, Strategic Planning';
      const result = extractBusinessSkillsFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should extract education skills', () => {
      const content = 'Education Skills: Curriculum Development, Instructional Design';
      const result = extractEducationSkillsFromFile(content);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Industry-Specific Education Functions', () => {
    test('should extract healthcare education', () => {
      const content = 'Medical Doctor MD from Aga Khan University';
      const result = extractHealthcareEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should extract education sector education', () => {
      const content = 'Bachelor of Education from Teachers College';
      const result = extractEducationEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should extract business education', () => {
      const content = 'MBA from Harvard Business School';
      const result = extractBusinessEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should extract engineering education', () => {
      const content = 'Bachelor of Engineering from MIT';
      const result = extractEngineeringEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should extract creative education', () => {
      const content = 'Bachelor of Fine Arts from Rhode Island School of Design';
      const result = extractCreativeEducationFromFile(content);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Validation and Confidence Scoring', () => {
    test('should calculate confidence scores', () => {
      const testData = {
        extractedData: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+92 318 0623294',
          experience: [{ company: 'TechCorp', position: 'Engineer' }],
          education: [{ institution: 'University', degree: 'BS' }],
          skills: {
            technical: ['JavaScript'],
            soft: ['Communication']
          }
        }
      };
      
      const result = calculateConfidenceScores(testData);
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('overall');
      expect(typeof result.overall).toBe('number');
    });

    test('should validate extracted data', () => {
      const testData = {
        extractedData: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+92 318 0623294'
        }
      };
      
      const result = validateExtractedData(testData);
      expect(result).toHaveProperty('validationIssues');
      expect(result).toHaveProperty('extractionErrors');
      expect(result).toHaveProperty('confidenceScores');
    });
  });

  describe('Performance and Memoization', () => {
    test('should cache results for repeated calls', () => {
      const content = 'Email: test@example.com Phone: +92 318 0623294';
      
      // First call
      const start1 = performance.now();
      const email1 = extractEmailFromFile(content);
      const phone1 = extractPhoneFromFile(content);
      const end1 = performance.now();
      
      // Second call (should be faster due to memoization)
      const start2 = performance.now();
      const email2 = extractEmailFromFile(content);
      const phone2 = extractPhoneFromFile(content);
      const end2 = performance.now();
      
      expect(email1).toBe(email2);
      expect(phone1).toBe(phone2);
      // Second call should be significantly faster (cached)
      expect(end2 - start2).toBeLessThan(end1 - start1);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed input gracefully', () => {
      const malformedContent = 'This is not a proper resume content with no structure';
      const result = extractEducationFromFile(malformedContent);
      expect(Array.isArray(result)).toBe(true);
      // Should return empty array rather than throw error
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty content', () => {
      const emptyContent = '';
      const emailResult = extractEmailFromFile(emptyContent);
      const phoneResult = extractPhoneFromFile(emptyContent);
      
      expect(emailResult).toBeNull();
      expect(phoneResult).toBeNull();
    });
  });

  // Integration test
  describe('Complete Parsing Integration', () => {
    test('should parse complete resume content', async () => {
      const mockFile = createMockFile(sampleResumeContent, 'text/plain', 'resume.txt');
      
      // Mock the file reading functions that parseResume depends on
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Service unavailable'
      });
      
      const result = await parseResume(mockFile);
      
      expect(result).toHaveProperty('extractedData');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('validation');
      
      const data = result.extractedData;
      expect(data.name).toBeDefined();
      expect(data.email).toBeDefined();
      expect(data.phone).toBeDefined();
      expect(Array.isArray(data.experience)).toBe(true);
      expect(Array.isArray(data.education)).toBe(true);
    }, 10000); // 10 second timeout for async test
  });
});

// Test helper functions
describe('Helper Functions', () => {
  test('should handle special characters in content', () => {
    const content = 'Email with special chars: user+tag@example.com';
    const result = extractEmailFromFile(content);
    expect(result).toBe('user+tag@example.com');
  });

  test('should handle multiple matches', () => {
    const content = 'Emails: first@test.com and second@example.org';
    const result = extractEmailFromFile(content);
    // Should return the first valid email
    expect(result).toBe('first@test.com');
  });
});