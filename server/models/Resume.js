const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  },
  originalContent: {
    type: String,
    required: true
  },
  extractedData: {
    name: String,
    email: String,
    phone: String,
    address: String,
    summary: String,
    experience: [{
      company: String,
      position: String,
      duration: String,
      responsibilities: [String]
    }],
    education: [{
      institution: String,
      degree: String,
      dates: String
    }],
    skills: {
      technical: [String],
      soft: [String]
    },
    projects: [{
      name: String,
      description: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: String
    }],
    languages: [{
      language: String,
      proficiency: String
    }],
    interests: [String]
  },
  analysisResults: {
    overallScore: Number,
    scores: {
      ats: Number,
      keyword: Number,
      content: Number,
      relevance: Number
    },
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    industrySpecific: {
      recommendations: [String],
      trendingKeywords: [String]
    },
    keywordMatches: {
      matched: [String],
      missing: [String]
    },
    personalization: {
      targetRoleFit: String,
      careerGoalsAlignment: String,
      customFeedback: String
    }
  },
  keywordMatches: {
    matchPercentage: Number,
    matched: [String],
    missing: [String],
    totalJobKeywords: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
resumeSchema.pre('save', function (next) {
  this.updatedAt = Date.now;
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);