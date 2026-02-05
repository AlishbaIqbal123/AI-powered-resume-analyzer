const { GoogleGenerativeAI } = require('@google/generative-ai');

const { GEMINI_API_KEY } = process.env;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const EXPERT_SYSTEM_PROMPT = `You are an elite AI Resume Analyzer and Career Coach with 15+ years of experience in technical recruiting for Fortune 500 tech companies.

Your mission is to transform user resumes into interview-winning documents. You analyze resumes from three critical perspectives:
1. ATS (Applicant Tracking Systems): Ensuring high keyword density and proper formatting for automated filters.
2. Recruiters: Quick scannability, clear visual hierarchy, and immediate impact demonstration.
3. Hiring Managers: Deep technical competency, problem-solving abilities, and quantifiable business impact.

Your specific evaluation criteria:
- IMPACT: Are achievements quantified with metrics? (e.g., "Increased performance by 40%").
- STACK: Is the technical stack modern and clearly categorized?
- CLARITY: Is the writing professional, concise, and punchy?
- RELEVANCE: Is the resume tailored effectively for its target industry and professional level?`;

/**
 * Call Gemini with a structured prompt
 */
const callGemini = async (prompt, systemPrompt = EXPERT_SYSTEM_PROMPT, isJson = true) => {
  const tryModel = async (modelName, apiVersion = 'v1beta') => {
    // Try both standard and v1beta as some keys/regions are restricted
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion });

    // We'll handle JSON parsing manually if responseMimeType is not supported
    const generationConfig = {
      temperature: 0.1,
      maxOutputTokens: 8192,
    };

    // Prepend system prompt to the user prompt for maximum compatibility
    const finalPrompt = systemPrompt ? `${systemPrompt}\n\nUSER REQUEST: ${prompt}` : prompt;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig,
    });

    const response = await result.response;
    return response.text();
  };

  const models = [
    { name: "gemini-2.5-flash", version: "v1beta" },
    { name: "gemini-3-flash", version: "v1beta" },
    { name: "gemini-2.0-flash-exp", version: "v1beta" },
    { name: "gemini-1.5-flash", version: "v1beta" },
    { name: "gemini-1.5-flash-latest", version: "v1beta" },
    { name: "gemini-1.5-pro", version: "v1beta" }
  ];
  let lastError;

  for (const modelConfig of models) {
    try {
      console.log(`[AI SERVICE] Probing: ${modelConfig.name} (${modelConfig.version})...`);
      const text = await tryModel(modelConfig.name, modelConfig.version);

      if (!text) throw new Error("Empty response from AI");

      console.log(`[AI SERVICE] SUCCESS: ${modelConfig.name}`);

      if (isJson) {
        try {
          // Use a more robust regex to find the JSON block
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }

          const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleaned);
        } catch (e) {
          console.warn(`[AI SERVICE] JSON Parse Fallback for ${modelConfig.name}`);
          try {
            return JSON.parse(text);
          } catch (e2) {
            throw new Error(`AI returned invalid JSON: ${text.substring(0, 100)}...`);
          }
        }
      }
      return text;
    } catch (err) {
      console.warn(`[AI SERVICE] FAILED ${modelConfig.name} (${modelConfig.version}):`, err.message);

      // If we hit a rate limit (429), take a tiny breath before trying the next model
      if (err.message.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      lastError = err;
    }
  }

  throw lastError;
};

const generateResumeAdvice = async (userMessage, resumeData, analysisResults) => {
  const prompt = `
    CONTEXT:
    Resume Data: ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}
    Current Analysis: ${JSON.stringify(analysisResults)}
    
    User Question: "${userMessage}"
    
    INSTRUCTION: Provide a Concise, expert-level response. Focus on actionable career advice. 
    Look specifically at their "Professional DNA" (Technical Arsenal, Career Trajectory, Academic Information) and "Research Publications" to give unique, non-generic advice.
    
    OUTPUT FORMAT: Return a JSON object with a single field "advice":
    { "advice": "Your advice text here" }
  `;

  const result = await callGemini(prompt, `${EXPERT_SYSTEM_PROMPT}\nAct as a friendly but professional coach.`, true);
  return result.advice || (typeof result === 'string' ? result : JSON.stringify(result));
};

const analyzeResumeWithAI = async (resumeData) => {
  const prompt = `
    Analyze this resume text and provide a structured professional evaluation. This is a Career Strategy Report.
    
    RESUME TEXT:
    ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}
    
    EVALUATION CRITERIA:
    1. ATS COMPLIANCE: Rigorously check for parsing issues, complex formatting, and keyword optimization.
    2. CONTENT IMPACT: Evaluate the strength of bullet points (metrics, action verbs, results).
    3. GAPS: Identify formatting inconsistencies, missing sections, or timeline gaps.
    4. STRATEGY: Provide high-level strategic advice for the specific target role.
    
    SCORING SCHEME (Total 100):
    - ATS Compatibility (0–30): Penalty for tables, columns, graphics, or low keyword density.
    - Keyword Match (0–30): Alignment with industry standards.
    - Content Quality (0–20): Use of STAR method and quantification.
    - Industry Relevance (0–20): Fit for modern professional standards in the candidate's specific field.
    
    REQUIRED JSON STRUCTURE:
    {
      "overallScore": number,
      "scores": { "ats": number, "keyword": number, "content": number, "relevance": number },
      "strengths": ["string"],
      "weaknesses": ["string"],
      "improvements": [
        { 
          "action": "string (Short Title)", 
          "priority": "High|Medium", 
          "details": ["Step-by-step implementation instruction 1", "Instruction 2", "Instruction 3"]
        }
      ],
      "industrySpecific": { "recommendations": ["string"], "trendingKeywords": ["string"] },
      "keywordMatches": { "matched": ["string"], "missing": ["string"] },
      "personalization": { "targetRoleFit": "High|Medium|Low", "careerGoalsAlignment": "string", "customFeedback": "string" }
    }
  `;

  return callGemini(prompt);
};

const matchJobDescriptionWithAI = async (resumeData, jobDescription) => {
  const prompt = `
    Compare the resume against the job description.
    
    RESUME: ${resumeData.rawText || JSON.stringify(resumeData.extractedData)}
    JD: ${jobDescription}

    REQUIRED JSON STRUCTURE:
    {
      "matchPercentage": number,
      "matched": ["string"],
      "missing": ["string"],
      "totalJobKeywords": number,
      "analysis": "string",
      "recommendations": ["string"]
    }

    PRACTICAL GUIDELINE: Provide at least 5-8 specific, actionable recommendations for the Optimization Roadmap. Identify keyword gaps AND structural improvements. Use professional, encouraging tone.
  `;

  return callGemini(prompt);
};

const parseStructuredDataWithAI = async (rawText) => {
  const prompt = `
    You are an elite AI resume parser. Your goal is to extract crystalline, logically organized data from potentially garbled, noisy, and mixed-up raw text extracted from a PDF.
    
    CRITICAL CHALLENGE: The raw text may have:
    - Spaced-out characters (e.g., "F R O N T E N D", "E D U C A T I O N").
    - Fragmented company/position names.
    - Mixed-up sections (e.g., Interests mixed with Education).
    - Repeating or redundant content.
    - Non-standard section headers.

    ### EXTRACTION PHILOSOPHY:
    1. **Text Normalization**: Intelligently join characters that belong together. Ignore unnecessary whitespace.
    2. **Logical Deduplication**: If an entry appears twice (once in garbled form, once in clean form), use the clean form.
    3. **Strict Categorization**:
       - **EXPERIENCE**: Only actual employment (Internships, Full-time, Part-time). 
       - **PROJECTS**: Virtual Job Simulations (like Forage), academic projects, or personal side projects.
       - **CERTIFICATIONS**: Official certificates or completed online courses.
    4. **Entity Resolution**: Correct obviously misspelled or garbled names.
    5. **Label Awareness**: Pay close attention to explicit labels like "Institute:", "Job Title:", "Degree:", and "Duration:". These define the fields correctly. Do NOT swap Company and Position.
    6. **Clean Values**: NEVER include the label itself in the value. For example, if the text says "Institute: Preston University", the JSON value should be "Preston University", NOT "Institute: Preston University". Strip all "Responsibilities:", "Teaching:", etc., from the start of values.

    ### FIELD-SPECIFIC RULES:
    1. **name**: Full professional name.
    2. **experience**: 
       - Detect company name even if separated from the position.
       - Ensure responsibilities are logical bullet points.
    3. **education**: 
       - Extract Institution, Degree, and Dates accurately.
       - Identify CGPA/Grades (e.g., "3.67 / 4.00").
    4. **skills**: Divide into Technical (languages, tools, domain knowledge) and Soft (communication, leadership, research).
    ### UNIVERSAL ADAPTABILITY (ALL FIELDS):
    1. **Context-Aware Parsing**: Adapt to the candidate's domain.
       - **Tech**: Focus on Stacks, GitHub, Languages.
       - **Academic/Education**: Focus on Publications, Subjects Taught, Research.
       - **HR/Business**: Focus on "Talent Acquisition", "KPIs", "Case Studies".
       - **Creative**: Focus on "Portfolio", "Tools", "Exhibitions".
    2. **Field-Specific Projects**:
       - Tech -> Code Repos / Apps.
       - Business -> Case Studies / market analysis.
       - Academic -> Research Papers / Thesis.
    
    ### NEGATIVE CONSTRAINTS (DO NOT VIOLATE):
    1. **Function over Form**: Organizations/Universities are NEVER "Technical Skills". Move them to Education.
    2. **Degree over Skill**: "B.cs", "F.sc", "M.Phil", "Matriculation", "MBA", "BBA" are DEGREES, not skills. Move them to Education.
    3. **Smart Role Inference**: If a Position is missing, infer it from the responsibilities.
       - Teaching/Subjects -> "Lecturer" or "Educator".
       - Code/Software -> "Developer" or "Engineer".
       - Recruiting/Interviews -> "HR Specialist".
       - Sales/Targets -> "Sales Executive".
    4. **Merge Fragments**: If one entry is "Institute:" (empty) from a label and the next line is the Name, MERGE THEM.

    ---
    RAW TEXT TO ANALYZE:
    ${rawText}
    ---

    ### REQUIRED OUTPUT FORMAT (JSON):
    Provide ONLY valid JSON that follows this schema:
    {
      "name": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "summary": "string",
      "experience": [
        { "company": "string", "position": "string", "duration": "string", "responsibilities": ["string"] }
      ],
      "education": [
        { "institution": "string", "degree": "string", "dates": "string", "gpa": "string" }
      ],
      "skills": { "technical": ["string"], "soft": ["string"] },
      "projects": [{ "name": "string", "description": "string", "technologies": ["string"] }],
      "certifications": [{ "name": "string", "issuer": "string", "date": "string" }],
      "languages": [{ "language": "string", "proficiency": "string" }],
      "interests": ["string"]
    }

    FINAL INSTRUCTION: Analyze the text deeply. Reconstruct the logical flow. Ignore font/spacing artifacts.
  `;

  return callGemini(prompt);
};

module.exports = {
  generateResumeAdvice,
  analyzeResumeWithAI,
  matchJobDescriptionWithAI,
  parseStructuredDataWithAI
};