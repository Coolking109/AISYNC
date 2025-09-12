import { getDatabase } from './mongodb';
import { CustomAIKnowledge, LearningData, AIResponse } from './types';

export class SelfDevelopingAI {
  private static knowledgeBase: Map<string, CustomAIKnowledge> = new Map();
  private static learningThreshold = 0.7; // Confidence threshold for learning
  private static maxKnowledgeItems = 10000; // Prevent unlimited growth

  // Initialize the AI by loading existing knowledge from database
  static async initialize() {
    try {
      const db = await getDatabase();
      const knowledge = await db.collection('ai_knowledge').find({}).toArray();
      
      knowledge.forEach((item: any) => {
        const knowledgeItem: CustomAIKnowledge = {
          id: item.id || item._id?.toString(),
          question: item.question,
          answer: item.answer,
          context: item.context,
          confidence: item.confidence,
          usage_count: item.usage_count,
          feedback_score: item.feedback_score,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          tags: item.tags || []
        };
        this.knowledgeBase.set(knowledgeItem.id, knowledgeItem);
      });

      console.log(`🧠 Self-Developing AI initialized with ${knowledge.length} knowledge items`);
    } catch (error) {
      console.error('Failed to initialize AI knowledge base:', error);
    }
  }

  // Generate response using learned knowledge and self-improvement
  static async generateResponse(question: string, context: string = ''): Promise<AIResponse> {
    try {
      // 1. Search existing knowledge base
      const existingKnowledge = this.searchKnowledge(question);
      
      if (existingKnowledge && existingKnowledge.confidence > this.learningThreshold) {
        // Use existing knowledge and increment usage
        await this.incrementUsage(existingKnowledge.id);
        
        return {
          content: existingKnowledge.answer + (context ? `\n\nContext: ${context}` : ''),
          model: 'custom-ai',
          provider: 'self-developing',
          timestamp: new Date(),
          confidence: existingKnowledge.confidence,
          sources: [`Knowledge Base (Used ${existingKnowledge.usage_count + 1} times)`]
        };
      }

      // 2. Generate new response using pattern matching and learning
      const generatedResponse = await this.generateNewResponse(question, context);
      
      // 3. Learn from this interaction
      await this.learnFromInteraction(question, generatedResponse.content, context);

      return generatedResponse;

    } catch (error) {
      console.error('Self-Developing AI error:', error);
      
      // Fallback response
      return {
        content: "I'm still learning! Could you help me understand this better? I'm a self-developing AI that improves with each conversation.",
        model: 'custom-ai',
        provider: 'self-developing',
        timestamp: new Date(),
        confidence: 0.3,
        sources: ['Learning Mode']
      };
    }
  }

  // Search knowledge base for similar questions
  private static searchKnowledge(question: string): CustomAIKnowledge | null {
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(word => word.length > 2);
    
    let bestMatch: CustomAIKnowledge | null = null;
    let bestScore = 0;

    for (const knowledge of this.knowledgeBase.values()) {
      const knowledgeWords = knowledge.question.toLowerCase().split(/\s+/);
      const matchingWords = questionWords.filter(word => 
        knowledgeWords.some(kw => kw.includes(word) || word.includes(kw))
      );
      
      const similarity = matchingWords.length / Math.max(questionWords.length, knowledgeWords.length);
      const adjustedScore = similarity * knowledge.confidence * (1 + knowledge.usage_count * 0.1);
      
      if (adjustedScore > bestScore && adjustedScore > 0.4) {
        bestScore = adjustedScore;
        bestMatch = knowledge;
      }
    }

    return bestMatch;
  }

  // Generate new response using learned patterns
  private static async generateNewResponse(question: string, context: string): Promise<AIResponse> {
    // Analyze question patterns
    const questionType = this.analyzeQuestionType(question);
    const topics = this.extractTopics(question);
    
    // Find related knowledge
    const relatedKnowledge = this.findRelatedKnowledge(topics);
    
    // Generate response based on patterns and existing knowledge
    let response = this.constructResponse(question, questionType, relatedKnowledge, context);
    
    // Apply self-improvement based on past successful responses
    response = this.applyLearningsToResponse(response, topics);

    const confidence = this.calculateConfidence(question, relatedKnowledge);

    return {
      content: response,
      model: 'custom-ai',
      provider: 'self-developing',
      timestamp: new Date(),
      confidence,
      sources: relatedKnowledge.length > 0 ? 
        [`Generated from ${relatedKnowledge.length} related knowledge items`] : 
        ['Pattern-based generation']
    };
  }

  // Analyze what type of question is being asked
  private static analyzeQuestionType(question: string): string {
    const q = question.toLowerCase();
    
    if (q.startsWith('what') || q.includes('what is') || q.includes('what are')) return 'definition';
    if (q.startsWith('how') || q.includes('how to') || q.includes('how do')) return 'instruction';
    if (q.startsWith('why') || q.includes('why is') || q.includes('why do')) return 'explanation';
    if (q.startsWith('when') || q.includes('when is') || q.includes('when do')) return 'timing';
    if (q.startsWith('where') || q.includes('where is') || q.includes('where can')) return 'location';
    if (q.startsWith('who') || q.includes('who is') || q.includes('who are')) return 'person';
    if (q.includes('?')) return 'question';
    
    return 'statement';
  }

  // Extract key topics from the question
  private static extractTopics(question: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'why', 'when', 'where', 'who'];
    
    return question.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10); // Limit to prevent over-extraction
  }

  // Find knowledge related to extracted topics
  private static findRelatedKnowledge(topics: string[]): CustomAIKnowledge[] {
    const related: CustomAIKnowledge[] = [];
    
    for (const knowledge of this.knowledgeBase.values()) {
      const knowledgeText = (knowledge.question + ' ' + knowledge.answer + ' ' + knowledge.tags.join(' ')).toLowerCase();
      const relevance = topics.filter(topic => knowledgeText.includes(topic)).length;
      
      if (relevance > 0) {
        related.push(knowledge);
      }
    }
    
    return related.sort((a, b) => (b.confidence * b.usage_count) - (a.confidence * a.usage_count)).slice(0, 5);
  }

  // Construct response based on analysis
  private static constructResponse(question: string, type: string, relatedKnowledge: CustomAIKnowledge[], context: string): string {
    let response = '';

    switch (type) {
      case 'definition':
        response = this.constructDefinitionResponse(question, relatedKnowledge);
        break;
      case 'instruction':
        response = this.constructInstructionResponse(question, relatedKnowledge);
        break;
      case 'explanation':
        response = this.constructExplanationResponse(question, relatedKnowledge);
        break;
      default:
        response = this.constructGeneralResponse(question, relatedKnowledge);
    }

    // Add context if available
    if (context) {
      response += `\n\nBased on our conversation context, I can also add: ${this.contextualizeResponse(response, context)}`;
    }

    // Add learning note
    response += '\n\n*Note: I\'m continuously learning and improving my responses based on our conversations.*';

    return response;
  }

  private static constructDefinitionResponse(question: string, related: CustomAIKnowledge[]): string {
    if (related.length > 0) {
      const bestMatch = related[0];
      return `Based on my knowledge: ${bestMatch.answer}\n\nI've found this information helpful in ${bestMatch.usage_count} previous conversations.`;
    }
    
    return `I'm still learning about this topic. Could you provide more details so I can better understand and help you in the future?`;
  }

  private static constructInstructionResponse(question: string, related: CustomAIKnowledge[]): string {
    if (related.length > 0) {
      const steps = related.map((k, i) => `${i + 1}. ${k.answer}`).join('\n');
      return `Here's what I've learned from previous conversations:\n\n${steps}`;
    }
    
    return `I'm learning how to help with this type of instruction. Could you share your approach so I can learn and assist others with similar questions?`;
  }

  private static constructExplanationResponse(question: string, related: CustomAIKnowledge[]): string {
    if (related.length > 0) {
      const explanations = related.map(k => k.answer).join('\n\nAdditionally, ');
      return `Based on my accumulated knowledge: ${explanations}`;
    }
    
    return `This is an interesting question I'm still exploring. I'd love to learn more about your perspective on this topic.`;
  }

  private static constructGeneralResponse(question: string, related: CustomAIKnowledge[]): string {
    if (related.length > 0) {
      const insights = related.slice(0, 3).map(k => k.answer).join(' ');
      return `From my learning experiences: ${insights}`;
    }
    
    return `I'm developing my understanding of this topic. Your question helps me learn - could you share more insights?`;
  }

  // Apply previous learnings to improve the response
  private static applyLearningsToResponse(response: string, topics: string[]): string {
    // Find high-performing responses for similar topics
    const successfulResponses = Array.from(this.knowledgeBase.values())
      .filter(k => k.feedback_score > 0.7 && topics.some(topic => k.tags.includes(topic)))
      .sort((a, b) => b.feedback_score - a.feedback_score)
      .slice(0, 2);

    if (successfulResponses.length > 0) {
      const learningInsights = successfulResponses.map(r => r.answer).join(' ');
      return `${response}\n\nFrom successful past interactions, I can add: ${learningInsights}`;
    }

    return response;
  }

  private static contextualizeResponse(response: string, context: string): string {
    // Simple contextualization - in a real implementation, this would be more sophisticated
    return `Given our current discussion about ${context.slice(0, 100)}..., this information might be particularly relevant.`;
  }

  // Calculate confidence based on knowledge base matches
  private static calculateConfidence(question: string, relatedKnowledge: CustomAIKnowledge[]): number {
    if (relatedKnowledge.length === 0) return 0.3;
    
    const avgConfidence = relatedKnowledge.reduce((sum, k) => sum + k.confidence, 0) / relatedKnowledge.length;
    const usageBonus = Math.min(relatedKnowledge.reduce((sum, k) => sum + k.usage_count, 0) * 0.05, 0.3);
    
    return Math.min(avgConfidence + usageBonus, 1.0);
  }

  // Learn from successful interactions
  static async learnFromInteraction(question: string, response: string, context: string, sessionId: string = '') {
    try {
      const db = await getDatabase();
      
      // Store learning data
      const learningData: LearningData = {
        user_question: question,
        ai_response: response,
        context,
        timestamp: new Date(),
        session_id: sessionId
      };
      
      await db.collection('learning_data').insertOne(learningData);

      // Create or update knowledge
      const topics = this.extractTopics(question);
      const knowledgeId = this.generateKnowledgeId(question);
      
      const knowledge: CustomAIKnowledge = {
        id: knowledgeId,
        question,
        answer: response,
        context,
        confidence: 0.5, // Initial confidence
        usage_count: 1,
        feedback_score: 0.5, // Neutral initial score
        created_at: new Date(),
        updated_at: new Date(),
        tags: topics
      };

      // Check if we already have similar knowledge
      const existing = this.knowledgeBase.get(knowledgeId);
      if (existing) {
        // Update existing knowledge
        existing.usage_count++;
        existing.updated_at = new Date();
        existing.answer = this.mergeResponses(existing.answer, response);
        
        await db.collection('ai_knowledge').updateOne(
          { id: knowledgeId },
          { $set: existing }
        );
      } else {
        // Add new knowledge
        this.knowledgeBase.set(knowledgeId, knowledge);
        await db.collection('ai_knowledge').insertOne(knowledge);
        
        // Maintain knowledge base size
        await this.maintainKnowledgeSize();
      }

    } catch (error) {
      console.error('Failed to learn from interaction:', error);
    }
  }

  // Update knowledge based on user feedback
  static async updateFromFeedback(questionId: string, feedback: 'positive' | 'negative' | 'neutral') {
    try {
      const knowledge = this.knowledgeBase.get(questionId);
      if (!knowledge) return;

      // Adjust confidence and feedback score
      switch (feedback) {
        case 'positive':
          knowledge.confidence = Math.min(knowledge.confidence + 0.1, 1.0);
          knowledge.feedback_score = Math.min(knowledge.feedback_score + 0.2, 1.0);
          break;
        case 'negative':
          knowledge.confidence = Math.max(knowledge.confidence - 0.2, 0.1);
          knowledge.feedback_score = Math.max(knowledge.feedback_score - 0.3, 0.0);
          break;
        case 'neutral':
          // Small positive adjustment for engagement
          knowledge.confidence = Math.min(knowledge.confidence + 0.05, 1.0);
          break;
      }

      knowledge.updated_at = new Date();

      // Update in database
      const db = await getDatabase();
      await db.collection('ai_knowledge').updateOne(
        { id: questionId },
        { $set: knowledge }
      );

      console.log(`📚 AI learned from ${feedback} feedback for: ${knowledge.question.slice(0, 50)}...`);

    } catch (error) {
      console.error('Failed to update from feedback:', error);
    }
  }

  // Generate unique ID for knowledge items
  private static generateKnowledgeId(question: string): string {
    const hash = question.toLowerCase().replace(/[^\w]/g, '').slice(0, 20);
    return `knowledge_${hash}_${Date.now()}`;
  }

  // Merge similar responses to create better answers
  private static mergeResponses(existing: string, newResponse: string): string {
    // Simple merge - in production, this would use more sophisticated NLP
    if (existing.length > newResponse.length) {
      return `${existing}\n\nAdditional insight: ${newResponse}`;
    } else {
      return `${newResponse}\n\nPrevious perspective: ${existing}`;
    }
  }

  // Maintain knowledge base size to prevent unlimited growth
  private static async maintainKnowledgeSize() {
    if (this.knowledgeBase.size > this.maxKnowledgeItems) {
      // Remove lowest performing knowledge items
      const sorted = Array.from(this.knowledgeBase.values())
        .sort((a, b) => (a.confidence * a.usage_count * a.feedback_score) - (b.confidence * b.usage_count * b.feedback_score));
      
      const toRemove = sorted.slice(0, Math.floor(this.maxKnowledgeItems * 0.1)); // Remove bottom 10%
      
      try {
        const db = await getDatabase();
        for (const item of toRemove) {
          this.knowledgeBase.delete(item.id);
          await db.collection('ai_knowledge').deleteOne({ id: item.id });
        }
        
        console.log(`🧹 Cleaned up ${toRemove.length} low-performing knowledge items`);
      } catch (error) {
        console.error('Failed to maintain knowledge size:', error);
      }
    }
  }

  // Increment usage count for existing knowledge
  private static async incrementUsage(knowledgeId: string) {
    const knowledge = this.knowledgeBase.get(knowledgeId);
    if (knowledge) {
      knowledge.usage_count++;
      knowledge.updated_at = new Date();
      
      try {
        const db = await getDatabase();
        await db.collection('ai_knowledge').updateOne(
          { id: knowledgeId },
          { $inc: { usage_count: 1 }, $set: { updated_at: new Date() } }
        );
      } catch (error) {
        console.error('Failed to increment usage:', error);
      }
    }
  }

  // Get AI statistics for monitoring
  static getStats() {
    const knowledge = Array.from(this.knowledgeBase.values());
    return {
      totalKnowledge: knowledge.length,
      averageConfidence: knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length || 0,
      totalUsage: knowledge.reduce((sum, k) => sum + k.usage_count, 0),
      averageFeedback: knowledge.reduce((sum, k) => sum + k.feedback_score, 0) / knowledge.length || 0,
      topPerforming: knowledge
        .sort((a, b) => (b.confidence * b.usage_count * b.feedback_score) - (a.confidence * a.usage_count * a.feedback_score))
        .slice(0, 5)
        .map(k => ({ question: k.question.slice(0, 50) + '...', confidence: k.confidence, usage: k.usage_count }))
    };
  }
}
