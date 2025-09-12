export interface LearningPattern {
  id: string;
  question: string;
  answer: string;
  context: string[];
  accuracy: number;
  usageCount: number;
  feedback: number; // -1 (bad), 0 (neutral), 1 (good)
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface LearningData {
  patterns: LearningPattern[];
  contextMemory: string[];
  userPreferences: Record<string, any>;
  knowledgeGraph: Record<string, string[]>;
}

export interface FeedbackData {
  responseId: string;
  rating?: number; // 1-5 stars
  type: 'positive' | 'negative' | 'neutral';
  helpful?: boolean;
  comment?: string;
  question?: string;
  timestamp: Date;
}

export interface AIPersonality {
  name: string;
  traits: string[];
  responseStyle: 'formal' | 'casual' | 'technical' | 'friendly';
  knowledgeAreas: string[];
  learningRate: number;
}

export interface LearningMetrics {
  totalPatterns: number;
  totalInteractions: number;
  totalResponses: number;
  learningScore: number;
  averageAccuracy: number;
  improvementRate: number;
  topicExpertise: Record<string, number>;
  userSatisfaction: number;
}
