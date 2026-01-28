import { OPENAI_API_KEY, OPENAI_API_URL, MODEL_NAME } from '../config/apiConfig';

const EXPERT_SYSTEM_PROMPT = `You are an elite AI Resume Analyzer and Career Coach with 15+ years of experience in technical recruiting for Fortune 500 tech companies.

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
- Always remain contextual to the provided resume data.`;

const generateResumeAdvice = async (userMessage, resumeData, analysisResults) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your environment variables.');
  }

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}

  CHATBOT MODE:
  The user is asking a question about their resume.
  - Act as a friendly professional coach.
  - Answer their question using their specific resume data.
  `;

  const userPrompt = `
    Here is the user's resume data (Parsed Text):
    ${resumeData.rawText || JSON.stringify(resumeData.extractedData || {}, null, 2)}
    
    Here is the analysis of their resume: ${JSON.stringify(analysisResults || {}, null, 2)}
    
    The user asked: "${userMessage}"
    
    Provide specific, actionable advice based on their resume data and the analysis.
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

const analyzeResumeWithAI = async (resumeData) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing');
  }

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}

  RESUME ANALYSIS MODE:
  Evaluate this resume for software engineering roles.
  
  CRITICAL: You MUST return a valid JSON object with this EXACT structure. Do not return markdown.
  {
    "overallScore": number (0-100),
    "formattingScore": number (0-100),
    "contentScore": number (0-100),
    "relevanceScore": number (0-100),
    "strengths": ["string"],
    "weaknesses": ["string"],
    "suggestions": ["string"],
    "industrySpecific": {
      "recommendations": ["string"],
      "trendingKeywords": ["string"]
    },
    "keywordMatches": {
      "matched": ["string"],
      "missing": ["string"]
    },
    "personalization": {
      "targetRoleFit": "string",
      "careerGoalsAlignment": "string",
      "customFeedback": "string"
    }
  }`;

  const userPrompt = `
    Here is the full text of the resume:
    ---
    ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}
    ---
    
    Please evaluate this resume against modern software engineering standards. Returns raw JSON values.
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error performing AI analysis:', error);
    throw error;
  }
};

const matchJobDescriptionWithAI = async (resumeData, jobDescription) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing');
  }

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}

  JOB MATCHING MODE:
  Compare the resume against the job requirements.
  
  CRITICAL: You MUST return a valid JSON object with this EXACT structure. Do not return markdown.
  {
    "matchPercentage": number (0-100),
    "matched": ["string"],
    "missing": ["string"],
    "totalJobKeywords": number,
    "analysis": "Brief explanation of the fit",
    "recommendations": ["string"]
  }`;

  const userPrompt = `
    RESUME CONTENT:
    ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}
    
    JOB DESCRIPTION:
    ${jobDescription}
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error performing JD matching:', error);
    throw error;
  }
};

const parseStructuredDataWithAI = async (rawText) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing');
  }

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}

  DATA EXTRACTION MODE:
  Extract ALL information from the resume text into a highly detailed structured JSON.
  
  CRITICAL: You MUST find the following contact information accurately:
  - "name": Full name of the candidate.
  - "email": Primary email address.
  - "phone": Contact phone number.
  - "address": City, State/Country or full address.
  
  Scan the beginning of the text carefully for these details as they are often at the top.
  
  Return a valid JSON object with this EXACT structure.
  {
    "name": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "summary": "string",
    "experience": [
      { 
        "company": "string", 
        "position": "string", 
        "duration": "string", 
        "location": "string", 
        "description": "string",
        "responsibilities": ["string"],
        "technologies": ["string"]
      }
    ],
    "education": [
      { 
        "institution": "string", 
        "degree": "string", 
        "dates": "string",
        "gpa": "string",
        "coursework": ["string"],
        "honors": ["string"]
      }
    ],
    "skills": {
      "technical": ["string"],
      "soft": ["string"]
    },
    "projects": [
      { 
        "name": "string", 
        "description": "string", 
        "technologies": ["string"],
        "achievements": ["string"],
        "link": "string"
      }
    ],
    "certifications": [
      { "name": "string", "issuer": "string", "date": "string" }
    ],
    "languages": [
      { "language": "string", "proficiency": "string" }
    ],
    "interests": ["string"]
  }
  
  Be extremely thorough. If a section exists, extract every detail. 
  Do not include markdown. Return raw JSON only. Use null or empty arrays if data is truly missing.`;

  const userPrompt = `
    RESUME TEXT:
    ${rawText}
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for factual extraction
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error performing AI extraction:', error);
    throw error;
  }
};

export { generateResumeAdvice, analyzeResumeWithAI, matchJobDescriptionWithAI, parseStructuredDataWithAI };