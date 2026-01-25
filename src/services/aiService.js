import { OPENAI_API_KEY, OPENAI_API_URL, MODEL_NAME } from '../config/apiConfig';

const generateResumeAdvice = async (userMessage, resumeData, analysisResults) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set REACT_APP_OPENAI_API_KEY in your environment variables.');
  }

  const systemPrompt = `You are an expert resume advisor. Help users improve their resumes based on their experience and skills. Provide specific, actionable advice that is personalized to their background and career goals. Be encouraging but honest, and always tie your suggestions back to their actual resume content when possible.`;

  const userPrompt = `
    Here is the user's resume data: ${JSON.stringify(resumeData?.extractedData || {}, null, 2)}
    
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

export { generateResumeAdvice };