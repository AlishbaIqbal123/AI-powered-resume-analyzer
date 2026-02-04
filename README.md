# Gemini-Powered Resume Analyzer

A sophisticated, AI-driven platform for automated resume evaluation, career strategy generation, and intelligent job matching.

## 🚀 Core Capabilities

### 1. **Neural Resume Parsing**
   - **Multi-Format Support**: Instantly processes PDF, DOCX, and TXT files.
   - **Context-Aware Extraction**: Uses custom heuristic algorithms to detect complex academic headers (e.g., "Research Publications", "Academic Trajectory") alongside standard professional sections.
   - **Noise Cancellation**: Automatically strips non-essential labels (e.g., "Responsibilities:", "Job Title:") to ensure clean, database-ready output.

### 2. **Professional DNA Analysis**
   - **Deep-Dive Profiling**: Analyzes candidate data across 4 dimensions:
     - **Technical Arsenal**: Hard skills, tools, and platforms.
     - **Career Trajectory**: Chronological growth and impact assessment.
     - **Academic Foundation**: Education, degrees, and specialized research.
     - **Strategic Insights**: AI-generated strengths, weaknesses, and competitive advantages.
   - **Role-Agnostic Intelligence**: Dynamically adapts analysis to any field (Engineering, Education, Mathematics, etc.) without bias.

### 3. **AI Career Coach (Gemini 2.5/3.0)**
   - **Dual-Engine Architecture**: 
     - **Primary**: Connects to Google's Gemini 2.0 Flash / 2.5 Flash for state-of-the-art reasoning.
     - **Fallback**: Automatically switches to Gemma 3 models (27B/12B) during high-traffic periods to guarantee 100% uptime.
   - **Project-Aware Guidance**: Provides advice grounded in your specific `Resume Data` and `Research Publications`.

### 4. **Smart Job Matching**
   - **Semantic Comparison**: Goes beyond simple keyword matching to understand the *intent* of a job description.
   - **Actionable Roadmap**: Generates a concrete 8-step plan to bridge the gap between your resume and the target role.

---

## 🛠️ Technical Architecture

### **Frontend (Smart Interface)**
- **Framework**: React 18+ (Hooks-based architecture)
- **Styling**: 
  - **Dynamic Theme Engine**: Full support for Light/Dark modes with CSS Variables.
  - **Glassmorphism**: Premium UI with translucent cards and smooth gradients.
- **State Management**: Context API for global state (Theme, User Data).

### **Backend (Intelligence Core)**
- **Runtime**: Node.js / Express
- **AI Integration**: Google Generative AI SDK (Gemini 2.0/2.5/3.0)
- **Database (Optional)**: MongoDB (for persistent user profiles)
- **Security**: 
  - Environmental variable protection (`.env`)
  - Rate-limit handling with intelligent backoff strategies.

---

## 📋 Quick Start Guide

### **1. Prerequisites**
- Node.js (v16+)
- A Google Gemini API Key (Get one at [Google AI Studio](https://aistudio.google.com/))

### **2. Installation**

#### **Step A: Clone & Install**
```bash
git clone https://github.com/Start-Up-Pulse/AI-powered-resume-analyzer.git
cd AI-powered-resume-analyzer
npm install
```

#### **Step B: Configure Backend**
1. Navigate to the server folder:
   ```bash
   cd server
   npm install
   ```
2. Create a `.env` file in `server/`:
   ```env
   PORT=5000
   GEMINI_API_KEY=AIzaSyAasn5HUw23mUH9kUoK2zwCocV2VkNzbRk
   ```

### **3. Launch**

**Terminal 1 (Backend - The Brain)**
```bash
cd server
npm start
```
*You should see: `ResumeParser Service initialized. API Key Present: true`*

**Terminal 2 (Frontend - The Interface)**
```bash
# In the root folder
npm start
```
*The app will open at `http://localhost:3000`*

---

## 💡 Usage Tips

### **IMPORTANT: Switching Resumes**
⚠️ **Critical Step**: If you want to analyze a different resume (e.g., switching from a Developer CV to an HR CV), please **REFRESH THE PAGE** before uploading the new file. This ensures the dashboard clears all previous data and resets the AI analysis engine for a fresh start.

---

## 🔒 Safe Deployment Guide (Vercel + GitHub)

To keep your project secure and your API keys private on a public GitHub repo, follow these steps:

### **1. Secure Your Local Environment**
- I have updated the `.gitignore` to ensure `.env` files are **never** uploaded to GitHub.
- Your keys will stay local on your computer.

### **2. Deploying to Vercel**
1. **Push your code**: Upload your project to GitHub (it's safe, the keys won't go with it).
2. **Connect to Vercel**: Create a new project in Vercel and link it to your GitHub repo.
3. **Configure Environment Variables**:
   - In the Vercel Dashboard, go to **Settings > Environment Variables**.
   - Add your keys exactly as they appear in your `.env`:
     - `GEMINI_API_KEY`: `AIzaSy...`
     - `PORT`: `5000` (or your preferred server port)
4. **Build & Deploy**: Vercel will now use these secure "Cloud Variables" instead of reading from a file, keeping your account 100% safe.

---

## 🔍 Key Features in Detail

| Feature | Description | Tech Stack |
| :--- | :--- | :--- |
| **Role Precision** | Smart UI that auto-adjusts scores (High/Medium/Low) based on verbose AI analysis. | React Logic |
| **Parsing Engine** | Hybrid AI + Regex system to handle "messy" PDF layouts. | PDF.js + Custom Regex |
| **Theme System** | One-click toggle between "Professional Dark" and "Clean Light" modes. | CSS Variables |

---

## 🤝 Contributing
We welcome contributions! Please fork the repo and submit a PR for any features, bug fixes, or documentation improvements.

---

**Built with ❤️ by the Internee.pk Team**