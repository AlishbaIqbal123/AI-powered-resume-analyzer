const OpenAI = require('openai');
const vectorDB = require('../utils/vectorDbService');
const { OPENAI_API_KEY } = process.env;

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

class RagService {
  constructor() {
    this.client = client;
  }

  /**
   * Generate AI response using RAG (Retrieval Augmented Generation)
   */
  async generateResponse(query, resumeData, analysisResults = null) {
    try {
      // Step 1: Search for relevant information in the vector database
      const searchResults = await vectorDB.searchResume(
        resumeData.userId || 'anonymous', 
        query, 
        3 // Top 3 most relevant results
      );

      // Step 2: Format the context from search results
      let context = '';
      if (searchResults.length > 0) {
        context = 'Relevant resume information:\n';
        searchResults.forEach((result, index) => {
          context += `${index + 1}. ${JSON.stringify(result.content)}\n`;
        });
      } else {
        // If no results found, use the full resume data
        context = `Full resume data: ${JSON.stringify(resumeData.extractedData)}`;
      }

      // Include analysis results if available
      if (analysisResults) {
        context += `\n\nPrevious analysis: ${JSON.stringify(analysisResults)}`;
      }

      // Step 3: Create the prompt for the LLM
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
- Use the provided context to ground your responses and avoid hallucinations.`;

      const userPrompt = `Context:
${context}

User Query: "${query}"

Please provide a helpful response based on the resume data and context provided.`;

      // Step 4: Call the OpenAI API
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error in RAG service:', error);
      throw error;
    }
  }

  /**
   * Index resume content in the vector database
   */
  async indexResume(userId, resumeId, resumeContent, extractedData) {
    try {
      return await vectorDB.indexResume(userId, resumeId, resumeContent, extractedData);
    } catch (error) {
      console.error('Error indexing resume in RAG service:', error);
      throw error;
    }
  }

  /**
   * Find similar job descriptions to a resume
   */
  async findSimilarJobs(resumeData, topK = 5) {
    try {
      return await vectorDB.findSimilarJobs(resumeData, topK);
    } catch (error) {
      console.error('Error finding similar jobs in RAG service:', error);
      throw error;
    }
  }
}

// Export singleton instance
const ragService = new RagService();
module.exports = ragService;