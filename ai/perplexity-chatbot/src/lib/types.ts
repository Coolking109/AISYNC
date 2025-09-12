export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  sources?: string[];
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  base64?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'google' | 'anthropic' | 'cohere' | 'mistral' | 'custom-ai';
  description: string;
  maxTokens: number;
  supportsStreaming: boolean;
}

export interface CustomAIKnowledge {
  id: string;
  question: string;
  answer: string;
  context: string;
  confidence: number;
  usage_count: number;
  feedback_score: number;
  created_at: Date;
  updated_at: Date;
  tags: string[];
}

export interface LearningData {
  user_question: string;
  ai_response: string;
  user_feedback?: 'positive' | 'negative' | 'neutral';
  context: string;
  timestamp: Date;
  session_id: string;
}

export interface AIResponse {
  content: string;
  model: string;
  provider: string;
  timestamp: Date;
  tokensUsed?: number;
  sources?: string[];
  confidence?: number;
  score?: number; // Added for enhanced response scoring
}

export interface MultiModelResponse {
  responses: AIResponse[];
  aggregatedResponse: string;
  consensus: number;
  sources: string[];
}
