import React, { useState, useRef, useEffect } from 'react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { generateResumeAdvice } from '../../services/aiService';
import './ChatbotContainer.css';

const ChatbotContainer = ({ resumeData, analysisResults }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI resume assistant. I can help you improve your resume based on your experience and the analysis results. What would you like to work on?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Generate AI response based on resume data and user message
      const aiResponse = await generateAIResponse(userMessage, resumeData, analysisResults);

      const aiMsg = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMsg = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (userMessage, resumeData, analysisResults) => {
    try {
      // Try to use the backend AI service first
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/ai/advice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            resumeData,
            analysisResults
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.data;
        } else {
          console.warn('Backend AI service failed, falling back to direct API call:', response.statusText);
        }
      } catch (backendError) {
        console.warn('Backend AI service error, falling back to direct API call:', backendError);
      }
      
      // The generateResumeAdvice service now handles its own retries and basic 429 errors
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        return await generateResumeAdvice(userMessage, resumeData, analysisResults);
      } else {
        return simulateAIResponse(userMessage, resumeData, analysisResults);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      // Give the user a helpful hint about the 429 error if it still persists
      if (error.message?.includes('429')) {
        return "The AI service is currently very busy (Rate Limit). I've tried retrying, but I still can't connect. Please wait a minute and try again!";
      }
      return `I'm having a technical hiccup connecting to the wisdom cloud. ${error.message || 'Please try again in a moment.'}`;
    }
  };

  const simulateAIResponse = (userMessage, resumeData, analysisResults) => {
    // Simulated AI responses based on user input and resume data
    if (userMessage.toLowerCase().includes('skill') || userMessage.toLowerCase().includes('technical')) {
      return `Based on your resume, I see you have strong technical skills in ${resumeData?.extractedData?.skills?.technical?.slice(0, 3)?.join(', ') || 'various technologies'}. 
      To improve your skills section, consider adding specific metrics or certifications that demonstrate your expertise. 
      For example, if you mention AWS, consider adding your certification details.`;
    } else if (userMessage.toLowerCase().includes('experience') || userMessage.toLowerCase().includes('work')) {
      return `Looking at your experience section, I notice you have ${resumeData?.extractedData?.experience?.length || 0} positions listed. 
      To strengthen your experience descriptions, add more quantifiable achievements. Instead of "Managed projects", try "Managed 3 projects simultaneously, delivering them 10% under budget". 
      This makes your accomplishments more impactful.`;
    } else if (userMessage.toLowerCase().includes('summary') || userMessage.toLowerCase().includes('objective')) {
      return `Your summary should be tailored to the role you're applying for. 
      Based on your experience as a ${resumeData?.extractedData?.experience?.[0]?.position || 'professional'}, 
      consider highlighting your most impressive achievements and relevant skills in the first few sentences.`;
    } else if (userMessage.toLowerCase().includes('improv') || userMessage.toLowerCase().includes('better')) {
      const issues = analysisResults?.weaknesses?.slice(0, 2) || ['formatting', 'content'];
      return `Based on the analysis, I see opportunities to improve ${issues.join(' and ')}. 
      For example, ${analysisResults?.suggestions?.[0] || 'consider adding more specific metrics to your experience descriptions'}. 
      Would you like specific tips for any of these areas?`;
    } else {
      return `Thanks for your question about "${userMessage}". 
      I can help you with various aspects of your resume including skills, experience descriptions, summary, formatting, and more. 
      Based on your resume, you have experience in ${resumeData?.extractedData?.experience?.[0]?.position || 'various roles'}. 
      What specific area would you like to work on?`;
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>AI Resume Advisor</h3>
        <p>Get personalized resume improvement suggestions</p>
      </div>
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatbotContainer;