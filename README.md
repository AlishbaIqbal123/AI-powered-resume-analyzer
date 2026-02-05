# 🚀 AI-Powered Resume Analyzer

A sophisticated, full-stack application that leverages **Google's Gemini 2.5 Flash** and **Gemini 3 Flash** models to deconstruct resumes, provide elite career coaching, and match candidates with job descriptions using semantic analysis.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)
![AI Model](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)

---

## 📸 Project Screenshots

*(Add your screenshots here)*

### **1. The Dashboard (Command Center)**
![Dashboard View](ADD_IMAGE_LINK_HERE)

### **2. Neural Parsing Engine**
![Parsing Analysis](ADD_IMAGE_LINK_HERE)

### **3. AI Career Coach**
![Chatbot Interface](ADD_IMAGE_LINK_HERE)

---

## ✨ Key Features

### **1. Professional DNA Extraction**
- **Neural Parsing**: Unlike standard regex parsers, this uses a refined "Dual-Engine" approach (Gemini AI + Fallback Heuristics) to extract messy, complex PDF data with 95% accuracy.
- **Smart Categorization**: Automatically detects "Technical Arsenal," "Professional Experience," and "Academic Background" even if formatting is inconsistent.

### **2. AI Career Coach (Chatbot)**
- **Context-Aware**: The chatbot knows *your* resume. You can ask "What skills am I missing for a Senior Dev role?" and it answers based on your specific uploaded profile.
- **Model Fallback System**: Automatically switches between Gemini 2.5 Flash, Gemini 3 Flash, and Gemini 1.5 Pro to ensure uptime even during high traffic.

### **3. Semantic Job Matching**
- **Gap Analysis**: Paste a Job Description to see a "Compatibility Score."
- **Keyword Strategy**: Identifies "Missing Keywords" that are critical for passing ATS (Applicant Tracking Systems).

---

## 🛠️ Tech Stack

### **Frontend (The Interface)**
- **Framework**: React.js (Create React App)
- **Styling**: Modern CSS3 with Glassmorphism UI
- **Deployment**: Vercel (Static Hosting)

### **Backend (The Brain)**
- **Runtime**: Node.js & Express
- **Architecture**: Serverless Functions (Vercel Optimized)
- **Database**: MongoDB (Optional - Runs in stateless mode if disconnected)
- **AI Integration**: Google Generative AI SDK (Gemini Models)
- **Storage**: Memory Storage (RAM-based processing for speed and security)

---

## 🚀 Setup & Installation

Follow these steps to run the project locally.

### **1. Clone the Repository**
```bash
git clone https://github.com/AlishbaIqbal123/AI-powered-resume-analyzer.git
cd AI-powered-resume-analyzer
```

### **2. Setup Backend**
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
PORT=5000
GEMINI_API_KEY=your_new_api_key_here
```
Run the server:
```bash
npm start
```

### **3. Setup Frontend**
Open a new terminal in the root folder:
```bash
npm install
```
Create a `.env` file in the root folder:
```env
REACT_APP_API_URL=http://localhost:5000/api
```
Run the frontend:
```bash
npm start
```

---

## ☁️ Deployment Guide (Vercel)

This project is optimized for **Vercel** deployment.

### **Backend Deployment**
1. Push `server` folder code to GitHub.
2. Import project -> Select `server` as Root Directory.
3. Add Environment Variables:
   - `GEMINI_API_KEY`: (Your Google AI Key)
   - `PORT`: `5000`

### **Frontend Deployment**
1. Push root folder code to GitHub.
2. Import project -> Select Root Directory.
3. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://your-backend-url.vercel.app/api` (Must end with `/api`)

---

## 📄 License
This project is open-source and available under the MIT License.