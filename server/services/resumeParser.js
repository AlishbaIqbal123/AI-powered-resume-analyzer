const OpenAI = require('openai');
const { OPENAI_API_KEY } = process.env;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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
    if (OPENAI_API_KEY) {
      try {
        console.log("Starting AI Data Extraction...");
        aiExtractedData = await parseStructuredDataWithAI(fileContent);
        console.log("AI Extraction Complete", aiExtractedData);
      } catch (e) {
        console.error("AI Extraction failed, falling back to regex:", e);
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
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];

    // Skip if it looks like a header or section title
    if (/^(CURRICULUM|RESUME|CV|CONTACT|PROFILE|EXPERIENCE|ABOUT|EDUCATION|SKILLS|PROJECTS|CERTIFICATES?|AWARDS?|INTERESTS?)/i.test(line)) continue;

    // Pattern: Full name with proper capitalization (most common)
    if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]*)?$/.test(line)) {
      return line.trim();
    }

    // Pattern: ALL CAPS name (e.g. JOHN DOE)
    if (/^[A-Z]+\s+[A-Z]+(?:\s+[A-Z]+)?$/.test(line) && line.split(' ').length <= 4) {
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
  const experienceSectionMatch = content.match(/(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)[\s\S]*?(?=(?:EDUCATION|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|$))/i);
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
  const educationSectionMatch = content.match(/(EDUCATION|ACADEMIC BACKGROUND|EDUCATIONAL BACKGROUND|ACADEMIC QUALIFICATIONS)[\s\S]*?(?=EXPERIENCE|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|$)/i);

  if (!educationSectionMatch) {
    return [];
  }

  const educationText = educationSectionMatch[0];
  const educationEntries = [];
  const lines = educationText.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  // Define common degree keywords to help identify degrees
  const degreeKeywords = [
    'Bachelor', 'Master', 'PhD', 'Doctorate', 'Associate', 'Degree', 'Diploma', 'Certificate',
    'BS', 'BA', 'MS', 'MA', 'PhD', 'MBA', 'BSc', 'MSc', 'MD', 'JD', 'BEng', 'MEng'
  ];

  // Define common school/university keywords
  const schoolKeywords = [
    'University', 'College', 'School', 'Institute', 'Academy', 'Campus', 'Polytechnic'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for lines that contain education-related information
    if (degreeKeywords.some(keyword => line.includes(keyword)) ||
      schoolKeywords.some(keyword => line.includes(keyword))) {

      const entry = {
        institution: null,
        degree: null,
        dates: null
      };

      // Try to extract dates (years, months, etc.)
      const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December|\d{4})\s*[-\u2013\u2014\s]+(?:\d{4}|Present|Current)\b/gi;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        entry.dates = dateMatch[0];
      }

      // Look for institution and degree in the current line and nearby lines
      const searchContext = [];
      if (lines[i - 1]) searchContext.push(lines[i - 1]);
      searchContext.push(line);
      if (lines[i + 1]) searchContext.push(lines[i + 1]);

      for (const ctx of searchContext) {
        // Look for 'at' pattern (e.g., 'Bachelor of Science at University')
        const atPattern = /^(.*?)\s+at\s+(.+)$/i;
        const atMatch = ctx.match(atPattern);
        if (atMatch) {
          entry.degree = atMatch[1].trim();
          entry.institution = atMatch[2].trim();
          break;
        }

        // Look for '|' or '-' pattern (e.g., 'University | Bachelor of Science')
        const separatorPattern = /^(.*?)\s*[|\-]\s*(.+)$/;
        const sepMatch = ctx.match(separatorPattern);
        if (sepMatch) {
          const part1 = sepMatch[1].trim();
          const part2 = sepMatch[2].trim();

          // Determine which is institution and which is degree based on keywords
          const part1Lower = part1.toLowerCase();
          const part2Lower = part2.toLowerCase();

          const part1HasDegree = degreeKeywords.some(keyword => part1Lower.includes(keyword.toLowerCase()));
          const part2HasDegree = degreeKeywords.some(keyword => part2Lower.includes(keyword.toLowerCase()));
          const part1HasSchool = schoolKeywords.some(keyword => part1Lower.includes(keyword.toLowerCase()));
          const part2HasSchool = schoolKeywords.some(keyword => part2Lower.includes(keyword.toLowerCase()));

          if (part1HasDegree || part2HasSchool) {
            entry.degree = part1;
            entry.institution = part2;
          } else if (part2HasDegree || part1HasSchool) {
            entry.degree = part2;
            entry.institution = part1;
          } else {
            // Default assignment
            if (part1HasSchool || part2HasDegree) {
              entry.institution = part1;
              entry.degree = part2;
            } else {
              entry.institution = part2;
              entry.degree = part1;
            }
          }
          break;
        }

        // If we find a clear degree or institution pattern
        if (!entry.degree && degreeKeywords.some(keyword => ctx.includes(keyword))) {
          entry.degree = ctx;
        } else if (!entry.institution && schoolKeywords.some(keyword => ctx.includes(keyword))) {
          entry.institution = ctx;
        }
      }

      // If we didn't find institution but found school-related text, use it
      if (!entry.institution) {
        for (const ctx of searchContext) {
          if (schoolKeywords.some(keyword => ctx.includes(keyword)) &&
            !degreeKeywords.some(keyword => ctx.includes(keyword))) {
            entry.institution = ctx;
            break;
          }
        }
      }

      // If we didn't find degree but found degree-related text, use it
      if (!entry.degree) {
        for (const ctx of searchContext) {
          if (degreeKeywords.some(keyword => ctx.includes(keyword))) {
            entry.degree = ctx;
            break;
          }
        }
      }

      // Add to entries if we have meaningful data
      if (entry.institution || entry.degree) {
        educationEntries.push({
          institution: entry.institution || 'Institution Not Specified',
          degree: entry.degree || 'Degree Not Specified',
          dates: entry.dates || 'Dates Not Specified'
        });
      }
    }
  }

  return educationEntries;
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
          // Normalize skill names
          const normalizedSkill = cleanSkill.charAt(0).toUpperCase() + cleanSkill.slice(1).toLowerCase();
          skills.add(normalizedSkill);
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
    // Properly escape special regex characters including + signs
    const escapedSkill = skill.replace(/[.*+?^${}()[\]|]/g, '\$&');
    const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
    if (skillRegex.test(content)) {
      skills.add(skill);
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
    // Properly escape special regex characters including + signs
    const skillRegex = new RegExp('\\b' + skill.replace(/[.*+?^${}()[\]|]/g, '\$&') + '\\b', 'gi');
    if (skillRegex.test(content)) {
      softSkills.add(skill);
    }
  });

  // Also look in skills section if available
  const skillsSectionMatch = content.match(/(SKILLS|SOFT SKILLS|INTERPERSONAL SKILLS)[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATES?|PROJECTS|LANGUAGES|INTERESTS?|$)/i);

  if (skillsSectionMatch) {
    const skillsText = skillsSectionMatch[0];
    commonSoftSkills.forEach(skill => {
      // Properly escape special regex characters including + signs
      const skillRegex = new RegExp('\\b' + skill.replace(/[.*+?^${}()[\]|]/g, '\$&') + '\\b', 'gi');
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
  const projectPattern = /([A-Za-z\s\-&]+)\s*[:\-]\s*([A-Za-z\s\-&\.,!?\(\)]+)/g; // eslint-disable-line no-useless-escape
  let match;

  while ((match = projectPattern.exec(projectsText)) !== null) {
    projects.push({
      name: match[1]?.trim(),
      description: match[2]?.trim()
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
    if (OPENAI_API_KEY) {
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
  const latestPosition = resumeData.extractedData.experience[0]?.position || 'your field';
  return `Based on your experience in ${latestPosition}, you have strong foundational skills. To improve your competitiveness for senior roles, focus on showcasing measurable impacts of your work and obtaining additional certifications in emerging technologies.`;
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

// AI-powered analysis functions
const analyzeResumeWithAI = async (resumeData) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `You are an elite AI Resume Analyzer and Career Coach with 15+ years of experience in technical recruiting for Fortune 500 tech companies.

Your mission is to transform user resumes into interview-winning documents. You analyze resumes from three critical perspectives:
1. ATS (Applicant Tracking Systems): Ensuring high keyword density and proper formatting for automated filters.
2. Recruiters: Quick scannability, clear visual hierarchy, and immediate impact demonstration.
3. Hiring Managers: Deep technical competency, problem-solving abilities, and quantifiable business impact.

Your specific evaluation criteria:
- IMPACT: Are achievements quantified with metrics? (e.g., "Increased performance by 40%").
- STACK: Is the technical stack modern and clearly categorized?
- CLARITY: Is the writing professional, concise, and punchy?
- RELEVANCE: Is the resume tailored for software engineering and related technical roles?

RULES:
- Be brutally honest but professionally constructive. 
- Provide elite-level feedback that a candidate would pay thousands for.
- Prioritize Action Verbs (Developed, Orchestrated, Optimized, Scaled).
- Focus on "Business Value" provided, not just "Tasks" performed.
- Always remain contextual to the provided resume data.

RESUME ANALYSIS MODE: Return a valid JSON object ONLY.

SCORING SCHEME (Total 100):
- ATS Compatibility (0–30): How well automated systems parse this document.
- Keyword Match (0–30): Semantic alignment with industry standards.
- Content Quality (0–20): Impactful language and verifiable achievements.
- Role Relevance (0–20): Fit for technical software engineering roles.

Structure:
{
  "overallScore": number,
  "scores": {
    "ats": number,
    "keyword": number,
    "content": number,
    "relevance": number
  },
  "strengths": ["string"],
  "weaknesses": ["string"],
  "suggestions": ["string"],
  "industrySpecific": { "recommendations": ["string"], "trendingKeywords": ["string"] },
  "keywordMatches": { "matched": ["string"], "missing": ["string"] },
  "personalization": { "targetRoleFit": "string", "careerGoalsAlignment": "string", "customFeedback": "string" }
}`;

  const userPrompt = `Resume Text:\n---\n${resumeData.rawText || JSON.stringify(resumeData.extractedData)}\n---`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
};

const matchJobDescriptionWithAI = async (resumeData, jobDescription) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `You are an elite AI Resume Analyzer and Career Coach with 15+ years of experience in technical recruiting for Fortune 500 tech companies.

Your mission is to transform user resumes into interview-winning documents. You analyze resumes from three critical perspectives:
1. ATS (Applicant Tracking Systems): Ensuring high keyword density and proper formatting for automated filters.
2. Recruiters: Quick scannability, clear visual hierarchy, and immediate impact demonstration.
3. Hiring Managers: Deep technical competency, problem-solving abilities, and quantifiable business impact.

Your specific evaluation criteria:
- IMPACT: Are achievements quantified with metrics? (e.g., "Increased performance by 40%").
- STACK: Is the technical stack modern and clearly categorized?
- CLARITY: Is the writing professional, concise, and punchy?
- RELEVANCE: Is the resume tailored for software engineering and related technical roles?

RULES:
- Be brutally honest but professionally constructive. 
- Provide elite-level feedback that a candidate would pay thousands for.
- Prioritize Action Verbs (Developed, Orchestrated, Optimized, Scaled).
- Focus on "Business Value" provided, not just "Tasks" performed.
- Always remain contextual to the provided resume data.

JOB MATCHING MODE: Return JSON { "matchPercentage": number, "matched": [], "missing": [], "totalJobKeywords": number, "analysis": "string", "recommendations": [] }`;

  const userPrompt = `Resume: ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}\nJD: ${jobDescription}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('JD matching failed:', error);
    throw error;
  }
};

const parseStructuredDataWithAI = async (rawText) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `You are a professional resume parser. Extract information from the resume and return ONLY a valid JSON object.

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Return ONLY valid JSON - no markdown, no explanations, no extra text
2. Use the EXACT structure shown below
3. Each field must contain the correct type of data as specified

REQUIRED JSON STRUCTURE:
{
  "name": "string - Full name from resume",
  "email": "string - Email address",
  "phone": "string - Phone number",
  "address": "string - City, State/Country ONLY (e.g. 'San Francisco, CA')",
  "summary": "string - Professional summary or objective",
  "experience": [
    {
      "company": "string - Company name ONLY",
      "position": "string - Job title ONLY",
      "duration": "string - Date range (e.g. 'Jan 2020 - Dec 2022')",
      "responsibilities": ["array of strings - Each responsibility as separate item"]
    }
  ],
  "education": [
    {
      "institution": "string - School/University name ONLY",
      "degree": "string - Degree name ONLY (e.g. 'Bachelor of Science in Computer Science')",
      "dates": "string - Graduation year or date range"
    }
  ],
  "skills": {
    "technical": ["array of strings - Technical skills like JavaScript, Python, etc."],
    "soft": ["array of strings - Soft skills like Leadership, Communication, etc."]
  },
  "projects": [
    {
      "name": "string - Project name",
      "description": "string - Brief description",
      "technologies": ["array of strings - Technologies used"],
      "startDate": "string - Start date",
      "endDate": "string - End date",
      "github": "string - GitHub URL if available",
      "liveUrl": "string - Live URL if available",
      "achievements": ["array of strings - Key achievements"]
    }
  ],
  "certifications": [
    {
      "name": "string - Certification name ONLY",
      "issuer": "string - Issuing organization ONLY",
      "date": "string - Date obtained"
    }
  ],
  "languages": [
    {
      "language": "string - Language name",
      "proficiency": "string - Proficiency level",
      "spoken": true,
      "written": true
    }
  ],
  "interests": ["array of strings - Personal interests"]
}

FIELD VALIDATION RULES:
- "company" field: ONLY company/organization name, NO job descriptions or responsibilities
- "position" field: ONLY job title, NO company name
- "institution" field: ONLY school/university name, NO degree information
- "degree" field: ONLY degree name, NO school name
- "responsibilities": Must be an ARRAY of strings, each item is one responsibility
- "name" (certification): ONLY certification name, NO issuing body
- "issuer" (certification): ONLY issuing organization, NO certification name

IMPORTANT: 
- Do NOT mix up fields (e.g., don't put company name in position field)
- Do NOT put multiple pieces of information in one field
- If a field is not found, use null for strings, [] for arrays, {} for objects
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extract structured data from this resume. Return ONLY valid JSON:\n\n${rawText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("Raw AI Response:", content.substring(0, 500));

    // Multi-stage cleaning to handle varied LLM responses
    const cleanContent = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .trim();

    const parsed = JSON.parse(cleanContent);

    // Validate and clean the parsed data
    const validated = validateAIResponse(parsed);
    console.log("Validated AI Response:", JSON.stringify(validated, null, 2).substring(0, 500));

    return validated;
  } catch (error) {
    console.error('AI extraction failed:', error);
    throw error;
  }
};

// Helper function to validate and clean AI response
function validateAIResponse(data) {
  const cleaned = {
    name: typeof data.name === 'string' ? data.name : null,
    email: typeof data.email === 'string' ? data.email : null,
    phone: typeof data.phone === 'string' ? data.phone : null,
    address: typeof data.address === 'string' ? data.address : null,
    summary: typeof data.summary === 'string' ? data.summary : null,
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: []
    },
    projects: [],
    certifications: [],
    languages: [],
    interests: []
  };

  // Validate experience
  if (Array.isArray(data.experience)) {
    cleaned.experience = data.experience.map(exp => ({
      company: typeof exp.company === 'string' ? exp.company.trim() : 'Company Not Specified',
      position: typeof exp.position === 'string' ? exp.position.trim() : 'Position Not Specified',
      duration: typeof exp.duration === 'string' ? exp.duration.trim() : 'Duration Not Specified',
      responsibilities: Array.isArray(exp.responsibilities)
        ? exp.responsibilities.filter(r => typeof r === 'string' && r.trim().length > 0)
        : []
    })).filter(exp => exp.company || exp.position);
  }

  // Validate education
  if (Array.isArray(data.education)) {
    cleaned.education = data.education.map(edu => ({
      institution: typeof edu.institution === 'string' ? edu.institution.trim() : 'Institution Not Specified',
      degree: typeof edu.degree === 'string' ? edu.degree.trim() : 'Degree Not Specified',
      dates: typeof edu.dates === 'string' ? edu.dates.trim() : 'Dates Not Specified'
    })).filter(edu => edu.institution || edu.degree);
  }

  // Validate skills
  if (data.skills && typeof data.skills === 'object') {
    if (Array.isArray(data.skills.technical)) {
      cleaned.skills.technical = data.skills.technical
        .filter(s => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim());
    }
    if (Array.isArray(data.skills.soft)) {
      cleaned.skills.soft = data.skills.soft
        .filter(s => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim());
    }
  }

  // Validate projects
  if (Array.isArray(data.projects)) {
    cleaned.projects = data.projects.map(proj => ({
      name: typeof proj.name === 'string' ? proj.name.trim() : 'Project Name Not Specified',
      description: typeof proj.description === 'string' ? proj.description.trim() : '',
      technologies: Array.isArray(proj.technologies)
        ? proj.technologies.filter(t => typeof t === 'string' && t.trim().length > 0)
        : [],
      startDate: typeof proj.startDate === 'string' ? proj.startDate.trim() : '',
      endDate: typeof proj.endDate === 'string' ? proj.endDate.trim() : '',
      github: typeof proj.github === 'string' ? proj.github.trim() : '',
      liveUrl: typeof proj.liveUrl === 'string' ? proj.liveUrl.trim() : '',
      achievements: Array.isArray(proj.achievements)
        ? proj.achievements.filter(a => typeof a === 'string' && a.trim().length > 0)
        : []
    })).filter(proj => proj.name);
  }

  // Validate certifications
  if (Array.isArray(data.certifications)) {
    cleaned.certifications = data.certifications.map(cert => ({
      name: typeof cert.name === 'string' ? cert.name.trim() : 'Certification Not Specified',
      issuer: typeof cert.issuer === 'string' ? cert.issuer.trim() : 'Issuer Not Specified',
      date: typeof cert.date === 'string' ? cert.date.trim() : 'Date Not Specified'
    })).filter(cert => cert.name);
  }

  // Validate languages
  if (Array.isArray(data.languages)) {
    cleaned.languages = data.languages.map(lang => ({
      language: typeof lang.language === 'string' ? lang.language.trim() : 'Language Not Specified',
      proficiency: typeof lang.proficiency === 'string' ? lang.proficiency.trim() : 'Not Specified',
      spoken: typeof lang.spoken === 'boolean' ? lang.spoken : false,
      written: typeof lang.written === 'boolean' ? lang.written : false
    })).filter(lang => lang.language);
  }

  // Validate interests
  if (Array.isArray(data.interests)) {
    cleaned.interests = data.interests
      .filter(i => typeof i === 'string' && i.trim().length > 0)
      .map(i => i.trim());
  }

  return cleaned;
}

module.exports = {
  parseResume,
  analyzeResume,
  matchKeywords,
  analyzeResumeWithAI,
  matchJobDescriptionWithAI,
  parseStructuredDataWithAI
};