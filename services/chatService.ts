import { fetchJSON } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
}

export async function sendMessage(message: string): Promise<string> {
  try {
    const response = await fetchJSON<ChatResponse>('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
      }),
    });

    return response.reply;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}
