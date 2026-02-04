const {
  parseStructuredDataWithAI: aiDataExtractor,
  analyzeResumeWithAI: aiAnalyzer,
  matchJobDescriptionWithAI: aiMatcher,
  generateResumeAdvice
} = require('./aiService');
const Resume = require('../models/Resume');
const { GEMINI_API_KEY } = process.env;
console.log("ResumeParser Service initialized. API Key Present:", !!GEMINI_API_KEY);
const { GoogleGenerativeAI } = require('@google/generative-ai');
/**
 * Resume Parser Service
 * Handles parsing of resume files (PDF, DOCX) to extract structured data
 */

// Advanced resume parsing service with improved text extraction algorithms
const parseResume = async (fileData) => {
  try {
    const fileContent = fileData.content;

    if (!fileContent || fileContent.trim().length < 20) {
      throw new Error('The document appears to be empty or unreadable. Please ensure it is not a scanned image.');
    }

    console.log("Extracted Text Preview:", fileContent.substring(0, 200));

    let aiExtractedData = {};

    // 1. Try AI Extraction (Best Quality)
    if (GEMINI_API_KEY && typeof aiDataExtractor === 'function') {
      try {
        console.log("Starting Gemini AI Data Extraction...");
        aiExtractedData = await aiDataExtractor(fileContent);
        console.log("Gemini AI Extraction Complete");
      } catch (e) {
        console.error("Gemini Extraction failed, falling back to regex:", e);
      }
    }

    // 2. Fallback/Augment with Regex
    console.log("Augmenting with Regex Fallback...");
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

    // Intelligent Merge: prioritize AI but fill empty fields with regex
    const finalData = { ...regexData };

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

    if (aiExtractedData) {
      Object.keys(aiExtractedData).forEach(key => {
        const val = aiExtractedData[key];
        if (key === 'skills' && val) {
          if (isMeaningful(val.technical)) finalData.skills.technical = val.technical;
          if (isMeaningful(val.soft)) finalData.skills.soft = val.soft;
        } else if (isMeaningful(val)) {
          finalData[key] = val;
        }
      });
    }

    const parsedData = {
      fileName: fileData.name,
      fileSize: (fileData.size / 1024).toFixed(2) + ' KB',
      rawText: fileContent,
      extractedData: finalData,
      extractionConfidence: aiExtractedData ? 0.95 : 0.6,
      extractionMetadata: {
        method: aiExtractedData ? 'AI-Augmented' : 'Heuristic-Only',
        timestamp: new Date().toISOString(),
        sectionsIdentified: Object.keys(finalData).filter(k => isMeaningful(finalData[k])),
        formattingQuality: 'analyzing',
        completenessScore: 0,
        extractionErrors: [],
        validationIssues: []
      }
    };

    validateExtractedData(parsedData);
    return parsedData;
  } catch (error) {
    console.error("Critical Resume Parsing Error:", error);
    throw error;
  }
};

// Enhanced name extraction with multiple patterns
const extractNameFromContent = (content) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  // Strategy 1: Look for prominent name patterns at the top
  // Increased range to top 20 lines to catch headers with images/logos
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];

    // Check for explicit name labels
    if (/^(Name|Candidate Name|Full Name):\s*(.+)/i.test(line)) {
      const match = line.match(/^(Name|Candidate Name|Full Name):\s*(.+)/i);
      if (match && match[2].trim().length > 3) {
        return match[2].trim();
      }
    }

    // Skip if it looks like a header or section title, but be careful not to skip names that are just uppercase
    if (/^(CURRICULUM|RESUME|CV|CONTACT|PROFILE|EXPERIENCE|ABOUT|EDUCATION|SKILLS|PROJECTS|CERTIFICATES?|AWARDS?|INTERESTS?)$/i.test(line)) continue;

    // Pattern: Full name with proper capitalization (most common)
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]*)?$/.test(line)) {
      return line.trim();
    }

    // Pattern: ALL CAPS name (e.g. JOHN DOE)
    if (/^[A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)?$/.test(line) && line.split(' ').length <= 4 && line.length > 5) {
      return line.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
    }

    // Pattern: Name with potential title (Mr., Ms., Dr., etc.)
    if (/^(MR\.?|MS\.?|MRS\.?|DR\.?|MISS|MR|MRS)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i.test(line)) {
      const match = line.match(/(MR\.?|MS\.?|MRS\.?|DR\.?|MISS|MR|MRS)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      if (match) return match[2].trim();
    }

    // Pattern: Name with initials
    if (/^[A-Z]\.[A-Z]\.[A-Z][a-z]+/.test(line) || /^[A-Z][a-z]+\s+[A-Z]\.[A-Z]\./.test(line)) {
      return line.replace(/\s*[,.]?\s*/, ' ').trim();
    }
  }

  // Strategy 2: Look for name near contact info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we find email/phone, check surrounding lines for name
    if (line.includes('@') || /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(line)) {
      // Check previous lines
      for (let j = Math.max(0, i - 3); j < i; j++) {
        const prevLine = lines[j];
        if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(prevLine) && !prevLine.includes('INC') && !prevLine.includes('LLC')) {
          return prevLine.trim();
        }
      }
    }
  }

  return null;
};

// Enhanced email extraction with validation
const extractEmailFromFile = (content) => {
  // More comprehensive email pattern
  const emailRegex = /\b([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)\b/g;
  const matches = [...content.matchAll(emailRegex)];

  // Filter for more realistic emails
  const validEmails = matches
    .map(match => match[1])
    .filter(email => {
      // Basic validation checks
      const [localPart, domain] = email.split('@');
      return localPart && domain &&
        localPart.length > 0 && localPart.length <= 64 &&
        domain.length > 0 && domain.length <= 255 &&
        !localPart.startsWith('.') && !localPart.endsWith('.') &&
        !domain.startsWith('.') && !domain.endsWith('.') &&
        !localPart.includes('..') && !domain.includes('..');
    });

  if (validEmails.length > 0) {
    // Prefer emails that look more like personal addresses
    const personalEmails = validEmails.filter(email => {
      const domain = email.split('@')[1];
      return !domain.includes('company') && !domain.includes('inc') &&
        !domain.includes('corp') && !domain.includes('org') &&
        (domain.includes('gmail') || domain.includes('yahoo') ||
          domain.includes('outlook') || domain.includes('hotmail') ||
          domain.length <= 20); // Shorter domains are more likely personal
    });

    return personalEmails[0] || validEmails[0];
  }

  // Last resort fallback: return any email found by the broad regex if logic above was too strict
  const broadMatches = content.match(/[\w.-]+@[\w.-]+\.\w+/g);
  if (broadMatches && broadMatches.length > 0) {
    // Filter out obviously bad ones
    const filtered = broadMatches.filter(e => !e.startsWith('.') && !e.endsWith('.') && e.length > 5);
    if (filtered.length > 0) return filtered[0];
  }

  return null;
};

// Enhanced phone extraction with multiple formats
const extractPhoneFromFile = (content) => {
  // Comprehensive phone number patterns
  const phonePatterns = [
    // International formats
    /\+?\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{0,9}/g,
    // US formats
    /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/g,
    /\d{3}-\d{3}-\d{4}/g,
    /\d{3}\.\d{3}\.\d{4}/g,
    /\d{10}/g,  // Plain 10 digits
    /\d{3}-\d{4}/g, // Last 7 digits with dash
    // Extensions
    /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}\s*(ext|x|extension)\.?\s*\d+/gi,
    /\+?\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{0,9}\s*(ext|x|extension)\.?\s*\d+/gi
  ];

  const lines = content.split('\n');

  // First, look for phone numbers in the first few lines (usually contact info)
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];

    for (const pattern of phonePatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const phoneNumber = match[0].trim();

        // Validate phone number
        const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
          // Check if this line contains other indicators of contact info
          if (line.toLowerCase().includes('tel') || line.toLowerCase().includes('phone') ||
            line.toLowerCase().includes('mobile') || line.toLowerCase().includes('cell') ||
            line.toLowerCase().includes('contact')) {
            return phoneNumber;
          }

          // If no specific indicators, return the first valid number found
          return phoneNumber;
        }
      }
    }
  }

  // If not found in top lines, search the entire content
  for (const pattern of phonePatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const phoneNumber = match[0].trim();
      const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        return phoneNumber;
      }
    }
  }

  return null;
};

// Enhanced location extraction
const extractLocationFromFile = (content) => {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Define location patterns
  const patterns = [
    // City, State/Country patterns
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2,}|[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/, // City, State/Country
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*,\s*([A-Z]{2,})/, // City, ST
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+([A-Z]{2,})/, // City ST
    // Postal code patterns
    /\b\d{5}(?:-\d{4})?\b/, // US Zip code
    /\b[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]\b/i, // Canadian Postal Code
    /[A-Z]{1,2}\d[A-Z]?\s?\d[A-Z]{2}/i, // UK Postcode
    // Address patterns
    /\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)/i,
  ];

  // Strategy 1: Scan the first few lines (usually contact info)
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];

    // Skip if it looks like a job title or company name
    if (/(Inc|Ltd|LLC|Corp|Company|LLP|Software|Developer|Engineer|Manager|Director|Analyst|Designer|Consultant)/i.test(line)) continue;

    // Check for location indicators
    if (line.toLowerCase().includes('location') || line.toLowerCase().includes('city') ||
      line.toLowerCase().includes('state') || line.toLowerCase().includes('country') ||
      line.toLowerCase().includes('reside') || line.toLowerCase().includes('based')) {
      // Extract location from this line
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) return match[0].trim();
      }
    }

    // Just look for location patterns
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // Validate that it's likely a location
        const matchedText = match[0].trim();

        // Skip if it looks like a date or other non-location text
        if (/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/.test(matchedText)) continue;

        // Skip if it's just a number that's not a postal code
        if (/^\d+$/.test(matchedText) && matchedText.length !== 5) continue;

        return matchedText;
      }
    }
  }

  // Strategy 2: Broader scan with more context awareness
  for (const line of lines.slice(0, 20)) {
    // Check if line contains contact-related keywords
    if (/(contact|email|phone|mobile|tel|fax|address|location|reside|live|based)/i.test(line.toLowerCase())) {
      // Look for location patterns in contact-related lines
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) return match[0].trim();
      }
    }
  }

  // Strategy 3: Look for common city names
  const commonCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
    'San Diego', 'Dallas', 'San Jose', 'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto',
    'Vancouver', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Dubai', 'Singapore', 'Hong Kong',
    'Shanghai', 'Mumbai', 'São Paulo', 'Mexico City', 'Moscow', 'Istanbul'
  ];

  for (const line of lines.slice(0, 15)) {
    for (const city of commonCities) {
      if (line.includes(city) && !/(Inc|Ltd|Company|Corp|Software|Developer|Engineer)/i.test(line)) {
        // If we find a city name, try to extract more context
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) return match[0].trim();
        }
        return city; // If no full pattern matches, return just the city
      }
    }
  }

  return null;
};

const extractExperienceFromFile = (content) => {
  // Enhanced experience extraction with better section detection
  const experienceSectionMatch = content.match(/(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|WORKING EXPERIENCE|EMPLOYMENT|CAREER HISTORY)[\s\S]*?(?=(?:EDUCATION|ACADEMIC|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|$))/i);
  if (!experienceSectionMatch) return [];

  const experienceText = experienceSectionMatch[0];
  const entries = [];
  const lines = experienceText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  // Define common job title keywords to help identify positions
  const jobTitleKeywords = [
    'developer', 'engineer', 'manager', 'director', 'analyst', 'specialist',
    'consultant', 'architect', 'lead', 'senior', 'junior', 'intern', 'coordinator',
    'associate', 'executive', 'officer', 'president', 'vp', 'cto', 'ceo', 'founder'
  ];

  // Patterns for dates and durations
  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|Q\d)?\s*\d{4}/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for lines that contain dates (indicating experience entries)
    if (datePattern.test(line)) {
      const entry = {
        company: null,
        position: null,
        duration: line.match(/(?:\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|to\s*\w+)\s*[-\u2013\u2014\s]+(?:\d{4}|Present|Current)/gi)?.[0] || 'Duration specified',
        responsibilities: []
      };

      // Look for company and position in the current line and surrounding lines
      const searchContext = [];
      if (lines[i - 1]) searchContext.push(lines[i - 1]);
      searchContext.push(line);
      if (lines[i + 1]) searchContext.push(lines[i + 1]);

      for (const ctx of searchContext) {
        // Look for explicit labels (common in academic/government CVs)
        if (ctx.toLowerCase().startsWith('institute:') || ctx.toLowerCase().startsWith('organization:')) {
          entry.company = ctx.replace(/^(institute|organization):\s*/i, '').trim();
        }
        if (ctx.toLowerCase().startsWith('job title:') || ctx.toLowerCase().startsWith('position:')) {
          entry.position = ctx.replace(/^(job title|position):\s*/i, '').trim();
        }

        // Look for 'at' pattern (e.g., 'Software Engineer at Google')
        const atPattern = /^(.*?)\s+at\s+(.+)$/i;
        const atMatch = ctx.match(atPattern);
        if (atMatch) {
          entry.position = atMatch[1].trim();
          entry.company = atMatch[2].trim();
          break;
        }

        // Look for '|' pattern (e.g., 'Google | Software Engineer')
        const pipePattern = /^(.*?)\s*[|\-]\s*(.+)$/;
        const pipeMatch = ctx.match(pipePattern);
        if (pipeMatch) {
          const part1 = pipeMatch[1].trim();
          const part2 = pipeMatch[2].trim();

          // Determine which is company and which is position based on keywords
          const part1Lower = part1.toLowerCase();
          const part2Lower = part2.toLowerCase();

          if (jobTitleKeywords.some(keyword => part1Lower.includes(keyword))) {
            entry.position = part1;
            entry.company = part2;
          } else if (jobTitleKeywords.some(keyword => part2Lower.includes(keyword))) {
            entry.position = part2;
            entry.company = part1;
          } else {
            // Default: assume first part is company
            entry.company = part1;
            entry.position = part2;
          }
          break;
        }

        // If we find a company name pattern
        if (!entry.company && ctx.length < 100) {
          // Look for company-like names (avoiding obvious job titles)
          if (!jobTitleKeywords.some(keyword => ctx.toLowerCase().includes(keyword)) &&
            (ctx.includes('Inc') || ctx.includes('LLC') || ctx.includes('Corp') || ctx.includes('Ltd') ||
              ctx.length < 50 && !datePattern.test(ctx))) {
            entry.company = ctx;
          }
        }
      }

      // If we still don't have a position, try to infer from nearby text
      if (!entry.position) {
        // Look for job titles in nearby lines
        for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
          if (j !== i) {
            const nearbyLine = lines[j];
            if (jobTitleKeywords.some(keyword => nearbyLine.toLowerCase().includes(keyword))) {
              entry.position = nearbyLine;
              break;
            }
          }
        }
      }

      // Add responsibilities from following lines
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const nextLine = lines[j];

        // Stop if we encounter another date (next experience entry)
        if (datePattern.test(nextLine)) break;

        // Stop if we encounter a new section
        if (/^(EDUCATION|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?)/i.test(nextLine)) break;

        // Add to responsibilities if it looks like a bullet point or description
        if (nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.startsWith('•') ||
          nextLine.length > 10 && !datePattern.test(nextLine)) {
          entry.responsibilities.push(nextLine);
        }
      }

      // Only add if we have meaningful data
      if (entry.company || entry.position) {
        entries.push({
          company: entry.company || 'Company Not Specified',
          position: entry.position || 'Position Not Specified',
          duration: entry.duration,
          responsibilities: entry.responsibilities
        });
      }
    }
  }

  return entries.length > 0 ? entries.slice(0, 10) : [];
};

// Extract education details
const extractEducationFromFile = (content) => {
  const educationSectionMatch = content.match(/(EDUCATION|ACADEMIC BACKGROUND|EDUCATIONAL BACKGROUND|ACADEMIC QUALIFICATIONS|ACADEMIC INFORMATION|STUDIES|QUALIFICATIONS)[\s\S]*?(?=EXPERIENCE|WORKING|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|$)/i);

  if (!educationSectionMatch) {
    return [];
  }

  const educationText = educationSectionMatch[0];
  const lines = educationText.split('\n').map(l => l.trim().replace(/^[-*•]\s*/, '')).filter(l => l.length > 2); // Clean bullets
  const entries = [];

  const degreeKeywords = [
    'Bachelor', 'Master', 'PhD', 'Doctorate', 'Associate', 'Degree', 'Diploma', 'Certificate',
    'BS', 'BA', 'MS', 'MA', 'BSc', 'MSc', 'MBA', 'B.Sc', 'M.Sc', 'B.E', 'M.E'
  ];

  const schoolKeywords = [
    'University', 'College', 'School', 'Institute', 'Academy', 'Campus', 'Polytechnic', 'Faculty'
  ];

  let currentEntry = {};

  const isDate = (text) => /\b((?:19|20)\d{2}|Present|Current)\b/i.test(text);
  const isDegree = (text) => degreeKeywords.some(kw => text.toUpperCase().replace('.', '') === kw.toUpperCase() || text.includes(kw));
  const isSchool = (text) => schoolKeywords.some(kw => text.includes(kw)) || /^Institute:/i.test(text);

  lines.forEach(line => {
    // If line matches start of new entry (School), push old and start new
    if (isSchool(line)) {
      if (currentEntry.institution || currentEntry.degree) {
        entries.push(currentEntry);
      }
      currentEntry = { institution: line, degree: null, dates: null };
      return;
    }

    // Checking for degree
    if (isDegree(line)) {
      if (currentEntry.degree) {
        // If we already have a degree, this might be a second degree or new entry
        // If we have an institution, assume it's a new entry (unless double major?)
        // Let's assume new entry if we have institution
        if (currentEntry.institution) {
          entries.push(currentEntry);
          currentEntry = { institution: null, degree: line, dates: null };
        } else {
          // Replace/Append? Let's just update for now (simple)
          currentEntry.degree = line;
        }
      } else {
        currentEntry.degree = line;
      }
      return;
    }

    // Checking for date
    if (isDate(line)) {
      // Only if we don't have a date yet, or overwrite?
      currentEntry.dates = line;
      return;
    }
  });

  // Push final entry
  if (currentEntry.institution || currentEntry.degree) {
    entries.push(currentEntry);
  }

  return entries.map(e => ({
    institution: e.institution || 'Institution Not Specified',
    degree: e.degree || 'Degree Not Specified',
    dates: e.dates || 'Dates Not Specified'
  }));
};

// Extract technical skills
const extractTechnicalSkillsFromFile = (content) => {
  // Look for SKILLS section in the content
  const skillsSectionMatch = content.match(/(SKILLS|TECHNICAL SKILLS|TECHNICAL COMPETENCIES|TECHNICAL PROFICIENCIES)[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATES?|PROJECTS|LANGUAGES|INTERESTS?|$)/i);

  const skillsText = skillsSectionMatch ? skillsSectionMatch[0] : content;

  // Extract skills using various patterns
  const skills = new Set(); // Use Set to avoid duplicates

  // Pattern for skills listed after colons, hyphens, or in lists
  const patterns = [
    /:\s*([A-Za-z0-9\s,&:\-.\/]+)/g, // After colon
    /-\s*([A-Za-z0-9\s,&:\-.\/]+)/g,  // After dash (list items)
    /\*\s*([A-Za-z0-9\s,&:\-.\/]+)/g, // After asterisk (list items)
    /•\s*([A-Za-z0-9\s,&:\-.\/]+)/g,  // After bullet (list items)
    /([A-Za-z0-9\s,&:\-.\/]+);/g,     // Semicolon separated
    /([A-Za-z0-9\s,&:\-.\/]+),/g,     // Comma separated
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(skillsText)) !== null) {
      const skillList = match[1];
      // Split by comma, semicolon, slash, or 'and'
      const extractedSkills = skillList.split(/[;,\/]|\s+and\s+|\s+&\s+/);
      extractedSkills.forEach(skill => {
        const cleanSkill = skill.trim().replace(/[.]+$/, ''); // Remove trailing dots
        if (cleanSkill && cleanSkill.length > 1) {
          // Normalize skill names and filter noise
          const normalizedSkill = cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();

          // Noise filter: Blacklist degrees and common labels
          const blacklist = ['Msc', 'Bsc', 'M.sc', 'B.sc', 'Mphil', 'M.phil', 'Phd', 'Doctorate', 'Degree', 'Duration', 'Experience', 'Job', 'Title', 'Institute', 'Mathematics', 'Teaching'];
          if (!blacklist.includes(normalizedSkill)) {
            skills.add(normalizedSkill);
          }
        }
      });
    }
  }

  // Also look for common technical skills directly in the content
  const commonTechSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala',
    // Frontend Frameworks/Libraries
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Gatsby', 'jQuery', 'Bootstrap', 'Tailwind', 'Material UI',
    // Backend Technologies
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Rails',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQLite', 'Firebase',
    // Cloud Platforms
    'AWS', 'Azure', 'GCP', 'Heroku', 'Netlify', 'Vercel',
    // DevOps Tools
    'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible', 'GitLab CI', 'GitHub Actions',
    // Version Control & Collaboration
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'CI/CD', 'DevOps',
    // Other Technologies
    'Linux', 'Bash', 'PowerShell', 'GraphQL', 'REST', 'SOAP', 'JUnit', 'Selenium', 'Kafka'
  ];

  // Check for presence of common skills in the content
  commonTechSkills.forEach(skill => {
    try {
      // Properly escape special regex characters including + signs
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
      if (skillRegex.test(content)) {
        skills.add(skill);
      }
    } catch (err) {
      console.warn(`Skipping invalid regex for technical skill: ${skill}`, err);
    }
  });

  return Array.from(skills);
};

// Extract soft skills
const extractSoftSkillsFromFile = (content) => {
  // Look for soft skills in the content
  const softSkills = new Set();

  // Common soft skills
  const commonSoftSkills = [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving',
    'Adaptability', 'Time Management', 'Critical Thinking',
    'Collaboration', 'Creativity', 'Emotional Intelligence',
    'Organization', 'Decision Making', 'Conflict Resolution',
    'Negotiation', 'Public Speaking', 'Project Management',
    'Customer Service', 'Sales', 'Marketing', 'Research',
    'Analytical Thinking', 'Attention to Detail', 'Work Ethic',
    'Initiative', 'Flexibility', 'Interpersonal Skills'
  ];

  // Check for presence of common soft skills in the content
  commonSoftSkills.forEach(skill => {
    try {
      // Properly escape special regex characters including + signs
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
      if (skillRegex.test(content)) {
        softSkills.add(skill);
      }
    } catch (err) {
      console.warn(`Skipping invalid regex for soft skill: ${skill}`, err);
    }
  });

  // Also look in skills section if available
  const skillsSectionMatch = content.match(/(SKILLS|SOFT SKILLS|INTERPERSONAL SKILLS)[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATES?|PROJECTS|LANGUAGES|INTERESTS?|$)/i);

  if (skillsSectionMatch) {
    const skillsText = skillsSectionMatch[0];
    commonSoftSkills.forEach(skill => {
      // Properly escape special regex characters including + signs
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
      if (skillRegex.test(skillsText)) {
        softSkills.add(skill);
      }
    });
  }

  return Array.from(softSkills);
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
  const certPattern = /([A-Za-z\s\-&]+)(?:\s+\||-|\s)\s+([A-Za-z\s\-&]+)(?:\s+\||-|\s)\s+([A-Za-z\s0-9,\/\-]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = certPattern.exec(certsText)) !== null) {
    certifications.push({
      name: match[1]?.trim(),
      issuer: match[2]?.trim(),
      date: match[3]?.trim()
    });
  }

  return certifications;
};

// Extract summary/objective
const extractSummaryFromFile = (content) => {
  const summarySectionMatch = content.match(/(SUMMARY|OBJECTIVE|PROFESSIONAL SUMMARY|CAREER SUMMARY|CAREER OBJECTIVES|PERSONAL PROFILE|ABOUT ME)[\s\S]*?(?=EXPERIENCE|WORKING|EDUCATION|ACADEMIC|SKILLS|CERTIFICATES|PROJECTS|$)/i);

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
  const projectsSectionMatch = content.match(/(PROJECTS|KEY PROJECTS|RELEVANT PROJECTS|ACADEMIC PROJECTS|RESEARCH PUBLICATION|RESEARCH|PUBLICATIONS)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|CERTIFICATES|SUMMARY|$)/i);

  if (!projectsSectionMatch) {
    return [];
  }

  const projectsText = projectsSectionMatch[0];
  const lines = projectsText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const projects = [];
  let currentProject = {};

  const startNewProject = (name, description = '') => {
    if (currentProject.name) {
      projects.push(currentProject);
    }
    currentProject = { name, description: description ? [description] : [] };
  };

  const isBullet = (line) => /^[-*•]/.test(line);

  lines.forEach(line => {
    // 1. Check for "Name: Description" format
    const colonMatch = line.match(/^([A-Za-z0-9\s\-_&]+?)\s*:\s*(.+)$/);
    if (colonMatch && !isBullet(line) && colonMatch[1].length < 50) {
      startNewProject(colonMatch[1].trim(), colonMatch[2].trim());
      return;
    }

    // 2. Check for "Name | Tech" or "Name - Tech" format
    const pipeMatch = line.match(/^([A-Za-z0-9\s\-_&]+?)\s*[|\-]\s*(.+)$/);
    if (pipeMatch && !isBullet(line) && pipeMatch[1].length < 50) {
      startNewProject(pipeMatch[1].trim(), pipeMatch[2].trim());
      return;
    }

    // 3. Check for Bullet points (Description)
    if (isBullet(line)) {
      if (currentProject.name) {
        currentProject.description.push(line.replace(/^[-*•]\s*/, ''));
      }
      return;
    }

    // 4. Short line that looks like a title (and not a keyword like 'Project')
    if (line.length < 50 && /^[A-Z]/.test(line) && !line.toLowerCase().includes('project')) {
      startNewProject(line);
      return;
    }

    // 5. Append generic text to description if we have a project
    if (currentProject.name) {
      currentProject.description.push(line);
    }
  });

  if (currentProject.name) {
    projects.push(currentProject);
  }

  // Post-process: Join single-line descriptions or keep array
  return projects.map(p => ({
    name: p.name,
    description: p.description.join(' ')
  }));
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
  if (!parsedData.extractedData.name || parsedData.extractedData.name === 'John Smith' || parsedData.extractedData.name.toLowerCase().includes('name') || parsedData.extractedData.name.toLowerCase().includes('placeholder')) {
    validationIssues.push('Name not detected or is default');
  }

  if (!parsedData.extractedData.email || parsedData.extractedData.email === 'john.smith@example.com' || !parsedData.extractedData.email.includes('@') || parsedData.extractedData.email.toLowerCase().includes('email')) {
    validationIssues.push('Email not detected or is default');
  }

  if (!parsedData.extractedData.phone || parsedData.extractedData.phone === '(555) 123-4567' || parsedData.extractedData.phone.toLowerCase().includes('phone') || parsedData.extractedData.phone.length < 7) {
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

  // Validate address/location format
  if (parsedData.extractedData.address && typeof parsedData.extractedData.address === 'string') {
    const address = parsedData.extractedData.address.toLowerCase();
    if (address.includes('company') || address.includes('inc') || address.includes('llc') || address.includes('corp')) {
      validationIssues.push('Address appears to contain company name instead of personal location');
    }
  }

  // Validate experience entries
  if (parsedData.extractedData.experience && Array.isArray(parsedData.extractedData.experience)) {
    parsedData.extractedData.experience.forEach((exp, idx) => {
      if (!exp.company || exp.company.toLowerCase().includes('company') || exp.company.toLowerCase().includes('placeholder')) {
        validationIssues.push(`Experience entry ${idx + 1}: Company name appears to be a placeholder`);
      }
      if (!exp.position || exp.position.toLowerCase().includes('position') || exp.position.toLowerCase().includes('role')) {
        validationIssues.push(`Experience entry ${idx + 1}: Position appears to be a placeholder`);
      }
    });
  }

  // Validate education entries
  if (parsedData.extractedData.education && Array.isArray(parsedData.extractedData.education)) {
    parsedData.extractedData.education.forEach((edu, idx) => {
      if (!edu.institution || edu.institution.toLowerCase().includes('university') && edu.institution.toLowerCase() === 'university') {
        validationIssues.push(`Education entry ${idx + 1}: Institution appears to be a placeholder`);
      }
      if (!edu.degree || edu.degree.toLowerCase().includes('degree') || edu.degree.toLowerCase() === 'degree') {
        validationIssues.push(`Education entry ${idx + 1}: Degree appears to be a placeholder`);
      }
    });
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
        (typeof fieldData === 'string' && fieldData.length > 0 && !fieldData.toLowerCase().includes('not found')));
  });

  parsedData.extractionMetadata.completenessScore = presentFields.length / requiredFields.length;

  // Update sections identified
  parsedData.extractionMetadata.sectionsIdentified = [];
  if (parsedData.extractedData.summary && !parsedData.extractedData.summary.toLowerCase().includes('not found')) parsedData.extractionMetadata.sectionsIdentified.push('summary');
  if (parsedData.extractedData.experience.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('experience');
  if (parsedData.extractedData.education.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('education');
  if (parsedData.extractedData.skills.technical.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('technical_skills');
  if (parsedData.extractedData.skills.soft && parsedData.extractedData.skills.soft.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('soft_skills');
  if (parsedData.extractedData.projects.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('projects');
  if (parsedData.extractedData.certifications.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('certifications');
  if (parsedData.extractedData.languages.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('languages');
  if (parsedData.extractedData.interests.length > 0) parsedData.extractionMetadata.sectionsIdentified.push('interests');
};

const analyzeResume = async (resumeData) => {
  try {
    // Try to use real AI analysis first
    const realAnalysis = await aiAnalyzer(resumeData);
    console.log("AI Analysis Complete:", realAnalysis);
    return realAnalysis;
  } catch (aiError) {
    console.error("AI Analysis failed, falling back to simulation:", aiError);
    // Fallback to simulation if AI fails
    return new Promise((resolve) => {
      setTimeout(() => {
        // Advanced analysis results with industry-specific recommendations
        const analysis = {
          overallScore: calculateOverallScore(resumeData),
          scores: {
            ats: calculateFormattingScore(resumeData),
            keyword: calculateKeywordScore(resumeData),
            content: calculateContentScore(resumeData),
            relevance: calculateRelevanceScore(resumeData)
          },
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
            "Could benefit from more quantifiable achievements in your latest roles"
          ],
          improvements: generateDetailedImprovements(resumeData),
          industrySpecific: {
            targetRole: resumeData.extractedData.experience[0]?.position || 'Professional',
            recommendations: [
              "Tailor your summary to highlight Domain-Specific expertise",
              "Include metrics that show the tangible impact of your work",
              "Obtain specialized certifications relevant to your current trajectory"
            ],
            trendingKeywords: [
              'Strategic Leadership', 'Optimization', 'Digital Transformation', 'Analytical Thinking'
            ]
          },
          keywordMatches: {
            matched: resumeData.extractedData.skills.technical.slice(0, 5),
            missing: ['Advanced Methodologies', 'Strategic Planning', 'Process Optimization', 'Project Leadership']
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
  }
};

// Calculate overall score based on multiple factors
const calculateOverallScore = (resumeData) => {
  const ats = calculateFormattingScore(resumeData); // 30
  const keyword = calculateKeywordScore(resumeData); // 30
  const content = calculateContentScore(resumeData); // 20
  const relevance = calculateRelevanceScore(resumeData); // 20

  return ats + keyword + content + relevance;
};

// Calculate ATS formatting score (0-30)
const calculateFormattingScore = (resumeData) => {
  let score = 0;

  // Check for proper structure (10 points)
  if (resumeData.extractedData.name && resumeData.extractedData.email) {
    score += 10;
  }

  // Check for consistent sections (10 points)
  const sections = resumeData.extractionMetadata?.sectionsIdentified || [];
  if (sections.length >= 4) {
    score += 10;
  } else if (sections.length >= 2) {
    score += 5;
  }

  // Check for completeness (10 points)
  const completeness = resumeData.extractionMetadata?.completenessScore || 0;
  score += Math.round(completeness * 10);

  return Math.min(score, 30);
};

// Calculate content quality score (0-20)
const calculateContentScore = (resumeData) => {
  let score = 0;

  // Experience quality (8 points)
  const expCount = resumeData.extractedData.experience.length;
  if (expCount >= 3) {
    score += 8;
  } else if (expCount >= 1) {
    score += expCount * 2.5;
  }

  // Skills relevance (7 points)
  const techSkills = resumeData.extractedData.skills.technical.length;
  if (techSkills >= 10) {
    score += 7;
  } else if (techSkills >= 5) {
    score += 4;
  } else if (techSkills > 0) {
    score += 2;
  }

  // Additional sections (5 points)
  if (resumeData.extractedData.projects.length > 0) score += 2;
  if (resumeData.extractedData.certifications.length > 0) score += 2;
  if (resumeData.extractedData.summary && resumeData.extractedData.summary.length > 50) score += 1;

  return Math.min(Math.round(score), 20);
};

// Calculate keyword/relevance score (0-30 for keyword alignment)
const calculateKeywordScore = (resumeData) => {
  let score = 0;

  // Technical skills keyword density (15 points)
  const techSkills = resumeData.extractedData.skills.technical.length;
  if (techSkills >= 15) {
    score += 15;
  } else if (techSkills >= 10) {
    score += 12;
  } else if (techSkills >= 5) {
    score += 8;
  } else {
    score += techSkills * 1.5;
  }

  // Soft skills (5 points)
  const softSkills = resumeData.extractedData.skills.soft?.length || 0;
  score += Math.min(softSkills, 5);

  // Industry keywords in experience (10 points)
  const hasExperience = resumeData.extractedData.experience.length > 0;
  if (hasExperience) {
    score += 5;
    // Check if experience has detailed responsibilities
    const hasDetails = resumeData.extractedData.experience.some(exp =>
      exp.responsibilities && exp.responsibilities.length > 0
    );
    if (hasDetails) score += 5;
  }

  return Math.min(Math.round(score), 30);
};

// Calculate role relevance score (0-20)
const calculateRelevanceScore = (resumeData) => {
  let score = 0;

  // Education relevance (5 points)
  if (resumeData.extractedData.education.length > 0) {
    score += 5;
  }

  // Experience relevance (10 points)
  const expCount = resumeData.extractedData.experience.length;
  if (expCount >= 3) {
    score += 10;
  } else if (expCount >= 1) {
    score += expCount * 3;
  }

  // Additional qualifications (5 points)
  if (resumeData.extractedData.certifications.length > 0) score += 3;
  if (resumeData.extractedData.projects.length > 0) score += 2;

  return Math.min(Math.round(score), 20);
};

// Generate detailed improvements with action steps covering specific areas
const generateDetailedImprovements = (resumeData) => {
  const improvements = [
    {
      action: "Quantify Achievements",
      priority: "High",
      details: [
        "Review your work experience bullet points.",
        "Add specific metrics like 'Increased performance by 30%' or 'Managed $50k budget'.",
        "Use numbers to demonstrate the scale and impact of your work."
      ]
    },
    {
      action: "Enhance Summary",
      priority: "Medium",
      details: [
        "Rewrite your summary to be more targeted towards your desired role.",
        "Include years of experience, core skills, and key achievements.",
        "Avoid generic buzzwords; be specific about your value proposition."
      ]
    },
    {
      action: "Expand Technical Skills",
      priority: "Medium",
      details: [
        "Group your skills into categories (e.g., Languages, Frameworks, Tools).",
        "Include newer technologies that are in high demand.",
        "Ensure your skills match the keywords found in job descriptions you are interested in."
      ]
    },
    {
      action: "Optimize Format",
      priority: "Low",
      details: [
        "Ensure your resume has a clean, consistent layout.",
        "Use a standard font and appropriate font sizes.",
        "Check for any alignment issues or typos."
      ]
    }
  ];

  // Add dynamic improvement based on missing keywords if available
  if (resumeData.extractedData.skills.technical.length < 5) {
    improvements.push({
      action: "Add Key Technical Skills",
      priority: "High",
      details: [
        "Your resume seems to lack technical skills. Add relevant languages and tools.",
        "Look at job descriptions for your target role to identify missing keywords.",
        "List proficiency levels if applicable."
      ]
    });
  }

  return improvements;
};

// Generate custom feedback
const generateCustomFeedback = (resumeData) => {
  const latestPosition = resumeData.extractedData.experience[0]?.position || 'your field';
  return `Based on your experience in ${latestPosition}, you have strong foundational skills. To improve your competitiveness for senior roles, focus on showcasing measurable impacts of your work and obtaining additional certifications in emerging technologies.`;
};

// Simulated keyword matching service
const matchKeywords = async (resumeData, jobDescription) => {
  try {
    const result = await aiMatcher(resumeData, jobDescription);
    return result;
  } catch (aiError) {
    console.error("Job Description Matching failed, falling back to simulation:", aiError);
    return new Promise((resolve) => {
      setTimeout(() => {
        // Extract keywords from job description and resume
        const jobKeywords = extractKeywords(jobDescription);
        const resumeKeywords = [
          ...(resumeData?.extractedData?.skills?.technical || []),
          ...(resumeData?.extractedData?.skills?.soft || [])
        ];

        // Find matches and gaps
        const matched = jobKeywords.filter(keyword =>
          resumeKeywords.some(skill =>
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

        const matchPercentage = Math.round((matched.length / (matched.length + missing.length)) * 100) || 0;

        const recommendations = [
          `Incorporate ${missing.slice(0, 3).join(', ')} into your skills section to improve ATS visibility.`,
          `Highlight specific projects where you've used ${matched.slice(0, 2).join(' or ')} to demonstrate deeper expertise.`,
          `Tailor your professional summary to mention your experience with ${jobKeywords.slice(0, 2).join(' and ')}.`
        ];

        // Ensure at least 3 recommendations
        while (recommendations.length < 3) {
          recommendations.push("Optimize your resume layout for better scannability by using bullet points.");
        }

        const result = {
          matchPercentage,
          matched,
          missing,
          totalJobKeywords: jobKeywords.length,
          totalResumeKeywords: resumeKeywords.length,
          analysis: `Your profile has a ${matchPercentage}% semantic alignment with this role. You have strong matches in ${matched.slice(0, 3).join(', ')} but there are critical gaps in ${missing.slice(0, 3).join(', ')}.`,
          recommendations: recommendations
        };

        resolve(result);
      }, 1500);
    });
  }
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

const analyzeResumeWithAI = async (resumeData) => {
  return aiAnalyzer(resumeData);
};

const matchJobDescriptionWithAI = async (resumeData, jobDescription) => {
  return aiMatcher(resumeData, jobDescription);
};

const getResumeAdvice = async (userMessage, resumeData, analysisResults) => {
  try {
    return await generateResumeAdvice(userMessage, resumeData, analysisResults);
  } catch (error) {
    console.error("AI Advice generation failed. Details:");
    console.error("- Message:", error.message);
    console.error("- Stack:", error.stack);

    // Simple rule-based fallback
    const msg = (userMessage || "").toLowerCase();
    if (msg.includes('skill') || msg.includes('learn')) {
      return "Based on your resume, I recommend focusing on the technical gaps identified in your analysis, particularly the ones listed in your 'Critical Gaps' section. Strengthening these will significantly improve your market score.";
    } else if (msg.includes('experience') || msg.includes('work')) {
      return "To enhance your experience section, try to quantify your achievements more. For example, instead of saying 'Developed features', say 'Improved system performance by 20% by optimizing...'";
    } else {
      return `I'm having a bit of trouble connecting to my advanced AI core right now (Error: ${error.message}), but I've reviewed your resume! My high-level advice is to focus on the 'Actionable Roadmap' items on your dashboard. They contain the most critical steps for your career progression.`;
    }
  }
};

const parseStructuredDataWithAI = async (rawText) => {
  return aiDataExtractor(rawText);
};

// Helper function to validate and clean AI response
function validateAIResponse(data) {
  const sanitize = (val) => {
    if (typeof val !== 'string') return null;
    return val.trim()
      .replace(/^[\s•\-\*]+/, '')
      .replace(/^(Responsibilities|Teaching|Institute|Job Title|Duration|Degree):\s*/i, '');
  };

  const cleaned = {
    name: sanitize(data.name),
    email: sanitize(data.email),
    phone: sanitize(data.phone),
    address: sanitize(data.address),
    summary: typeof data.summary === 'string' ? data.summary.trim() : null,
    experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
      company: sanitize(exp.company) || 'Company Not Specified',
      position: sanitize(exp.position) || 'Position Not Specified',
      duration: sanitize(exp.duration) || 'Duration Not Specified',
      responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities.map(r => sanitize(r)).filter(r => r) : []
    })) : [],
    education: Array.isArray(data.education) ? data.education.map(edu => ({
      institution: sanitize(edu.institution) || 'Institution Not Specified',
      degree: sanitize(edu.degree) || 'Degree Not Specified',
      dates: sanitize(edu.dates) || 'Dates Not Specified',
      gpa: sanitize(edu.gpa) || null
    })) : [],
    skills: {
      technical: data.skills?.technical || [],
      soft: data.skills?.soft || []
    },
    projects: Array.isArray(data.projects) ? data.projects.map(p => ({
      name: sanitize(p.name) || 'Project',
      description: sanitize(p.description) || '',
      technologies: p.technologies || []
    })) : [],
    certifications: Array.isArray(data.certifications) ? data.certifications.map(c => ({
      name: sanitize(c.name) || 'Cert',
      issuer: sanitize(c.issuer) || '',
      date: sanitize(c.date) || ''
    })) : [],
    languages: Array.isArray(data.languages) ? data.languages.map(l => ({
      language: sanitize(l.language) || '',
      proficiency: sanitize(l.proficiency) || ''
    })) : [],
    interests: Array.isArray(data.interests) ? data.interests.map(i => sanitize(i)).filter(i => i) : []
  };

  return cleaned;
}

module.exports = {
  parseResume,
  analyzeResume,
  matchKeywords,
  getResumeAdvice
};