import React, { useState } from 'react';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const suggestions = [
    "How can I improve my summary?",
    "What technical skills are missing?",
    "Highlight my accomplishments better",
    "Tailor this for a Senior Dev role"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const currentOnSendMessage = onSendMessage; // Closure safety

  return (
    <div className="chat-input-wrapper">
      <div className="chat-suggestions">
        {suggestions.map((s, i) => (
          <button
            key={i}
            className="suggestion-chip"
            onClick={() => !isLoading && currentOnSendMessage(s)}
            disabled={isLoading}
          >
            {s}
          </button>
        ))}
      </div>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about improving your resume..."
            disabled={isLoading}
            rows="1"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;