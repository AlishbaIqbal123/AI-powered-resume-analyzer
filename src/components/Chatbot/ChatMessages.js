import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChatMessages.css';

const ChatMessages = ({ messages, isLoading }) => {
  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`message ${message.sender}-message`}
        >
          <div className="message-content">
            <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>
          <div className="message-timestamp">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="message ai-message">
          <div className="message-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;