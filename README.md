# AI-Powered Resume Analyzer

A comprehensive resume analysis and optimization platform that leverages artificial intelligence to provide detailed insights, keyword matching, and personalized recommendations to improve job seekers' resumes.

## 🚀 Features

- **Advanced Resume Parsing**: Supports PDF, DOCX, and TXT formats with intelligent content extraction
- **AI-Powered Analysis**: Comprehensive evaluation using OpenAI GPT models
- **Keyword Matching**: Compare resumes against job descriptions for better alignment
- **Multi-Job Comparison**: Analyze resume fit across multiple job postings simultaneously
- **Interactive Chatbot**: AI-powered career advisor for personalized guidance
- **Professional Templates**: ATS-compatible resume templates
- **Detailed Scoring**: Multi-dimensional scoring system covering ATS compliance, keyword alignment, content quality, and role relevance
- **Export Functionality**: Export analysis reports in PDF, JSON, or DOCX formats
- **User Authentication**: Secure user accounts with resume history tracking

## 🏗️ Architecture

### Frontend (React)
- **Components**: Modular component architecture with reusable UI elements
- **State Management**: React hooks for local state management
- **API Integration**: Direct communication with backend services
- **Styling**: CSS modules with dark/light theme support

### Backend (Node.js/Express)
- **API Endpoints**: RESTful API for all resume operations
- **Database**: MongoDB for storing user data and resume analysis
- **Vector Database**: Integrated vector storage for semantic search (simulated)
- **AI Services**: Integration with OpenAI for analysis and recommendations
- **File Processing**: PDF and DOCX parsing with text extraction

## 🛠️ Tech Stack

### Frontend
- React 19.x
- React Icons
- PDF.js (for PDF parsing)
- Mammoth (for DOCX parsing)

### Backend
- Node.js
- Express.js
- MongoDB/Mongoose
- OpenAI API
- Multer (file uploads)
- PDF-Parser
- Mammoth

### AI & NLP
- OpenAI GPT-4o-mini
- Semantic search capabilities
- Natural Language Processing

## 📋 Installation

### Prerequisites
- Node.js 16.x or higher
- MongoDB (local or cloud instance)
- OpenAI API key

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI-powered-resume-analyzer
```

2. **Install frontend dependencies**
```bash
cd AI-powered-resume-analyzer
npm install
```

3. **Setup backend**
```bash
cd server
npm install
```

4. **Configure environment variables**

Create a `.env` file in the `server` directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Create a `.env` file in the frontend root directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

5. **Run the application**

Start the backend server:
```bash
cd server
npm start
```

In a new terminal, start the frontend:
```bash
npm start
```

## 🧪 Testing

### Frontend Tests
```bash
npm test
```

### Backend Tests
```bash
cd server
npm test
```

### Manual Testing Steps
1. Upload a resume (PDF, DOCX, or TXT)
2. Verify parsing accuracy
3. Check AI analysis results
4. Test keyword matching with job descriptions
5. Verify export functionality
6. Test chatbot interactions
7. Validate responsive design across devices

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy the build folder to your hosting platform
```

### Backend Deployment (Railway/Render)
1. Push code to GitHub
2. Connect your repository to the deployment platform
3. Configure environment variables
4. Deploy the application

### Docker Deployment
```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 API Endpoints

### Resume Operations
- `POST /api/resume/upload` - Upload and parse resume
- `POST /api/resume/analyze` - Analyze resume with AI
- `POST /api/resume/match-keywords` - Match keywords with job description

### AI Services
- `POST /api/ai/advice` - Get resume advice from AI
- `POST /api/ai/analyze` - Perform detailed AI analysis
- `POST /api/ai/match-jd` - Match resume with job description

### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

## 📊 Scoring System

The application uses a comprehensive scoring system:

- **ATS Compatibility (0-30)**: How well the resume passes through applicant tracking systems
- **Keyword Match (0-30)**: Alignment with job requirements and industry keywords
- **Content Quality (0-20)**: Writing quality, achievements, and impact statements
- **Role Relevance (0-20)**: Fit for the target role and industry

## 🤖 AI Capabilities

### Resume Analysis
- Extract structured data from unstructured resume content
- Identify strengths and weaknesses
- Provide personalized recommendations
- Assess ATS compatibility

### Job Matching
- Compare resume against job descriptions
- Identify missing keywords
- Recommend improvements for specific roles

### Conversational AI
- Interactive chatbot for resume guidance
- Context-aware recommendations
- Personalized feedback

## 📁 Project Structure

```
AI-powered-resume-analyzer/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── Chatbot/        # Chatbot functionality
│   │   ├── AIAnalysisEngine.js
│   │   ├── Dashboard.js
│   │   ├── KeywordMatcher.js
│   │   ├── ResumeUpload.js
│   │   ├── Sidebar.js
│   │   └── ...
│   ├── config/             # Configuration files
│   ├── services/           # API services
│   │   ├── aiService.js
│   │   └── resumeParser.js
│   ├── utils/              # Utility functions
│   └── App.js
├── server/                 # Backend server
│   ├── routes/             # API routes
│   ├── models/             # Database models
│   ├── services/           # Business logic
│   ├── middleware/         # Authentication, etc.
│   ├── utils/              # Utility functions
│   └── server.js
├── package.json
└── README.md
```

## 💡 Usage Tips

1. **For Best Results**:
   - Use clear, well-formatted resumes
   - Include quantifiable achievements
   - Tailor content to specific job descriptions

2. **Maximizing ATS Score**:
   - Use standard section headings
   - Avoid graphics and complex formatting
   - Include relevant keywords from job postings

3. **Improving Content Quality**:
   - Use action verbs
   - Quantify achievements with numbers
   - Focus on results rather than responsibilities

## 🔒 Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation and sanitization
- Secure file upload handling
- Rate limiting for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- Integration with LinkedIn profiles
- Resume builder with drag-and-drop interface
- Multi-language support
- Integration with job boards
- Team collaboration features
- Advanced analytics dashboard
- Mobile application
- Email notifications
- Integration with calendar apps for interview scheduling

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

Built with ❤️ for job seekers everywhere!