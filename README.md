# 🚀 AI-Powered Resume Analyzer

A sophisticated, full-stack application that leverages **Google's Gemini 2.5 Flash** and **Gemini 3 Flash** models to deconstruct resumes, provide elite career coaching, and match candidates with job descriptions using semantic analysis.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-MERN-blue)
![AI Model](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)

---

## 📸 Project Screenshots
<img width="1919" height="922" alt="image" src="https://github.com/user-attachments/assets/bf36b70a-5717-4bd9-a515-b1d052e03b67" />

<img width="1919" height="930" alt="Screenshot 2026-02-05 004626" src="https://github.com/user-attachments/assets/ae263a13-0ff2-4243-86f0-87327ab7dee8" />
<img width="1919" height="931" alt="Screenshot 2026-02-05 004645" src="https://github.com/user-attachments/assets/202c4898-a899-4c2d-8c34-b61b02c5491a" />
<img width="1919" height="924" alt="Screenshot 2026-02-05 004737" src="https://github.com/user-attachments/assets/1070ecb1-abb2-422a-a6f6-36d52989e9cb" />
<img width="1919" height="936" alt="Screenshot 2026-02-05 004750" src="https://github.com/user-attachments/assets/2130433b-a63d-4082-8d23-c45efd62546b" />
<img width="1919" height="929" alt="Screenshot 2026-02-05 004806" src="https://github.com/user-attachments/assets/c6994f0f-913b-4006-a509-13a55b69286d" />
<img width="1919" height="929" alt="Screenshot 2026-02-05 004824" src="https://github.com/user-attachments/assets/130304f2-1a96-49bf-b555-49d7f1c7aee5" />
<img width="1919" height="903" alt="Screenshot 2026-02-05 004844" src="https://github.com/user-attachments/assets/25d7987b-6220-4593-a473-1f6e32f9f434" />
<img width="1919" height="903" alt="Screenshot 2026-02-05 004856" src="https://github.com/user-attachments/assets/fb7777b6-98bc-4f28-9846-7e3b6384e062" />
<img width="1919" height="914" alt="Screenshot 2026-02-05 005017" src="https://github.com/user-attachments/assets/0423291d-613d-46c3-8fa8-3f9fdecc6c72" />
<img width="1919" height="931" alt="Screenshot 2026-02-05 005203" src="https://github.com/user-attachments/assets/77815498-c785-4644-a02f-ede87f31da56" />
<img width="1919" height="926" alt="Screenshot 2026-02-05 005217" src="https://github.com/user-attachments/assets/96b48ed3-dcd9-45b1-9a01-873b74d8a6e6" />
<img width="1919" height="925" alt="Screenshot 2026-02-05 005228" src="https://github.com/user-attachments/assets/16aac428-dfe9-4926-b2db-9e5093022f32" />
<img width="1919" height="930" alt="Screenshot 2026-02-05 005240" src="https://github.com/user-attachments/assets/3d0f9644-7ced-4f77-986d-1380c81948d8" />
<img width="1919" height="933" alt="Screenshot 2026-02-05 005248" src="https://github.com/user-attachments/assets/d34dd9d2-a6a6-42d7-bde0-72b5ae88f290" />
<img width="1919" height="929" alt="Screenshot 2026-02-05 005319" src="https://github.com/user-attachments/assets/2ef632af-124e-4a5d-8922-ce0905731912" />
<img width="1919" height="933" alt="Screenshot 2026-02-05 005341" src="https://github.com/user-attachments/assets/45a31322-0624-4957-bef2-d503e9920f89" />
<img width="1303" height="863" alt="Screenshot 2026-02-05 005358" src="https://github.com/user-attachments/assets/ebb3fc68-f0ee-4e14-9258-28695e0a6032" />
<img width="1919" height="931" alt="Screenshot 2026-02-05 005411" src="https://github.com/user-attachments/assets/be8302ae-bdf6-4e68-aeb2-13830b15c846" />
<img width="1919" height="927" alt="Screenshot 2026-02-05 005539" src="https://github.com/user-attachments/assets/dc9d32be-dc45-47c0-9af5-699c583f26f0" />
<img width="1919" height="925" alt="Screenshot 2026-02-05 005554" src="https://github.com/user-attachments/assets/bccd468a-8257-4d8c-93ea-c396578f902f" />
<img width="1919" height="921" alt="Screenshot 2026-02-05 010239" src="https://github.com/user-attachments/assets/e874ee66-a2f6-41f8-8475-7b41257442aa" />
<img width="1919" height="925" alt="Screenshot 2026-02-05 010256" src="https://github.com/user-attachments/assets/212d86f0-3fd8-4465-92d1-b5efefdb5c7e" />
<img width="1919" height="924" alt="Screenshot 2026-02-05 010311" src="https://github.com/user-attachments/assets/ccbc1bb4-686a-4107-b1a7-15270e0da2e8" />
<img width="1919" height="931" alt="Screenshot 2026-02-05 010329" src="https://github.com/user-attachments/assets/1eef102f-fa3b-44f1-9596-948db2f325c7" />
<img width="1919" height="925" alt="Screenshot 2026-02-05 005554" src="https://github.com/user-attachments/assets/3048ba43-3841-4317-98cf-8f3b37dc63b0" />
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
