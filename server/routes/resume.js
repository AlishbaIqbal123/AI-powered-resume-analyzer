const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Use Memory Storage for Vercel/Serverless compatibility
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Import services
const { parseResume, analyzeResume, matchKeywords, getResumeAdvice } = require('../services/resumeParser');
const Resume = require('../models/Resume');
const auth = require('../middleware/auth');

// POST endpoint to upload and parse resume
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    let fileContent = '';

    // Parse file based on type using Buffer (Memory)
    if (fileExtension === '.pdf') {
      const data = await pdfParse(req.file.buffer);
      fileContent = data.text;
    } else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      fileContent = result.value;
    } else if (fileExtension === '.txt') {
      fileContent = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    // Process the file content through our parser
    const parsedResume = await parseResume({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      content: fileContent
    });

    // Save resume to database (gracefully handle failures if DB is in limited mode)
    let savedResumeId = null;
    try {
      const newResume = new Resume({
        userId: req.user ? req.user.id : null,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        originalContent: fileContent,
        extractedData: parsedResume.extractedData
      });
      await newResume.save();
      savedResumeId = newResume._id;
    } catch (dbError) {
      console.warn('Database save failed, continuing in limited mode:', dbError.message);
    }

    res.json({
      success: true,
      data: {
        ...parsedResume,
        _id: savedResumeId
      }
    });
  } catch (error) {
    console.error('Error processing resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to analyze resume
router.post('/analyze', async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ error: 'Resume data is required' });
    }

    const analysis = await analyzeResume(resumeData);

    // Update the resume document in the database with analysis results
    if (resumeData._id) {
      try {
        await Resume.findByIdAndUpdate(resumeData._id, {
          analysisResults: analysis
        });
      } catch (dbError) {
        console.warn('Database update failed for analysis, continuing:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to match keywords with job description
router.post('/match-keywords', async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Resume data and job description are required' });
    }

    const matchResults = await matchKeywords(resumeData, jobDescription);

    // Update the resume document in the database with keyword matching results
    if (resumeData._id) {
      try {
        await Resume.findByIdAndUpdate(resumeData._id, {
          keywordMatches: matchResults
        });
      } catch (dbError) {
        console.warn('Database update failed for keyword matching, continuing:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: matchResults
    });
  } catch (error) {
    console.error('Error matching keywords:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint to get AI advice/chat
router.post('/advice', async (req, res) => {
  try {
    const { message, resumeData, analysisResults } = req.body;

    if (!message || !resumeData) {
      return res.status(400).json({ error: 'Message and resume data are required' });
    }

    const advice = await getResumeAdvice(message, resumeData, analysisResults);

    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error('Error getting AI advice:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;