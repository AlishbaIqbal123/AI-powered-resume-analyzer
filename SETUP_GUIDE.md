# AI-Powered Resume Analyzer - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (local installation or cloud instance)

## Installation Steps

### 1. Backend Setup (Server)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ai-resume-analyzer
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup (Client)

1. Navigate to the project root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with the following content:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

## API Endpoints

The backend server provides the following API endpoints:

- `GET /` - Health check endpoint
- `POST /api/resume/upload` - Upload and parse resume
- `POST /api/resume/analyze` - Analyze resume
- `POST /api/resume/match-keywords` - Match keywords with job description
- `POST /api/ai/analyze` - AI-powered resume analysis
- `POST /api/ai/match-jd` - AI-powered job description matching
- `POST /api/ai/advice` - AI-powered resume advice
- `POST /api/ai/parse-structured` - AI-powered structured data parsing

## Features Fixed

1. **Resume Parsing Accuracy Issues**:
   - Enhanced regex patterns for better name, email, phone, and location extraction
   - Improved experience and education section parsing
   - Better skills extraction with comprehensive technology lists
   - Added validation for extracted data quality

2. **Keyword Matching Issues**:
   - Fixed "Matching Encountered an Issue" error
   - Implemented backend AI service priority
   - Added fallback mechanisms for robust functionality

3. **AI Analysis Issues**:
   - Fixed "Failed to analyze with AI" error
   - Implemented proper backend AI service integration
   - Added retry mechanisms and error handling

4. **AI Career Coach Functionality**:
   - Fixed empty results issue
   - Implemented proper RAG (Retrieval Augmented Generation) system
   - Added contextual responses based on resume data

5. **AI Resume Advisor**:
   - Enhanced with meaningful feedback
   - Added personalized suggestions based on resume content
   - Integrated with backend AI services

## Troubleshooting

### Common Issues:

1. **Port Already in Use**:
   - Backend server runs on port 5000
   - Frontend runs on port 3000 (or alternative if 3000 is occupied)

2. **API Key Issues**:
   - Ensure both frontend and backend have valid OpenAI API keys
   - Check that API keys have sufficient quota

3. **Database Connection Issues**:
   - Verify MongoDB is running locally or update MONGODB_URI for cloud instance

4. **CORS Issues**:
   - Backend includes CORS middleware to allow frontend requests

## Running the Application

1. Start the backend server first:
   ```bash
   cd server
   npm start
   ```

2. In a new terminal, start the frontend:
   ```bash
   npm start
   ```

3. Access the application in your browser at the URL shown in the terminal output.

## Dependencies

### Backend Dependencies:
- express: Web framework
- cors: Cross-origin resource sharing
- multer: File upload handling
- pdf-parse: PDF text extraction
- mammoth: DOCX text extraction
- openai: OpenAI API integration
- dotenv: Environment variable management
- mongoose: MongoDB object modeling
- jsonwebtoken: JWT authentication
- axios: HTTP client
- @pinecone-database/pinecone: Vector database (if using Pinecone)

### Frontend Dependencies:
- react: UI library
- react-router-dom: Client-side routing
- pdfjs-dist: PDF rendering
- mammoth: DOCX processing
- Various UI and utility libraries

## Security Notes

- Never commit API keys or sensitive data to version control
- Use environment variables for all sensitive configuration
- Implement proper authentication in production environments