require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Attempt to connect to database
connectDB().catch(err => {
  console.error('Database connection failed:', err.message);
  console.log('Server will run in limited mode without persistent storage');
});

// Middleware
app.use(cors({
  origin: '*', // Allows all origins, including and deployment URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'AI Resume Analyzer Backend is running!' });
});

// Import route handlers
const resumeRoutes = require('./routes/resume');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');

// Routes
app.use('/api/resume', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
