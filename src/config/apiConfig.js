// API Configuration for OpenAI
export const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const MODEL_NAME = 'gpt-3.5-turbo'; // Or 'gpt-4' if available