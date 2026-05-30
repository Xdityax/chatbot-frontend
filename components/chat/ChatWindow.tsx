'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';

export default function ChatWindow() {
  const [userInput, setUserInput] = useState('');
  const { messages, isLoading, error, sendMessage } = useChat();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    await sendMessage(userInput);
    setUserInput('');
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Start a conversation with the AI assistant</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-message chat-message-${msg.role}`}>
              <div className="message-sender">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="chat-message chat-message-assistant">
            <div className="message-sender">Assistant</div>
            <div className="message-content">Typing...</div>
          </div>
        )}
        {error && (
          <div className="chat-error">
            <p>Error: {error}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="chat-send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
