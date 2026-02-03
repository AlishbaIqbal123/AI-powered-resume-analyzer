const OpenAI = require('openai');
const { OPENAI_API_KEY } = process.env;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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

const callOpenAIWithRetry = async (payload, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await client.chat.completions.create(payload);

      return response.choices[0].message.content;
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        console.warn(`Rate limit hit (429). Retry attempt ${i + 1}/${retries}...`);
        await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
        continue;
      }
      
      if (i === retries - 1) throw error;
      console.warn(`Request failed. Retrying in ${delay}ms...`, error);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

const generateResumeAdvice = async (userMessage, resumeData, analysisResults) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured.');
  }

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}\n\nCHATBOT MODE: Act as a friendly coach. Answer using user's resume data.`;
  const userPrompt = `Resume Data: ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}\nAnalysis: ${JSON.stringify(analysisResults)}\nUser Question: "${userMessage}"`;

  try {
    const content = await callOpenAIWithRetry({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    return content;
  } catch (error) {
    console.error('Advice generation failed:', error);
    return "I'm having trouble connecting to my brain right now (Rate limit or API error). Please try again in a moment!";
  }
};

const analyzeResumeWithAI = async (resumeData) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}
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
    const content = await callOpenAIWithRetry({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
};

const matchJobDescriptionWithAI = async (resumeData, jobDescription) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}\nJOB MATCHING MODE: Return JSON { "matchPercentage": number, "matched": [], "missing": [], "totalJobKeywords": number, "analysis": "string", "recommendations": [] }`;
  const userPrompt = `Resume: ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}\nJD: ${jobDescription}`;

  try {
    const content = await callOpenAIWithRetry({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('JD matching failed:', error);
    throw error;
  }
};

const parseStructuredDataWithAI = async (rawText) => {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key is missing');

  const systemPrompt = `${EXPERT_SYSTEM_PROMPT}
  DATA EXTRACTION MODE: Extract into JSON. 
  CRITICAL: 
  - "address": CITY AND STATE/COUNTRY ONLY. (e.g. "New York, NY" or "London, UK"). 
  - If no location, return NULL. 
  - NO placeholders like "[Location]".
  - NO company names in address field.
  - "experience": List real jobs with clear titles.
  - Structure: { "name": null, "email": null, "phone": null, "address": null, "summary": null, "experience": [], "education": [], "skills": { "technical": [], "soft": [] }, "projects": [], "certifications": [], "languages": [], "interests": [] }`;

  try {
    const content = await callOpenAIWithRetry({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText }
      ],
      temperature: 0.1,
      max_tokens: 2500
    });
    // Multi-stage cleaning to handle varied LLM responses
    const cleanContent = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('AI extraction failed:', error);
    throw error;
  }
};

module.exports = { 
  generateResumeAdvice, 
  analyzeResumeWithAI, 
  matchJobDescriptionWithAI, 
  parseStructuredDataWithAI 
};