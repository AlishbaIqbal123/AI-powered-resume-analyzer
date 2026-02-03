import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { analyzeResumeWithAI, parseStructuredDataWithAI, matchJobDescriptionWithAI } from './aiService';

// Configure worker to avoid CDN issues - use matching CDN version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Resume Parser Service
 * Handles parsing of resume files (PDF, DOCX) to extract structured data
 */

// Advanced resume parsing service with improved text extraction algorithms
const parseResume = async (file) => {
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

    // If no text was extracted (likely a scanned image), try OCR
    if (!fileContent || fileContent.trim().length < 20) {
      if (file.type === 'application/pdf') {
        console.log('Attempting OCR on PDF...');
        fileContent = await runOCROnPDF(file);
        if (!fileContent || fileContent.trim().length < 20) {
          throw new Error('The document appears to be a scanned image with no readable text. OCR service may be needed.');
        }
      } else {
        throw new Error('The document appears to be empty or unreadable. Please ensure it is not a scanned image.');
      }
    }

    console.log("Extracted Text Preview:", fileContent.substring(0, 200));

    let aiExtractedData = {};

    // 1. Try AI Extraction (handled by service with backend preference)
    try {
      console.log("Starting AI Data Extraction...");
      aiExtractedData = await parseStructuredDataWithAI(fileContent);
      console.log("AI Extraction Complete", aiExtractedData);
    } catch (e) {
      console.error("AI Extraction failed, falling back to regex:", e);
    }

    // 2. Fallback/Augment with Regex
    console.log("Augmenting with Regex Fallback...");
    
    // Extract individual fields with debugging
    const email = extractEmailFromFile(fileContent);
    const phone = extractPhoneFromFile(fileContent);
    const experience = extractExperienceFromFile(fileContent);
    
    console.log("Debug - Extracted Email:", email);
    console.log("Debug - Extracted Phone:", phone);
    console.log("Debug - Extracted Experience:", experience);
    
    const regexData = {
      name: extractNameFromContent(fileContent),
      email: email,
      phone: phone,
      address: extractLocationFromFile(fileContent),
      experience: experience,
      education: extractEducationFromFile(fileContent),
      skills: {
        technical: extractTechnicalSkillsFromFile(fileContent),
        soft: extractSoftSkillsFromFile(fileContent)
      },
      certifications: extractCertificationsFromFile(fileContent),
      summary: extractSummaryFromFile(fileContent),
      projects: extractProjectsFromFile(fileContent),
      languages: extractLanguagesFromFile(fileContent),
      github: extractGithubFromFile(fileContent),
      linkedin: extractLinkedinFromFile(fileContent),
      interests: extractInterestsFromFile(fileContent)
    };
    
    console.log("Debug - Regex Data:", regexData);

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

    const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone) => typeof phone === 'string' && phone.replace(/\D/g, '').length >= 10;

    if (aiExtractedData) {
      Object.keys(aiExtractedData).forEach(key => {
        const val = aiExtractedData[key];
        if (key === 'skills' && val) {
          if (isMeaningful(val.technical)) finalData.skills.technical = val.technical;
          if (isMeaningful(val.soft)) finalData.skills.soft = val.soft;
        } else if (key === 'email') {
          if (isValidEmail(val)) finalData.email = val;
        } else if (key === 'phone') {
          if (isValidPhone(val)) finalData.phone = val;
        } else if (isMeaningful(val)) {
          finalData[key] = val;
        }
      });
    }

    const parsedData = {
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(2) + ' KB',
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

    // Add confidence scoring to extracted data
    parsedData.confidence = calculateConfidenceScores(parsedData);

    return parsedData;
  } catch (error) {
    console.error("Critical Resume Parsing Error:", error);
    throw error;
  }
};

// Calculate confidence scores for extracted data
const calculateConfidenceScores = (parsedData) => {
  const data = parsedData.extractedData;

  return {
    name: data.name ? 0.9 : 0.1,
    email: data.email ? 0.95 : 0.1,
    phone: data.phone ? 0.85 : 0.1,
    address: data.address ? 0.8 : 0.2,
    github: data.github ? 0.9 : 0.1,
    linkedin: data.linkedin ? 0.9 : 0.1,
    experience: data.experience.length > 0 ? Math.min(0.7 + (data.experience.length * 0.1), 0.95) : 0.1,
    education: data.education.length > 0 ? Math.min(0.7 + (data.education.length * 0.1), 0.95) : 0.1,
    skills: {
      technical: data.skills.technical.length > 0 ? Math.min(0.6 + (data.skills.technical.length * 0.05), 0.95) : 0.1,
      soft: data.skills.soft.length > 0 ? Math.min(0.6 + (data.skills.soft.length * 0.05), 0.95) : 0.1
    },
    overall: Math.min(0.5 + (Object.keys(data).filter(key => {
      const value = data[key];
      return value && (
        (Array.isArray(value) && value.length > 0) ||
        (typeof value === 'string' && value.trim() !== '') ||
        (typeof value === 'object' && Object.keys(value).length > 0)
      );
    }).length * 0.1), 1.0)
  };
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

// Fallback OCR function for scanned PDFs
const runOCROnPDF = async (file) => {
  try {
    console.log('Calling backend OCR service...');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/resume/ocr`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`OCR service failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data.text || '';
  } catch (error) {
    console.error('OCR service error:', error);
    return '';
  }
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
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;

  // Strategy 1: Look for prominent name patterns at the top
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];

    // Skip if it looks like a header or section title
    if (/^(CURRICULUM|RESUME|CV|CONTACT|PROFILE|EXPERIENCE|ABOUT|EDUCATION|SKILLS|PROJECTS|CERTIFICATES?|AWARDS?|INTERESTS?)/i.test(line)) continue;

    // Pattern: Full name with proper capitalization (most common)
    // Support international names with accented characters
    if (/^[A-ZÀ-ÿ][a-zà-ÿ]+\s+[A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]*)?$/.test(line)) {
      return line.trim();
    }

    // Pattern: ALL CAPS name (e.g. JOHN DOE)
    if (/^[A-ZÀ-Ÿ]+\s+[A-ZÀ-Ÿ]+(?:\s+[A-ZÀ-Ÿ]+)?$/.test(line) && line.split(' ').length <= 4) {
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
  console.log("Debug - Email extraction input preview:", content.substring(0, 500));
  
  // Preprocess content to handle encoded emails and icons
  let processedContent = content
    .replace(/\[dot\]/gi, '.')
    .replace(/\[at\]/gi, '@')
    .replace(/\(dot\)/gi, '.')
    .replace(/\(at\)/gi, '@')
    .replace(/\{dot\}/gi, '.')
    .replace(/\{at\}/gi, '@')
    .replace(/✉️|📧/g, '')
    .replace(/\s+/g, ' '); // Normalize whitespace

  // More comprehensive email patterns to catch full emails
  const emailPatterns = [
    // Standard email formats with various TLDs
    /\b[\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?\b/gi,
    
    // Emails with common domains
    /\b[\w\.\-\+]+@(?:gmail|yahoo|outlook|hotmail|icloud|protonmail)\.com\b/gi,
    
    // Encoded emails with various separators
    /\b([\w\.\-\+_]+)\s*(?:\[at\]|\(at\)|\{at\}|@)\s*([\w\.\-]+)\s*(?:\[dot\]|\(dot\)|\{dot\}|\.)\s*([a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b/gi,
    
    // Emails with spaces in encoding
    /\b([\w\.\-\+_]+)\s+at\s+([\w\.\-]+)\s+dot\s+([a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\b/gi,
    
    // Emails in common formats found in resumes
    /Email\s*[:\-]?\s*([\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,})/gi,
    /E-?mail\s*[:\-]?\s*([\w\.\-\+]+@[\w\.\-]+\.[a-zA-Z]{2,})/gi
  ];

  const allMatches = [];
  
  // Apply all patterns
  for (const pattern of emailPatterns) {
    const matches = [...processedContent.matchAll(pattern)];
    for (const match of matches) {
      if (match.length >= 2) {
        // Handle capture groups (encoded emails)
        const email = match.length > 1 ? match[1] : match[0];
        if (email && !email.includes('@') && match.length >= 4) {
          // Reconstruct encoded email
          allMatches.push(`${match[1]}@${match[2]}.${match[3]}`);
        } else if (email) {
          allMatches.push(email);
        }
      }
    }
  }

  console.log("Debug - Raw email matches found:", allMatches);
  
  // Deduplicate and clean matches
  const uniqueEmails = [...new Set(allMatches.map(email => email.trim().toLowerCase()))]
    .map(email => email.trim())
    .filter(email => {
      // Basic validation
      if (!email.includes('@')) return false;
      
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      
      const [local, domain] = parts;
      if (!local || !domain || local.length < 1 || domain.length < 3) return false;
      
      // Check for valid TLD pattern
      const tldPattern = /\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;
      if (!tldPattern.test(domain)) return false;
      
      // Exclude obvious false positives
      const falsePositives = ['i.alishba', 'alishba', 'instagram', 'twitter', 'facebook', 'linkedin', 'github'];
      if (falsePositives.includes(local.toLowerCase())) return false;
      
      return true;
    });

  console.log("Debug - Valid unique emails:", uniqueEmails);
  
  if (uniqueEmails.length > 0) {
    // Return the most likely personal email
    const personalEmails = uniqueEmails.filter(email => {
      const domain = email.split('@')[1].toLowerCase();
      return !domain.includes('company') && 
             !domain.includes('inc') && 
             !domain.includes('corp') && 
             (domain.includes('gmail') || 
              domain.includes('yahoo') || 
              domain.includes('outlook') || 
              domain.includes('hotmail') ||
              domain.length <= 20);
    });
    
    return personalEmails[0] || uniqueEmails[0];
  }

  return null;
};

// Enhanced phone extraction with multiple formats
const extractPhoneFromFile = (content) => {
  console.log("Debug - Phone extraction input preview:", content.substring(0, 300));
  
  // Simple but comprehensive phone patterns
  const phonePatterns = [
    // International with country code
    /\+\d{1,3}[\s\-\.\(]?\d{1,4}[\)\s\-\.]?\d{1,4}[\s\-\.]?\d{1,4}[\s\-\.]?\d{0,9}/g,
    
    // US format with parentheses
    /\(\d{3}\)[\s\-]?\d{3}[\s\-]?\d{4}/g,
    
    // Standard formats with various separators
    /\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}/g,
    /\d{3}\s\d{3}\s\d{4}/g,
    /\d{3}-\d{3}-\d{4}/g,
    /\d{3}\.\d{3}\.\d{4}/g,
    
    // Pakistani formats
    /0\d{3}[\s\-]\d{3}[\s\-]\d{4}/g,
    /\+92\s\d{3}\s\d{7}/g,
    /\+92-\d{3}-\d{3}-\d{4}/g,
    /92\d{10}/g,
    
    // Simple 10-15 digit sequences (last resort)
    /\b\d{10,15}\b/g
  ];

  const validPhones = [];
  
  // Search through content for phone numbers
  for (const pattern of phonePatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const phoneNumber = match[0].trim();
      const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
      
      // Validate length
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        // Check if this looks like a real phone number (not just digits in text)
        const context = content.toLowerCase();
        const phoneContext = context.includes('tel') || 
                           context.includes('phone') ||
                           context.includes('mobile') || 
                           context.includes('cell') ||
                           context.includes('contact');
        
        validPhones.push({
          number: phoneNumber,
          digits: digitsOnly,
          contextScore: phoneContext ? 2 : 1,
          lengthScore: digitsOnly.length
        });
      }
    }
  }

  console.log("Debug - Phone matches found:", validPhones);
  
  // Sort by context relevance and return the best match
  if (validPhones.length > 0) {
    validPhones.sort((a, b) => {
      // Primary sort by context score, secondary by length (prefer longer more specific numbers)
      if (a.contextScore !== b.contextScore) {
        return b.contextScore - a.contextScore;
      }
      return b.lengthScore - a.lengthScore;
    });
      
    console.log("Debug - Best phone match:", validPhones[0].number);
    return validPhones[0].number;
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
    'Shanghai', 'Mumbai', 'São Paulo', 'Mexico City', 'Moscow', 'Istanbul',
    'Pakistan', 'India', 'China', 'Japan', 'South Korea', 'Brazil', 'Russia', 'Canada', 'Australia',
    'Germany', 'France', 'Italy', 'Spain', 'United Kingdom', 'UK', 'USA', 'United States',
    'Bangladesh', 'Nigeria', 'Egypt', 'South Africa', 'Kenya', 'Ghana', 'Ethiopia', 'Morocco'
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

// Extract GitHub profile link
const extractGithubFromFile = (content) => {
  // Comprehensive GitHub pattern matching all specified requirements
  const githubPatterns = [
    // Standard formats with various protocols
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/gi,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?/gi,
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/.*$/gi,
    
    // Handle usernames with numbers, hyphens, underscores
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z][a-zA-Z0-9_-]*)/gi,
    
    // Handle trailing parameters and paths
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\?.*|\#.*|$)/gi
  ];
  
  // Try all patterns and return the first valid match
  for (const pattern of githubPatterns) {
    const match = pattern.exec(content);
    if (match && match[1]) {
      // Validate username format
      const username = match[1];
      if (username.length >= 1 && username.length <= 39 && 
          /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username)) {
        return match[0].split('?')[0].split('#')[0]; // Remove query params and fragments
      }
    }
  }
  
  return null;
};

// Extract LinkedIn profile link
const extractLinkedinFromFile = (content) => {
  // Comprehensive LinkedIn pattern matching all specified requirements
  const linkedinPatterns = [
    // Standard profile paths
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([a-zA-Z0-9_-]+)/gi,
    
    // Handle various username formats including encoded characters
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z][a-zA-Z0-9_-]*)/gi,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([a-zA-Z][a-zA-Z0-9_-]*)/gi,
    
    // Handle special paths and encoded usernames
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])/gi,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9])/gi,
    
    // Handle trailing slashes and additional path parameters
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9_-]+)\/?/gi,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9_-]+)(?:\?.*|\#.*|$)/gi
  ];
  
  // Try all patterns and return the first valid match
  for (const pattern of linkedinPatterns) {
    const match = pattern.exec(content);
    if (match && match[1]) {
      // Validate username format
      const username = match[1];
      if (username.length >= 1 && username.length <= 100 && 
          /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username)) {
        return match[0].split('?')[0].split('#')[0]; // Remove query params and fragments
      }
    }
  }
  
  return null;
};

const extractExperienceFromFile = (content) => {
  console.log("Debug - Experience extraction input preview:", content.substring(0, 300));
  
  // Enhanced experience extraction with better section detection
  const experienceSectionMatch = content.match(/(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY)[\s\S]*?(?=(?:EDUCATION|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|$))/i);
  
  console.log("Debug - Experience section match:", experienceSectionMatch ? "Found" : "Not found");
  
  if (!experienceSectionMatch) {
    console.log("Debug - No experience section found, returning empty array");
    return [];
  }

  const experienceText = experienceSectionMatch[0];
  console.log("Debug - Experience text preview:", experienceText.substring(0, 200));
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

  // First, try to find entries with dates
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

  // If no entries found with dates, try to find entries based on job title patterns
  if (entries.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for lines that contain job titles
      if (jobTitleKeywords.some(keyword => line.toLowerCase().includes(keyword)) ||
        line.toLowerCase().includes('engineer') || line.toLowerCase().includes('developer')) {
        const entry = {
          company: null,
          position: null,
          duration: 'Duration not specified',
          responsibilities: []
        };

        // Extract position from the line
        entry.position = line;

        // Look for company nearby
        for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
          if (j !== i) {
            const nearbyLine = lines[j];
            // Look for company-like patterns
            if (nearbyLine.includes('Inc') || nearbyLine.includes('LLC') ||
              nearbyLine.includes('Corp') || nearbyLine.includes('Ltd') ||
              nearbyLine.includes('Company') || nearbyLine.includes('Organization')) {
              entry.company = nearbyLine;
              break;
            }
          }
        }

        // Add responsibilities from following lines
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j];

          // Stop if we encounter a new section
          if (/^(EDUCATION|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?)/i.test(nextLine)) break;

          // Add to responsibilities if it looks like a bullet point or description
          if (nextLine.startsWith('-') || nextLine.startsWith('*') || nextLine.startsWith('•') ||
            nextLine.length > 10) {
            entry.responsibilities.push(nextLine);
          }
        }

        // Only add if we have meaningful data
        if (entry.position) {
          entries.push({
            company: entry.company || 'Company Not Specified',
            position: entry.position,
            duration: entry.duration,
            responsibilities: entry.responsibilities
          });
        }
      }
    }
  }

  return entries.length > 0 ? entries.slice(0, 10) : [];
};

// Extract education details
const extractEducationFromFile = (content) => {
  console.log("Debug - Education extraction input preview:", content.substring(0, 500));
  
  // Look for education sections with various possible headings
  const educationPatterns = [
    /(EDUCATION|ACADEMIC BACKGROUND|EDUCATIONAL BACKGROUND|ACADEMIC QUALIFICATIONS|EDUCATION HISTORY)[\s\S]*?(?=EXPERIENCE|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|WORK|$)/i,
    /(MATRIC|INTERMEDIATE|BACHELOR|MASTER|PHD|DOCTORATE)[\s\S]*?(?=EXPERIENCE|SKILLS|CERTIFICATES?|AWARDS?|PROJECTS|LANGUAGES|INTERESTS?|WORK|$)/i
  ];

  let educationText = '';
  
  // Try to find education section
  for (const pattern of educationPatterns) {
    const match = content.match(pattern);
    if (match) {
      educationText = match[0];
      break;
    }
  }

  // If no section found, use the entire content
  if (!educationText) {
    educationText = content;
  }

  const educationEntries = [];
  const lines = educationText.split('\n').map(l => l.trim()).filter(l => l.length > 3);

  // Define comprehensive education keywords
  const degreeKeywords = [
    'Matric', 'Matriculation', 'O Levels', 'SSC',
    'Intermediate', 'Inter', 'A Levels', 'HSC',
    'Bachelor', 'Bachelors', 'BS', 'BA', 'BSc', 'BE', 'BEng', 'BBA', 'BCA',
    'Master', 'Masters', 'MS', 'MA', 'MSc', 'ME', 'MEng', 'MBA', 'MCA',
    'PhD', 'Doctorate', 'Doctor', 'MPhil',
    'Associate', 'Diploma', 'Certificate', 'Certification',
    'MD', 'JD', 'LLB', 'LLM', 'MDS', 'BDS'
  ];

  const schoolKeywords = [
    'University', 'College', 'School', 'Institute', 'Academy', 'Campus', 'Polytechnic',
    'Board', 'Education Board', 'High School', 'Secondary School', 'Primary School'
  ];

  // Process each line looking for education entries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains education-related keywords
    const hasDegree = degreeKeywords.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    const hasSchool = schoolKeywords.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasDegree || hasSchool) {
      const entry = {
        institution: null,
        degree: null,
        dates: null,
        grade: null
      };

      // Extract dates
      const datePattern = /\b(?:\d{4}\s*[-\u2013\u2014]\s*\d{4}|\d{4}\s*(?:-|to|\u2013|\u2014)\s*(?:Present|Current|Now)|\d{4})\b/gi;
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        entry.dates = dateMatch[0];
      }

      // Extract grades/GPA
      const gradePatterns = [
        /(?:GPA|CGPA|Grade|Percentage|Score)[:\s]*([\d\.]+\s*(?:out of\s*[\d\.]+)?%?)/i,
        /([\d\.]+)\s*(?:out of\s*[\d\.]+)?\s*GPA/i,
        /(?:First|Second|Third|Fourth)\s+(?:Class|Division)/i
      ];
      
      for (const pattern of gradePatterns) {
        const gradeMatch = line.match(pattern);
        if (gradeMatch) {
          entry.grade = gradeMatch[0];
          break;
        }
      }

      // Look for institution and degree patterns
      const patterns = [
        // Pattern: Degree at Institution
        /^(.*?)\s+(?:at|@|in)\s+(.+)$/i,
        
        // Pattern: Institution - Degree
        /^(.*?)\s*[-|:]\s*(.+)$/,
        
        // Pattern: Institution, Degree
        /^(.*?),\s*(.+)$/,
        
        // Pattern: Degree | Institution
        /^(.*?)\s*\|\s*(.+)$/,
        
        // Pattern: Institution (Degree)
        /^(.*?)\s*\(([^)]+)\)$/,
      ];

      let matched = false;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && match.length >= 3) {
          const part1 = match[1].trim();
          const part2 = match[2].trim();
          
          // Determine which is degree and which is institution
          const part1Lower = part1.toLowerCase();
          const part2Lower = part2.toLowerCase();
          
          const part1IsDegree = degreeKeywords.some(k => part1Lower.includes(k.toLowerCase()));
          const part2IsDegree = degreeKeywords.some(k => part2Lower.includes(k.toLowerCase()));
          const part1IsSchool = schoolKeywords.some(k => part1Lower.includes(k.toLowerCase()));
          const part2IsSchool = schoolKeywords.some(k => part2Lower.includes(k.toLowerCase()));
          
          if (part1IsDegree || part2IsSchool) {
            entry.degree = part1;
            entry.institution = part2;
            matched = true;
            break;
          } else if (part2IsDegree || part1IsSchool) {
            entry.degree = part2;
            entry.institution = part1;
            matched = true;
            break;
          }
        }
      }

      // If no pattern matched, try to identify parts separately
      if (!matched) {
        if (hasDegree && !entry.degree) {
          entry.degree = line;
        }
        if (hasSchool && !entry.institution) {
          entry.institution = line;
        }
      }

      // Add entry if we have meaningful data
      if (entry.degree || entry.institution) {
        educationEntries.push({
          institution: entry.institution || 'Institution Not Specified',
          degree: entry.degree || 'Degree Not Specified',
          dates: entry.dates || 'Dates Not Specified',
          grade: entry.grade || 'Grade Not Specified'
        });
      }
    }
  }

  console.log("Debug - Education entries found:", educationEntries);
  return educationEntries.length > 0 ? educationEntries : [];
};

// Extract skills
const extractTechnicalSkillsFromFile = (content) => {
  console.log("Debug - Technical skills extraction input preview:", content.substring(0, 500));
  
  // Look for skills sections with various headings
  const skillsSections = [
    'SKILLS', 'TECHNICAL SKILLS', 'TECHNICAL COMPETENCIES', 'TECHNICAL PROFICIENCIES',
    'PROGRAMMING LANGUAGES', 'DEVELOPMENT TOOLS', 'FRAMEWORKS', 'SOFTWARE', 'TOOLS'
  ];
  
  let skillsContent = '';
  
  // Try to find skills section
  for (const section of skillsSections) {
    const pattern = new RegExp(`(${section})[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATES?|PROJECTS|LANGUAGES|INTERESTS?|WORK|$)`, 'i');
    const match = content.match(pattern);
    if (match) {
      skillsContent = match[0];
      break;
    }
  }
  
  // If no section found, use the entire content
  if (!skillsContent) {
    skillsContent = content;
  }

  const skills = new Set();

  // Multiple extraction patterns
  const patterns = [
    /:\s*([A-Za-z0-9\s,\-&.\/+]+)(?=\n|[.;]|$)/gi,     // Skills after colon
    /-\s*([A-Za-z0-9\s,\-&.\/+]+)(?=\n|$)/g,             // Skills after dash
    /\*\s*([A-Za-z0-9\s,\-&.\/+]+)(?=\n|$)/g,            // Skills after asterisk
    /•\s*([A-Za-z0-9\s,\-&.\/+]+)(?=\n|$)/g,             // Skills after bullet
    /\u27A4\s*([A-Za-z0-9\s,\-&.\/+]+)(?=\n|$)/g,         // Skills after arrow bullet
    /^\s*([A-Za-z0-9][A-Za-z0-9\s,&\-]+)(?=:|$)/gm,     // Lines starting with skills
  ];

  // Process each pattern
  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(skillsContent)) !== null) {
      let skillList = match[1].trim();
      
      // Remove trailing punctuation and spaces
      skillList = skillList.replace(/[.,;:\/]\s*$/, '');
      
      // Split skills based on various delimiters
      let skillsToProcess = [];
      
      if (skillList.includes('|') && skillList.length > 100) {
        // This looks like it was split poorly, extract individual tokens
        const individualKeywords = skillList.split(/\s+/);
        skillsToProcess = individualKeywords.filter(token => 
          token.length > 2 && 
          !/^(and|or|the|for|in|of|to|with|by|from|on|at|as|is|it|an|a|are|be|been|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall)$/i.test(token)
        );
      } else {
        // Split by common delimiters
        skillsToProcess = skillList.split(/[;,\/]|\s+(?:and|&|\+|plus)\s+/i);
      }
      
      skillsToProcess.forEach(skill => {
        const cleanSkill = skill.trim().replace(/[.]+$/, '');
        if (cleanSkill && cleanSkill.length > 1 && cleanSkill.length < 50) {
          // Additional validation to avoid false positives
          if (!/^(\d+|[A-Z]{2,}|[a-z]{2,})$/.test(cleanSkill) && 
              !/^(experience|knowledge|skills?|proficient|familiar|expert|advanced|intermediate|basic)$/i.test(cleanSkill)) {
            skills.add(cleanSkill);
          }
        }
      });
    }
  }

  // Also look for common technical skills directly in the content
  const commonTechSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Scala', 'C', 'R', 'MATLAB',
    // Frontend Frameworks/Libraries
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Gatsby', 'Nuxt.js', 'jQuery', 'Bootstrap', 'Tailwind', 'Material UI', 'Ant Design', 'Sass', 'Less',
    // Backend Technologies
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Rails', 'FastAPI', 'ASP.NET', 'NestJS',
    // Databases
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Oracle', 'SQLite', 'Firebase', 'Cassandra', 'DynamoDB',
    // Cloud Platforms
    'AWS', 'Azure', 'GCP', 'Heroku', 'Netlify', 'Vercel', 'DigitalOcean', 'Linode',
    // DevOps Tools
    'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI',
    // Version Control & Collaboration
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'Trello',
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'TDD', 'BDD', 'CI/CD', 'DevOps', 'Waterfall',
    // Other Technologies
    'Linux', 'Bash', 'PowerShell', 'GraphQL', 'REST', 'SOAP', 'JUnit', 'Selenium', 'Kafka', 'RabbitMQ', 'Nginx', 'Apache'
  ];

  // Check for presence of common skills in the content
  commonTechSkills.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
    if (skillRegex.test(content)) {
      skills.add(skill);
    }
  });

  const finalSkills = Array.from(skills).filter(skill => {
    // Remove skills that are too generic or part of other words
    return !/\b(experience|knowledge|skills?|proficient|familiar|expert|advanced|intermediate|basic|working|strong|good|solid)\b/i.test(skill) &&
           !/^\d+$/.test(skill) &&
           skill.length > 1;
  });

  console.log("Debug - Technical skills found:", finalSkills);
  return finalSkills;
};


const extractSoftSkillsFromFile = (content) => {
  console.log("Debug - Soft skills extraction input preview:", content.substring(0, 500));
  
  const commonSoftSkills = [
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Creativity', 'Collaboration', 'Interpersonal Skills',
    'Emotional Intelligence', 'Decision Making', 'Conflict Resolution', 'Negotiation',
    'Project Management', 'Organization', 'Attention to Detail', 'Multitasking',
    'Customer Service', 'Presentation Skills', 'Public Speaking', 'Writing Skills',
    'Analytical Skills', 'Research Skills', 'Planning', 'Strategic Thinking',
    'Innovation', 'Flexibility', 'Resilience', 'Work Ethic', 'Reliability',
    'Initiative', 'Self-Motivation', 'Learning Agility', 'Cultural Awareness'
  ];

  const foundSoftSkills = [];
  
  commonSoftSkills.forEach(skill => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp('\\b' + escapedSkill + '\\b', 'gi');
    if (skillRegex.test(content)) {
      foundSoftSkills.push(skill);
    }
  });

  console.log("Debug - Soft skills found:", foundSoftSkills);
  return foundSoftSkills;
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
      // Enhanced validation for company names - avoid false positives
      if (!exp.company || 
          exp.company.toLowerCase().trim() === 'company' || 
          exp.company.toLowerCase().includes('placeholder') ||
          exp.company.toLowerCase().includes('enter company') ||
          exp.company.toLowerCase().includes('your company')) {
        validationIssues.push(`Experience entry ${idx + 1}: Company name appears to be a placeholder`);
      }
      
      // Enhanced validation for positions - avoid false positives
      if (!exp.position || 
          exp.position.toLowerCase().trim() === 'position' || 
          exp.position.toLowerCase().trim() === 'role' ||
          exp.position.toLowerCase().includes('placeholder') ||
          exp.position.toLowerCase().includes('enter position') ||
          exp.position.toLowerCase().includes('job title')) {
        validationIssues.push(`Experience entry ${idx + 1}: Position appears to be a placeholder`);
      }
    });
  }

  // Validate education entries
  if (parsedData.extractedData.education && Array.isArray(parsedData.extractedData.education)) {
    parsedData.extractedData.education.forEach((edu, idx) => {
      // Enhanced validation for institutions - avoid false positives
      if (!edu.institution || 
          edu.institution.toLowerCase().trim() === 'university' || 
          edu.institution.toLowerCase().trim() === 'institution' ||
          edu.institution.toLowerCase().includes('placeholder') ||
          edu.institution.toLowerCase().includes('enter institution') ||
          edu.institution.toLowerCase().includes('school name')) {
        validationIssues.push(`Education entry ${idx + 1}: Institution appears to be a placeholder`);
      }
      
      // Enhanced validation for degrees - avoid false positives
      if (!edu.degree || 
          edu.degree.toLowerCase().trim() === 'degree' || 
          edu.degree.toLowerCase().trim() === 'bachelor' ||
          edu.degree.toLowerCase().trim() === 'master' ||
          edu.degree.toLowerCase().includes('placeholder') ||
          edu.degree.toLowerCase().includes('enter degree')) {
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
  // Use centralized AI service which handles backend preference and direct fallbacks
  try {
    const analysis = await analyzeResumeWithAI(resumeData);
    if (analysis) return analysis;
  } catch (error) {
    console.error("AI Analysis failed, falling back to simulation:", error);
  }

  // Fallback to simulation if AI fails
  return new Promise((resolve) => {
    setTimeout(() => {
      // Advanced analysis results with industry-specific recommendations
      const analysis = {
        overallScore: calculateOverallScore(resumeData),
        scores: {
          ats: Math.min(Math.floor(resumeData.extractedData.experience.length * 6), 30),
          keyword: Math.min(Math.floor(resumeData.extractedData.skills.technical.length * 2), 30),
          content: Math.min(Math.floor(resumeData.extractedData.experience.filter(exp => exp.responsibilities.length > 0).length * 4 + 8), 20),
          relevance: Math.min(Math.floor(resumeData.extractedData.skills.technical.length * 1.5), 20)
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
          "Could benefit from more diverse technology stack examples"
        ],
        suggestions: generateSuggestions(resumeData),
        industrySpecific: {
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
        personalization: {
          targetRoleFit: 'good',
          careerGoalsAlignment: 'medium',
          customFeedback: generateCustomFeedback(resumeData)
        }
      };

      resolve(analysis);
    }, 2500);
  });
};

// Calculate overall score based on multiple factors
const calculateOverallScore = (resumeData) => {
  // Base score calculation - starting from 0 and building up
  let score = 0;

  // Experience score (0-25)
  const experienceCount = resumeData?.extractedData?.experience?.length || 0;
  const experienceScore = Math.min(experienceCount * 8, 25);

  // Skills score (0-25) - weighted based on diversity and relevance
  const technicalSkillsCount = resumeData?.extractedData?.skills?.technical?.length || 0;
  const softSkillsCount = resumeData?.extractedData?.skills?.soft?.length || 0;
  const skillsScore = Math.min((technicalSkillsCount * 1.5) + (softSkillsCount * 0.8), 25);

  // Education score (0-15) - weighted based on degree level
  const educationCount = resumeData?.extractedData?.education?.length || 0;
  const educationScore = educationCount > 0 ? 10 : 0;

  // Certifications score (0-15) - more weight per certification
  const certificationsCount = resumeData?.extractedData?.certifications?.length || 0;
  const certificationsScore = Math.min(certificationsCount * 4, 15);

  // Projects score (0-10) - weighted based on quality indicators
  const projectsCount = resumeData?.extractedData?.projects?.length || 0;
  const projectsScore = Math.min(projectsCount * 2.5, 10);

  // Summary score (0-10) - based on length and content quality
  const summaryText = resumeData?.extractedData?.summary || '';
  const summaryLength = summaryText.trim().length;
  const summaryScore = summaryLength > 0 ? Math.min(summaryLength / 10, 10) : 0; // Up to 100 chars gets full score

  // Quality factors bonus
  let qualityBonus = 0;

  // Check for quantifiable achievements in experience
  const experiences = resumeData?.extractedData?.experience || [];
  const hasQuantifiedAchievements = experiences.some(exp =>
    exp.responsibilities?.some(resp =>
      /\d+%|\d+\s*(users|customers|dollars|budget|team|projects)/i.test(resp)
    )
  );

  if (hasQuantifiedAchievements) {
    qualityBonus += 5;
  }

  // Check for action verbs in experience descriptions
  const actionVerbs = ['developed', 'managed', 'created', 'designed', 'implemented', 'optimized', 'led', 'delivered'];
  const hasActionVerbs = experiences.some(exp =>
    exp.responsibilities?.some(resp =>
      actionVerbs.some(verb => resp.toLowerCase().includes(verb))
    )
  );

  if (hasActionVerbs) {
    qualityBonus += 3;
  }

  score = experienceScore + skillsScore + educationScore + certificationsScore + projectsScore + summaryScore + qualityBonus;

  // Apply reasonable upper limit
  return Math.max(5, Math.min(score, 100)); // Ensure at least 5% if some data exists, cap at 100
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
  const suggestions = [];

  // Check for missing quantified achievements
  const experiences = resumeData?.extractedData?.experience || [];
  const hasQuantifiedAchievements = experiences.some(exp =>
    exp.responsibilities?.some(resp =>
      /\d+%|\d+\s*(users|customers|dollars|budget|team|projects|improved|reduced|increased|generated)/i.test(resp)
    )
  );

  if (!hasQuantifiedAchievements) {
    suggestions.push("Add specific metrics to quantify your achievements (e.g., 'increased efficiency by 30%', 'managed team of 5 developers', 'reduced costs by 20%')");
  }

  // Check for certifications
  const certificationsCount = resumeData?.extractedData?.certifications?.length || 0;
  if (certificationsCount === 0) {
    suggestions.push("Include relevant certifications or online courses to show continuous learning");
  }

  // Check for summary
  const hasSummary = !!(resumeData?.extractedData?.summary && resumeData.extractedData.summary.trim().length > 0);
  if (!hasSummary) {
    suggestions.push("Add a compelling summary section that highlights your key qualifications and career objectives");
  } else {
    const summaryLength = resumeData?.extractedData?.summary?.trim().length || 0;
    if (summaryLength < 50) {
      suggestions.push("Expand your summary section to better showcase your qualifications and experience");
    }
  }

  // Check for action verbs
  const actionVerbs = ['developed', 'managed', 'created', 'designed', 'implemented', 'optimized', 'led', 'delivered', 'built', 'architected'];
  const hasActionVerbs = experiences.some(exp =>
    exp.responsibilities?.some(resp =>
      actionVerbs.some(verb => resp.toLowerCase().includes(verb))
    )
  );

  if (!hasActionVerbs) {
    suggestions.push("Use action verbs like 'developed', 'managed', 'created', 'designed', 'implemented' to describe your achievements");
  }

  // Check for specific technical skills
  const technicalSkills = resumeData?.extractedData?.skills?.technical || [];
  if (technicalSkills.length < 5) {
    suggestions.push("Include more specific technical skills relevant to your target role");
  }

  // Check for soft skills
  const softSkills = resumeData?.extractedData?.skills?.soft || [];
  if (softSkills.length === 0) {
    suggestions.push("Consider adding soft skills like communication, teamwork, problem-solving, or leadership");
  }

  // Check for projects
  const projectsCount = resumeData?.extractedData?.projects?.length || 0;
  if (projectsCount === 0) {
    suggestions.push("Add relevant projects to demonstrate practical application of your skills");
  }

  // If no suggestions were added, provide general ones
  if (suggestions.length === 0) {
    suggestions.push(
      "Add specific metrics to quantify your achievements (e.g., 'increased efficiency by 30%', 'managed team of 5 developers')",
      "Include relevant certifications or online courses to show continuous learning",
      "Tailor your summary to the specific role you're targeting",
      "Emphasize leadership and teamwork experiences more prominently"
    );
  }

  return suggestions;
};

// Generate custom feedback
const generateCustomFeedback = (resumeData) => {
  const experienceCount = resumeData?.extractedData?.experience?.length || 0;
  const technicalSkillsCount = resumeData?.extractedData?.skills?.technical?.length || 0;
  const certificationsCount = resumeData?.extractedData?.certifications?.length || 0;
  const projectsCount = resumeData?.extractedData?.projects?.length || 0;
  const latestPosition = resumeData?.extractedData?.experience[0]?.position || 'your field';

  let feedback = `Based on your experience in ${latestPosition}, here's an assessment of your resume: `;

  if (experienceCount === 0) {
    feedback += "You have no work experience listed, which may impact your competitiveness. Consider adding internships, freelance work, or volunteer experiences. ";
  } else if (experienceCount < 2) {
    feedback += "You have limited work experience. Adding more relevant experience could strengthen your profile. ";
  } else {
    feedback += `You have ${experienceCount} positions of experience, which is a good foundation. `;
  }

  if (technicalSkillsCount < 5) {
    feedback += `You have ${technicalSkillsCount} technical skills listed. Consider adding more relevant technical skills to increase your match with job requirements. `;
  } else {
    feedback += "Your technical skills portfolio is well-rounded. ";
  }

  if (certificationsCount === 0) {
    feedback += "Consider pursuing relevant certifications to boost your credentials. ";
  } else {
    feedback += `You have ${certificationsCount} certifications, which adds credibility to your profile. `;
  }

  if (projectsCount === 0) {
    feedback += "Adding projects would demonstrate practical application of your skills. ";
  } else {
    feedback += `Your ${projectsCount} projects showcase hands-on experience. `;
  }

  feedback += "To improve your competitiveness for senior roles, focus on showcasing measurable impacts of your work and obtaining additional certifications in emerging technologies.";

  return feedback;
};

// Enhanced keyword matching service with backend priority
const matchKeywords = async (resumeData, jobDescription) => {
  try {
    const results = await matchJobDescriptionWithAI(resumeData, jobDescription);
    if (results) return results;
  } catch (error) {
    console.warn('AI matching service failed, falling back to simulation:', error);
  }

  // Fallback to simulated matching if AI fails
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract keywords from job description and resume
      const jobKeywords = extractKeywords(jobDescription);
      const resumeKeywords = resumeData?.extractedData?.skills?.technical || [];

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

      const totalKeywords = matched.length + missing.length;
      const matchPercentage = totalKeywords > 0 ? Math.round((matched.length / totalKeywords) * 100) : 0;

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
