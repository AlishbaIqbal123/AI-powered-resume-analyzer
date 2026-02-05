const express = require('express');
const router = express.Router();
const { generateResumeAdvice, analyzeResumeWithAI, matchJobDescriptionWithAI, parseStructuredDataWithAI } = require('../services/aiService');

// Safe imports
let ragService, Resume, auth;
try {
  ragService = require('../services/ragService');
} catch (err) {
  console.warn('RAG service unavailable:', err.message);
}

try {
  Resume = require('../models/Resume');
} catch (err) {
  console.warn('Resume model unavailable:', err.message);
}

try {
  auth = require('../middleware/auth');
} catch (err) {
  console.warn('Auth middleware unavailable:', err.message);
}

// POST endpoint to generate resume advice
router.post('/advice', async (req, res) => {
  try {
    const { message, resumeData, analysisResults } = req.body;

    if (!message || !resumeData) {
      return res.status(400).json({ error: 'Message and resume data are required' });
    }

    // Try RAG-based response first if OpenAI is available and ragService loaded
    if (process.env.OPENAI_API_KEY && ragService) {
      try {
        const ragAdvice = await ragService.generateResponse(message, resumeData, analysisResults);
        res.json({
          success: true,
          data: ragAdvice
        });
        return;
      } catch (ragError) {
        console.error('RAG service failed, falling back to direct AI:', ragError);
      }
    }

    // Fallback to original AI service
    const advice = await generateResumeAdvice(message, resumeData, analysisResults);

    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error('Error generating advice:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to analyze resume with AI
router.post('/analyze', async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const analysis = await analyzeResumeWithAI(resumeData);

    // Index resume in vector database for RAG
    if (resumeData._id && process.env.OPENAI_API_KEY && ragService) {
      try {
        await ragService.indexResume(
          resumeData.userId || 'anonymous',
          resumeData._id,
          resumeData.rawText,
          resumeData.extractedData
        );
      } catch (indexError) {
        console.error('Error indexing resume in vector DB:', indexError);
      }
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing resume with AI:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to match job description with AI
router.post('/match-jd', async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const matchResults = await matchJobDescriptionWithAI(resumeData, jobDescription);

    res.json({
      success: true,
      data: matchResults
    });
  } catch (error) {
    console.error('Error matching job description:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to parse structured data with AI
router.post('/parse-structured', async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Raw text is required' });
    }

    const structuredData = await parseStructuredDataWithAI(rawText);

    res.json({
      success: true,
      data: structuredData
    });
  } catch (error) {
    console.error('Error parsing structured data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;