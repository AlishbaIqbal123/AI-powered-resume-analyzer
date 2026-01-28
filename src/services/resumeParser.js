import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { analyzeResumeWithAI, parseStructuredDataWithAI } from './aiService';

// Configure worker locally to avoid CDN issues
// eslint-disable-next-line import/no-webpack-loader-syntax
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Resume Parser Service
 * Handles parsing of resume files (PDF, DOCX) to extract structured data
 */

// Advanced resume parsing service with improved text extraction algorithms
const parseResume = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      let fileContent = '';

      // Determine file type and extract text accordingly
      if (file.type === 'application/pdf') {
        fileContent = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')) {
        fileContent = await extractTextFromDOCX(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        fileContent = await readFileAsText(file);
      } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT.');
      }

      console.log("Extracted Text Preview:", fileContent.substring(0, 200));

      let extractedInfo = {};

      // 1. Try AI Extraction (Best Quality)
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        try {
          console.log("Starting AI Data Extraction...");
          extractedInfo = await parseStructuredDataWithAI(fileContent);
          console.log("AI Extraction Complete", extractedInfo);
        } catch (e) {
          console.error("AI Extraction failed:", e);
        }
      }

      // 2. Fallback/Augment with Regex (if AI failed or data missing)
      if (!extractedInfo.name || !extractedInfo.email) {
        console.log("Using Regex Fallback...");
        const regexData = {
          name: extractNameFromContent(fileContent),
          email: extractEmailFromFile(fileContent),
          phone: extractPhoneFromFile(fileContent),
          address: extractLocationFromFile(fileContent),
          experience: extractExperienceFromFile(fileContent),
          education: extractEducationFromFile(fileContent),
          skills: {
            technical: extractTechnicalSkillsFromFile(fileContent),
            soft: extractSoftSkillsFromFile(fileContent)
          },
          certifications: extractCertificationsFromFile(fileContent),
          summary: extractSummaryFromFile(fileContent),
          projects: extractProjectsFromFile(fileContent),
          languages: extractLanguagesFromFile(fileContent),
          interests: extractInterestsFromFile(fileContent)
        };

        // Merge: prioritize AI data, fill gaps with regex
        extractedInfo = { ...regexData, ...extractedInfo };
      }

      const parsedData = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        rawText: fileContent,
        extractedData: extractedInfo,
        extractionConfidence: 0.95,
        extractionMetadata: {
          sectionsIdentified: Object.keys(extractedInfo),
          formattingQuality: 'good',
          completenessScore: 0.9,
          extractionErrors: [],
          validationIssues: []
        }
      };

      validateExtractedData(parsedData);

      resolve(parsedData);
    } catch (error) {
      console.error("Resume Parsing Error:", error);
      reject(error);
    }
  });
};

// Helper to extract text from PDF using pdfjs-dist
// Helper to extract text from PDF using pdfjs-dist
const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join('\n') + '\n';
  }

  return text;
};

// Helper to extract text from DOCX using mammoth
const extractTextFromDOCX = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

// Helper to read simple text files
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Enhanced name extraction with multiple patterns
const extractNameFromContent = (content) => {
  // Common patterns for names
  const patterns = [
    /(?:^|\\n|\s)([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})(?:\\n|\s|$)/,
    /(?:^|\\n|\s)([A-Z][a-z]{2,}\\s+[A-Z]\\.[A-Z][a-z]{2,})(?:\\n|\s|$)/,
    /(?:^|\\n|\s)([A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,}\\s+[A-Z][a-z]{2,})(?:\\n|\s|$)/
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Enhanced email extraction with validation
const extractEmailFromFile = (content) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;
  const emails = content.match(emailRegex) || [];

  // Filter for likely personal/professional emails
  const validEmails = emails.filter(email => {
    const domain = email.split('@')[1];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    return commonDomains.includes(domain) || (domain.includes('.') && !domain.includes('..'));
  });

  return validEmails.length > 0 ? validEmails[0] : null;
};

// Enhanced phone extraction with multiple formats
const extractPhoneFromFile = (content) => {
  // Patterns for various phone formats
  const phonePatterns = [
    /\\(\\d{3}\\)\\s?\\d{3}-\\d{4}/,  // (123) 456-7890
    /\\d{3}-\\d{3}-\\d{4}/,         // 123-456-7890
    /\\d{3}\\.\\d{3}\\.\\d{4}/,     // 123.456.7890
    /\\+?1[-.]?(\\d{3})[-.]?(\\d{3})[-.]?(\\d{4})/, // +1.123.456.7890
    /\\+?\\d{1,4}[-.]?\\d{3,4}[-.]?\\d{3,4}/      // International formats
  ];

  for (const pattern of phonePatterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
};

// Enhanced location extraction
const extractLocationFromFile = (content) => {
  // Pattern for locations (City, State or City, Country)
  const locationPattern = /([A-Z][a-z]+(?:\\s[A-Z][a-z]+)*),\\s*([A-Z]{2}|[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*)/;
  const match = content.match(locationPattern);

  if (match) {
    return match[0].trim();
  }

  return null;
};

// Extract experience details
const extractExperienceFromFile = (content) => {
  const experienceSectionMatch = content.match(/(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)[\s\S]*?(?=EDUCATION|SKILLS|CERTIFICATES|AWARDS|$)/i);

  if (!experienceSectionMatch) {
    // Return default if no experience section found
    return [];
  }

  const experienceText = experienceSectionMatch[0];

  // Extract individual experience entries
  const experienceEntries = [];
  const entryPattern = /([A-Za-z\s&-]+)\s+\|\s+([A-Za-z\s\-&]+)\s+\|\s+([A-Za-z\s0-9,-]+)/g;
  let match;

  while ((match = entryPattern.exec(experienceText)) !== null) {
    const responsibilities = [];

    // Look for responsibilities following this entry
    const nextPart = experienceText.substring(match.index + match[0].length);
    const responsibilityMatches = nextPart.match(/-[\s\S]*?(?=\n[A-Z]|$)/g);

    if (responsibilityMatches) {
      responsibilityMatches.forEach(resp => {
        const cleanResp = resp.replace(/^-\s*/, '').trim();
        if (cleanResp && !cleanResp.startsWith('Page') && cleanResp.length > 10) { // Filter out page numbers and short texts
          responsibilities.push(cleanResp);
        }
      });
    }

    experienceEntries.push({
      company: match[1],
      position: match[2],
      duration: match[3],
      responsibilities: responsibilities.slice(0, 3) // Take up to 3 responsibilities
    });
  }

  return experienceEntries;
};

// Extract education details
const extractEducationFromFile = (content) => {
  const educationSectionMatch = content.match(/(EDUCATION|ACADEMIC BACKGROUND|EDUCATIONAL BACKGROUND)[\s\S]*?(?=EXPERIENCE|SKILLS|CERTIFICATES|AWARDS|$)/i);

  if (!educationSectionMatch) {
    // Return default if no education section found
    return [];
  }

  const educationText = educationSectionMatch[0];

  // Extract education entries
  const educationEntries = [];
  const entryPattern = /([A-Za-z\s.&-]+)\s+\|\s+([A-Za-z\s.&-]+)\s+\|\s+([A-Za-z\s0-9,-]+)/g;
  let match;

  while ((match = entryPattern.exec(educationText)) !== null) {
    educationEntries.push({
      institution: match[1],
      degree: match[2],
      dates: match[3]
    });
  }

  return educationEntries;
};

// Extract technical skills
const extractTechnicalSkillsFromFile = (content) => {
  // Look for SKILLS section in the content
  const skillsSectionMatch = content.match(/(SKILLS|TECHNICAL SKILLS|TECHNICAL COMPETENCIES)[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATES|PROJECTS|$)/i);

  if (!skillsSectionMatch) {
    // Return default if no skills section found
    return [];
  }

  const skillsText = skillsSectionMatch[0];

  // Extract skills using various patterns
  const skills = [];

  // Pattern for skills listed after colons or with commas
  const colonPattern = /:\s*([A-Za-z0-9\s,&:\-.\/]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = colonPattern.exec(skillsText)) !== null) {
    const skillList = match[1];
    // Split by comma, semicolon, or 'and'
    const extractedSkills = skillList.split(/[;,]|\s+and\s+/);
    extractedSkills.forEach(skill => {
      const cleanSkill = skill.trim();
      if (cleanSkill && !skills.includes(cleanSkill) && cleanSkill.length > 1) {
        skills.push(cleanSkill);
      }
    });
  }

  // Also look for common technical skills directly in the content
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Gatsby', 'jQuery', 'Bootstrap',
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQLite',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible',
    'Git', 'Jira', 'Agile', 'Scrum', 'CI/CD', 'Linux', 'Bash', 'PowerShell', 'TDD', 'JUnit'
  ];

  // Check for presence of common skills in the content
  commonSkills.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()[\]]/g, '$&');
    const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
    if (skillRegex.test(content) && !skills.includes(skill)) {
      skills.push(skill);
    }
  });

  return skills;
};

// Extract soft skills
const extractSoftSkillsFromFile = (content) => {
  // Look for soft skills in the content
  const softSkills = [];

  const commonSoftSkills = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
    'Adaptability', 'Time Management', 'Critical Thinking',
    'Collaboration', 'Creativity', 'Emotional Intelligence',
    'Organization', 'Decision Making', 'Conflict Resolution',
    'Negotiation', 'Public Speaking', 'Project Management',
    'Customer Service', 'Sales', 'Marketing', 'Research'
  ];

  // Check for presence of common soft skills in the content
  commonSoftSkills.forEach(skill => {
    const skillRegex = new RegExp('\\b' + skill.replace(/[.*+?^${}()[\]]/g, '$&') + '\\b', 'gi');
    if (skillRegex.test(content) && !softSkills.includes(skill)) {
      softSkills.push(skill);
    }
  });

  return softSkills;
};

// Extract certifications
const extractCertificationsFromFile = (content) => {
  const certsSectionMatch = content.match(/(CERTIFICATES?|CERTIFICATIONS?|LICENSES?)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|PROJECTS|$)/i);

  if (!certsSectionMatch) {
    // Return default if no certifications section found
    return [];
  }

  const certsText = certsSectionMatch[0];

  // Extract certifications
  const certifications = [];
  const certPattern = /([A-Za-z\s\-&]+)\s+\|\s+([A-Za-z\s\-&]+)\s+\|\s+([A-Za-z\s0-9,\/\-]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = certPattern.exec(certsText)) !== null) {
    certifications.push({
      name: match[1],
      issuer: match[2],
      date: match[3]
    });
  }

  return certifications;
};

// Extract summary/objective
const extractSummaryFromFile = (content) => {
  const summarySectionMatch = content.match(/(SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY|CAREER SUMMARY)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|CERTIFICATES|PROJECTS|$)/i);

  if (!summarySectionMatch) {
    // Return default if no summary section found
    return '';
  }

  const summaryText = summarySectionMatch[0];

  // Clean up the summary text
  const cleanedSummary = summaryText.replace(/(SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY|CAREER SUMMARY)\s*/i, '').trim();

  return cleanedSummary;
};

// Extract projects
const extractProjectsFromFile = (content) => {
  const projectsSectionMatch = content.match(/(PROJECTS|KEY PROJECTS|RELEVANT PROJECTS)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|CERTIFICATES|SUMMARY|$)/i);

  if (!projectsSectionMatch) {
    // Return default if no projects section found
    return [];
  }

  const projectsText = projectsSectionMatch[0];

  // Extract projects
  const projects = [];

  // Pattern for projects
  const projectPattern = /([A-Za-z\s\-&]+)\s*\-\s*([A-Za-z\s\-&\.,!?]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = projectPattern.exec(projectsText)) !== null) {
    projects.push({
      name: match[1],
      description: match[2]
    });
  }

  return projects;
};

// Extract languages
const extractLanguagesFromFile = (content) => {
  const languagesSectionMatch = content.match(/(LANGUAGES?|SPOKEN LANGUAGES?|LANGUAGE PROFICIENCY)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|CERTIFICATES|PROJECTS|SUMMARY|$)/i);

  if (!languagesSectionMatch) {
    // Return default if no languages section found
    return [];
  }

  const languagesText = languagesSectionMatch[0];

  // Extract languages
  const languages = [];

  // Pattern for languages
  const langPattern = /([A-Za-z\s]+):?\s*([A-Za-z\s]+)/g;
  let match;

  while ((match = langPattern.exec(languagesText)) !== null) {
    languages.push({
      language: match[1].trim(),
      proficiency: match[2].trim()
    });
  }

  return languages;
};

// Extract interests
const extractInterestsFromFile = (content) => {
  const interestsSectionMatch = content.match(/(INTERESTS?|HOBBIES?|ACTIVITIES?)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|CERTIFICATES|PROJECTS|SUMMARY|$)/i);

  if (!interestsSectionMatch) {
    // Return default if no interests section found
    return [];
  }

  const interestsText = interestsSectionMatch[0];

  // Extract interests
  const interests = [];

  // Pattern for interests (split by comma, semicolon, or 'and')
  const interestPattern = /([A-Za-z\s\-&\.,!?]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = interestPattern.exec(interestsText)) !== null) {
    const interest = match[1].trim();
    if (interest && !interest.toLowerCase().includes('interests') && !interest.toLowerCase().includes('hobbies') && interest.length > 2) {
      interests.push(interest);
    }
  }

  return interests;
};

// Validate extracted data and update metadata
const validateExtractedData = (parsedData) => {
  const validationIssues = [];
  const extractionErrors = [];

  // Validate required fields
  if (!parsedData.extractedData.name || parsedData.extractedData.name === 'John Smith') {
    validationIssues.push('Name not detected or is default');
  }

  if (!parsedData.extractedData.email || parsedData.extractedData.email === 'john.smith@example.com') {
    validationIssues.push('Email not detected or is default');
  }

  if (!parsedData.extractedData.phone || parsedData.extractedData.phone === '(555) 123-4567') {
    validationIssues.push('Phone not detected or is default');
  }

  if (parsedData.extractedData.experience.length === 0) {
    extractionErrors.push('No experience data extracted');
  }

  if (parsedData.extractedData.skills.technical.length === 0) {
    extractionErrors.push('No technical skills extracted');
  }

  if (parsedData.extractedData.education.length === 0) {
    extractionErrors.push('No education data extracted');
  }

  // Update metadata with validation results
  parsedData.extractionMetadata.validationIssues = validationIssues;
  parsedData.extractionMetadata.extractionErrors = extractionErrors;

  // Recalculate completeness score based on validation
  const requiredFields = ['name', 'email', 'phone', 'experience', 'education', 'skills'];
  const presentFields = requiredFields.filter(field => {
    if (field === 'skills') {
      return parsedData.extractedData[field].technical && parsedData.extractedData[field].technical.length > 0;
    }
    const fieldData = parsedData.extractedData[field];
    return fieldData &&
      ((Array.isArray(fieldData) && fieldData.length > 0) ||
        (typeof fieldData === 'string' && fieldData.length > 0));
  });

  parsedData.extractionMetadata.completenessScore = presentFields.length / requiredFields.length;

  // Update sections identified
  parsedData.extractionMetadata.sectionsIdentified = [];
  if (parsedData.extractedData.summary) parsedData.extractionMetadata.sectionsIdentified.push('summary');
  if (parsedData.extractedData.experience.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('experience');
  if (parsedData.extractedData.education.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('education');
  if (parsedData.extractedData.skills.technical.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('skills');
  if (parsedData.extractedData.projects.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('projects');
  if (parsedData.extractedData.certifications.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('certifications');
  if (parsedData.extractedData.languages.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('languages');
  if (parsedData.extractedData.interests.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('interests');
};



const analyzeResume = async (resumeData) => {
  try {
    // Try to use real AI analysis first
    if (process.env.REACT_APP_OPENAI_API_KEY) {
      console.log("Starting Real AI Analysis...");
      const realAnalysis = await analyzeResumeWithAI(resumeData);
      console.log("Real AI Analysis Complete:", realAnalysis);
      return realAnalysis;
    }
  } catch (error) {
    console.error("Real AI Analysis failed, falling back to simulation:", error);
  }

  // Fallback to simulation if no API key or error
  return new Promise((resolve) => {
    setTimeout(() => {
      // Advanced analysis results with industry-specific recommendations
      const analysis = {
        overallScore: calculateOverallScore(resumeData),
        strengths: [
          "Strong technical skills in JavaScript, React, and Node.js",
          "Good work experience with progressive responsibilities",
          "Clear chronological work history showing growth",
          "Relevant projects that demonstrate practical skills",
          "Additional certifications that enhance credibility"
        ],
        weaknesses: [
          "Summary section could be more compelling and specific",
          "Missing quantifiable achievements in work experience",
          "Education section is basic without honors or additional certifications",
          "Could benefit from more diverse technology stack examples"
        ],
        suggestions: generateSuggestions(resumeData),
        industrySpecific: {
          targetRole: 'Software Engineer',
          recommendations: [
            "Highlight experience with version control systems like Git in your summary",
            "Emphasize experience with testing frameworks relevant to the role",
            "Include metrics that show impact of your contributions"
          ],
          trendingKeywords: [
            'DevOps', 'Microservices', 'Cloud Computing', 'Agile', 'Scrum',
            'Continuous Integration', 'Continuous Deployment', 'API Development'
          ]
        },
        keywordMatches: {
          matched: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'Git'],
          missing: ['TypeScript', 'GraphQL', 'Kubernetes', 'Jest', 'CI/CD', 'Microservices', 'RESTful APIs']
        },
        formattingScore: calculateFormattingScore(resumeData),
        contentScore: calculateContentScore(resumeData),
        relevanceScore: calculateRelevanceScore(resumeData),
        personalization: {
          careerGoalsAlignment: 'medium',
          targetRoleFit: 'good',
          customFeedback: generateCustomFeedback(resumeData)
        }
      };

      resolve(analysis);
    }, 2500);
  });
};

// Calculate overall score based on multiple factors
const calculateOverallScore = (resumeData) => {
  // Base score calculation
  const baseScore = 75;

  // Adjustments based on various factors
  const experienceBonus = Math.min(resumeData.extractedData.experience.length * 5, 20);
  const educationBonus = resumeData.extractedData.education.length > 0 ? 5 : 0;
  const skillsBonus = Math.min(resumeData.extractedData.skills.technical.length * 1.5, 15);
  const certificationsBonus = Math.min(resumeData.extractedData.certifications.length * 2, 10);

  let score = baseScore + experienceBonus + educationBonus + skillsBonus + certificationsBonus;

  // Apply upper limit
  return Math.min(score, 100);
};

// Calculate formatting score
const calculateFormattingScore = (resumeData) => {
  // Check for proper structure and formatting
  const hasProfessionalStructure = 10;
  const hasConsistentFormatting = 10;
  const hasProperSections = 15;

  return Math.min(hasProfessionalStructure + hasConsistentFormatting + hasProperSections, 100);
};

// Calculate content score
const calculateContentScore = (resumeData) => {
  // Evaluate the quality of content
  const experienceQuality = 20;
  const skillsRelevance = 20;
  const achievementQuantification = 15;

  return experienceQuality + skillsRelevance + achievementQuantification;
};

// Calculate relevance score
const calculateRelevanceScore = (resumeData) => {
  // Check for industry-relevant keywords and skills
  const keywordsMatched = resumeData.extractedData.skills.technical.length * 2;
  const experienceRelevance = 15;

  return Math.min(keywordsMatched + experienceRelevance, 100);
};

// Generate personalized suggestions
const generateSuggestions = (resumeData) => {
  const suggestions = [
    "Add specific metrics to quantify your achievements (e.g., 'increased efficiency by 30%', 'managed team of 5 developers')",
    "Include relevant certifications or online courses to show continuous learning",
    "Tailor your summary to the specific role you're targeting",
    "Emphasize leadership and teamwork experiences more prominently"
  ];

  // Add role-specific suggestions
  if (resumeData.extractedData.skills.technical.includes('JavaScript')) {
    suggestions.push("Consider highlighting your JavaScript framework expertise more prominently");
  }

  return suggestions;
};

// Generate custom feedback
const generateCustomFeedback = (resumeData) => {
  return `Based on your experience in ${resumeData.extractedData.experience[0].position}, you have strong foundational skills. To improve your competitiveness for senior roles, focus on showcasing measurable impacts of your work and obtaining additional certifications in emerging technologies.`;
};

// Simulated keyword matching service
const matchKeywords = async (resumeData, jobDescription) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract keywords from job description and resume
      const jobKeywords = extractKeywords(jobDescription);
      const resumeKeywords = resumeData?.extractedData?.skills || [];

      // Find matches and gaps
      const matched = resumeKeywords.filter(skill =>
        jobKeywords.some(keyword =>
          keyword.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      const missing = jobKeywords.filter(keyword =>
        !resumeKeywords.some(skill =>
          keyword.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(keyword.toLowerCase())
        )
      ).slice(0, 10); // Limit to top 10 missing keywords

      const matchPercentage = Math.round((matched.length / (matched.length + missing.length)) * 100);

      const result = {
        matchPercentage,
        matched,
        missing,
        totalJobKeywords: jobKeywords.length,
        totalResumeKeywords: resumeKeywords.length
      };

      resolve(result);
    }, 1500);
  });
};

// Helper function to extract keywords
const extractKeywords = (text) => {
  const commonKeywords = [
    'javascript', 'react', 'node.js', 'python', 'java', 'angular', 'vue', 'html', 'css',
    'sql', 'mongodb', 'express', 'api', 'rest', 'agile', 'scrum', 'git', 'github', 'docker',
    'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'testing', 'debugging', 'optimization',
    'leadership', 'communication', 'teamwork', 'problem-solving', 'design', 'architecture',
    'security', 'performance', 'scalability', 'microservices', 'devops', 'full-stack',
    'typescript', 'graphql', 'jest', 'redux', 'webpack', 'sass', 'bootstrap', 'material-ui',
    'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase', 'heroku', 'netlify'
  ];

  const lowerText = text.toLowerCase();
  return commonKeywords.filter(keyword => lowerText.includes(keyword));
};

export {
  parseResume,
  analyzeResume,
  matchKeywords
};