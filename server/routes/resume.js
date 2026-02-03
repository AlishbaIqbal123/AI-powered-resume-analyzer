const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

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

// Import resume parser service
const { parseResume, analyzeResume, matchKeywords } = require('../services/resumeParser');
const Resume = require('../models/Resume');
const auth = require('../middleware/auth'); // Assuming we'll create this

// POST endpoint to upload and parse resume
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let fileContent = '';

    // Parse file based on type
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      fileContent = data.text;
    } else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      fileContent = result.value;
    } else if (fileExtension === '.txt') {
      fileContent = fs.readFileSync(filePath, 'utf8');
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

    // Save resume to database
    const newResume = new Resume({
      userId: req.user ? req.user.id : null, // Assuming user is authenticated
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      originalContent: fileContent,
      extractedData: parsedResume.extractedData
    });

    await newResume.save();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        ...parsedResume,
        _id: newResume._id // Include the database ID
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
      await Resume.findByIdAndUpdate(resumeData._id, {
        analysisResults: analysis
      });
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
      await Resume.findByIdAndUpdate(resumeData._id, {
        keywordMatches: matchResults
      });
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

module.exports = router;