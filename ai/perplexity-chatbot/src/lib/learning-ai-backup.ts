import { getDatabase } from './mongodb';
import { LearningPattern, LearningData, FeedbackData, AIPersonality, LearningMetrics } from './learning-types';

export class LearningAI {
  private static personality: AIPersonality = {
    name: 'AISync Learning Assistant',
    traits: ['curious', 'adaptive', 'helpful', 'analytical'],
    responseStyle: 'friendly',
    knowledgeAreas: ['general', 'technology', 'science', 'programming'],
    learningRate: 0.1
  };

  // Generate responses based on learned patterns
  static async generateResponse(question: string, context: string[] = []): Promise<string> {
    try {
      const db = await getDatabase();
      
      // Find similar patterns in the learning database
      const similarPatterns = await this.findSimilarPatterns(question);
      
      // If we have learned patterns, use them
      if (similarPatterns.length > 0) {
        const bestPattern = similarPatterns[0];
        
        // Update usage count and track this interaction
        await db.collection('learning_patterns').updateOne(
          { id: bestPattern.id },
          { 
            $inc: { usageCount: 1 },
            $set: { 
              updatedAt: new Date(),
              lastUsed: new Date()
            }
          }
        );

        // Record this interaction for learning
        await this.recordInteraction(question, bestPattern.answer, bestPattern.id);

        // Generate an evolved response based on learned pattern
        const response = await this.evolveResponse(bestPattern, question, context);
        
        console.log(`🧠 Learning AI: Found similar pattern (confidence: ${bestPattern.accuracy})`);
        console.log(`📝 Question: ${question}`);
        console.log(`💡 Based on learned pattern: ${bestPattern.question}`);
        
        return response;
      }

      // If no patterns found, create a new learning pattern and generate response
      const newResponse = this.generateLearningResponse(question, context);
      
      // Store this as a new learning pattern for future use
      await this.createNewPattern(question, newResponse, context);
      
      console.log(`🆕 Learning AI: Creating new pattern for question: ${question}`);
      
      return newResponse;
    } catch (error) {
      console.error('Learning AI error:', error);
      return this.getFallbackResponse(question);
    }
  }

  // Record interaction for learning purposes
  private static async recordInteraction(question: string, answer: string, patternId?: string): Promise<void> {
    try {
      const db = await getDatabase();
      
      const interaction = {
        question,
        answer,
        patternId: patternId || `new-${Date.now()}`,
        timestamp: new Date(),
        sessionId: `session-${Date.now()}`
      };
      
      await db.collection('ai_interactions').insertOne(interaction);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  // Create a new learning pattern from a question and response
  private static async createNewPattern(question: string, answer: string, context: string[]): Promise<void> {
    try {
      const db = await getDatabase();
      
      const pattern: LearningPattern = {
        id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer,
        context,
        accuracy: 0.5, // Start with neutral accuracy
        usageCount: 1,
        feedback: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: this.extractKeywords(question)
      };
      
      await db.collection('learning_patterns').insertOne(pattern);
      
      console.log(`📚 Created new learning pattern for: "${question.substring(0, 50)}..."`);
    } catch (error) {
      console.error('Error creating new pattern:', error);
    }
  }

  // Find similar patterns using text similarity
  private static async findSimilarPatterns(question: string): Promise<LearningPattern[]> {
    const db = await getDatabase();
    
    // Extract keywords from the question
    const keywords = this.extractKeywords(question);
    const questionLower = question.toLowerCase();
    
    // Search for patterns using multiple strategies
    const searchQueries = [
      // Exact phrase matching
      { question: { $regex: this.escapeRegex(questionLower), $options: 'i' } },
      // Keyword matching in tags
      { tags: { $in: keywords } },
      // Keyword matching in question text
      ...keywords.map(keyword => ({
        question: { $regex: this.escapeRegex(keyword), $options: 'i' }
      }))
    ];
    
    const patterns = await db.collection('learning_patterns')
      .find({
        $or: searchQueries
      })
      .sort({ 
        accuracy: -1,    // Prioritize more accurate patterns
        usageCount: -1,  // Then by usage frequency
        updatedAt: -1    // Then by recency
      })
      .limit(10)
      .toArray();

    // Calculate similarity scores and sort by relevance
    const patternsWithScores = patterns.map(p => {
      const pattern: LearningPattern = {
        id: p._id?.toString() || p.id,
        question: p.question,
        answer: p.answer,
        context: p.context || [],
        accuracy: p.accuracy || 0.5,
        usageCount: p.usageCount || 0,
        feedback: p.feedback || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        tags: p.tags || []
      };
      
      const similarity = this.calculateSimilarity(questionLower, pattern.question.toLowerCase());
      return { pattern, similarity };
    });

    // Sort by similarity score and return top matches
    return patternsWithScores
      .filter(p => p.similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(p => p.pattern);
  }

  // Calculate text similarity between two strings
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Escape special regex characters
  private static escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Evolve response based on learned patterns and context
  private static async evolveResponse(pattern: LearningPattern, question: string, context: string[]): Promise<string> {
    let response = pattern.answer;
    
    // Add context-aware improvements
    if (context.length > 0) {
      const contextInfo = context.slice(-2).join(' ');
      if (!response.includes(contextInfo.substring(0, 20))) {
        response += `\n\nConsidering the context of our conversation, ${contextInfo.substring(0, 100)}...`;
      }
    }

    // Add learning indicators
    response += `\n\n🎯 Confidence: ${Math.round(pattern.accuracy * 100)}% (based on ${pattern.usageCount} previous uses)`;
    
    return this.addPersonality(response);
  }

  // Generate a response when no patterns are found (learning mode)
  private static generateLearningResponse(question: string, context: string[]): string {
    const keywords = this.extractKeywords(question);
    
    let response = `🧠 I'm learning about "${keywords.join(', ')}" from your question. `;
    
    // Analyze question type and provide intelligent response
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('how') && (questionLower.includes('work') || questionLower.includes('function'))) {
      response += "This appears to be about how something works or functions. ";
      response += "Here's what I understand: Most systems or processes involve input, processing, and output stages. ";
      response += "The specific mechanism would depend on the exact context you're asking about. ";
    } else if (questionLower.includes('what') && questionLower.includes('is')) {
      response += "You're asking for a definition or explanation. ";
      response += "Based on the keywords in your question, this seems to be about a concept or entity. ";
      response += "Could you provide more specific details so I can give you a more accurate explanation? ";
    } else if (questionLower.includes('why')) {
      response += "You're looking for reasoning or causation. ";
      response += "Understanding 'why' something happens often involves looking at underlying principles, causes, or purposes. ";
      response += "The specific reasons would depend on the context of your question. ";
    } else if (questionLower.includes('when') || questionLower.includes('where')) {
      response += "You're asking about timing or location. ";
      response += "These types of questions usually require specific factual information. ";
      response += "Could you provide more context so I can give you a more precise answer? ";
    } else if (questionLower.includes('who')) {
      response += "You're asking about people or entities. ";
      response += "This type of question typically involves identifying specific individuals or organizations. ";
    } else if (questionLower.includes('how')) {
      response += "I understand you're looking for a process or method. ";
      response += "Let me think about the best approach to help you with this. ";
    } else {
      response += "I'm analyzing your question to provide the best possible answer. ";
    }
    
    response += "\n\n💡 This interaction is helping me learn! I'll remember this pattern and improve my responses to similar questions in the future. ";
    response += "Your feedback will help me become more accurate and helpful over time.";

    return response;
  }

  // Learn from interactions
  static async learnFromInteraction(question: string, response: string, context: string[], patternId?: string): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Store interaction for analysis
      await db.collection('ai_interactions').insertOne({
        question,
        response,
        context,
        patternId,
        timestamp: new Date(),
        sessionId: `session_${Date.now()}`
      });

      // Update knowledge graph
      await this.updateKnowledgeGraph(question, context);
      
    } catch (error) {
      console.error('Error learning from interaction:', error);
    }
  }

  // Process user feedback to improve responses
  static async processFeedback(feedback: FeedbackData): Promise<void>;
  static async processFeedback(question: string, type: 'positive' | 'negative' | 'neutral', responseId: string): Promise<void>;
  static async processFeedback(
    feedbackOrQuestion: FeedbackData | string, 
    type?: 'positive' | 'negative' | 'neutral', 
    responseId?: string
  ): Promise<void> {
    try {
      const db = await getDatabase();
      
      let feedback: FeedbackData;
      
      if (typeof feedbackOrQuestion === 'string') {
        // Called with individual parameters
        feedback = {
          responseId: responseId!,
          type: type!,
          question: feedbackOrQuestion,
          timestamp: new Date()
        };
      } else {
        // Called with feedback object
        feedback = feedbackOrQuestion;
      }
      
      // Store feedback
      await db.collection('ai_feedback').insertOne(feedback);

      // Find related learning patterns and update them based on feedback
      const keywords = this.extractKeywords(feedback.question || '');
      const relatedPatterns = await db.collection('learning_patterns')
        .find({
          $or: [
            { tags: { $in: keywords } },
            { question: { $regex: feedback.question || '', $options: 'i' } }
          ]
        })
        .toArray();

      // Update accuracy based on feedback type
      const accuracyDelta = this.calculateAccuracyDelta(feedback);
      
      for (const pattern of relatedPatterns) {
        const newAccuracy = Math.max(0, Math.min(1, (pattern.accuracy || 0.5) + accuracyDelta));
        
        await db.collection('learning_patterns').updateOne(
          { _id: pattern._id },
          { 
            $set: { 
              accuracy: newAccuracy,
              updatedAt: new Date()
            },
            $inc: { 
              feedback: feedback.type === 'positive' ? 1 : (feedback.type === 'negative' ? -1 : 0)
            }
          }
        );
      }

      // If positive feedback and no existing patterns, create a new one
      if (feedback.type === 'positive' && relatedPatterns.length === 0 && feedback.question) {
        const newPattern: LearningPattern = {
          id: `feedback-pattern-${Date.now()}`,
          question: feedback.question,
          answer: "This was positively rated by users.",
          context: [],
          accuracy: 0.7, // Start with good accuracy for positive feedback
          usageCount: 1,
          feedback: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: keywords
        };
        
        await db.collection('learning_patterns').insertOne(newPattern);
      }

      console.log(`📊 Processed ${feedback.type} feedback for: "${(feedback.question || '').substring(0, 50)}..."`);
      console.log(`🎯 Updated ${relatedPatterns.length} related patterns`);
      
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  }

  // Extract important keywords from text
  private static extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to 10 keywords
  }

  // Add personality to responses
  private static addPersonality(response: string): string {
    const personalityTouches = [
      "Hope this helps! 😊",
      "Let me know if you need clarification!",
      "I'm always learning and improving!",
      "Feel free to ask follow-up questions!"
    ];
    
    const randomTouch = personalityTouches[Math.floor(Math.random() * personalityTouches.length)];
    return `${response}\n\n${randomTouch}`;
  }

  // Calculate accuracy delta based on feedback
  private static calculateAccuracyDelta(feedback: FeedbackData): number {
    switch (feedback.type) {
      case 'positive': return 0.1;
      case 'negative': return -0.15;
      case 'neutral': return 0.02;
      default: return 0;
    }
  }

  // Get fallback response when errors occur
  private static getFallbackResponse(question: string): string {
    const keywords = this.extractKeywords(question);
    return `I'm having trouble processing your question about "${keywords.join(', ')}" right now. Could you try rephrasing it or asking something else? I'm continuously learning and improving my responses!`;
  }

  // Update knowledge graph (placeholder for future enhancement)
  private static async updateKnowledgeGraph(question: string, context: string[]): Promise<void> {
    // This would implement knowledge graph updates
    // For now, just log the learning activity
    console.log(`📊 Updating knowledge graph with question: ${question.substring(0, 50)}...`);
  }

  // Self-improvement method
  static async selfImprove(): Promise<void> {
    try {
      const db = await getDatabase();
      
      console.log('🔄 Starting Learning AI self-improvement...');
      
      // Find patterns that need improvement (low accuracy or high usage)
      const patternsToImprove = await db.collection('learning_patterns')
        .find({
          $or: [
            { accuracy: { $lt: 0.6 } },
            { usageCount: { $gt: 10, $lt: 50 } }
          ]
        })
        .limit(10)
        .toArray();

      for (const rawPattern of patternsToImprove) {
        const pattern: LearningPattern = {
          id: rawPattern._id?.toString() || rawPattern.id,
          question: rawPattern.question,
          answer: rawPattern.answer,
          context: rawPattern.context || [],
          accuracy: rawPattern.accuracy || 0.5,
          usageCount: rawPattern.usageCount || 0,
          feedback: rawPattern.feedback || 0,
          createdAt: rawPattern.createdAt,
          updatedAt: rawPattern.updatedAt,
          tags: rawPattern.tags || []
        };

        if (pattern.accuracy < 0.6) {
          await this.improvePattern(pattern);
        }
      }

      // Consolidate similar patterns
      await this.consolidateSimilarPatterns();
      
      console.log('🧠 Learning AI self-improvement completed');
    } catch (error) {
      console.error('Error in self-improvement:', error);
    }
  }

  // Improve individual patterns
  private static async improvePattern(pattern: LearningPattern): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Find successful patterns with similar keywords
      const similarSuccessfulPatternsRaw = await db.collection('learning_patterns')
        .find({
          tags: { $in: pattern.tags },
          accuracy: { $gt: 0.7 },
          id: { $ne: pattern.id }
        })
        .limit(3)
        .toArray();

      const similarSuccessfulPatterns: LearningPattern[] = similarSuccessfulPatternsRaw.map(p => ({
        id: p._id?.toString() || p.id,
        question: p.question,
        answer: p.answer,
        context: p.context || [],
        accuracy: p.accuracy || 0.5,
        usageCount: p.usageCount || 0,
        feedback: p.feedback || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        tags: p.tags || []
      }));

      if (similarSuccessfulPatterns.length > 0) {
        // Analyze what makes these patterns successful
        const successfulElements = this.analyzeSuccessfulElements(similarSuccessfulPatterns);
        
        // Update the pattern with improvements
        const improvedAnswer = this.incorporateSuccessfulElements(pattern.answer, successfulElements);
        
        await db.collection('learning_patterns').updateOne(
          { id: pattern.id },
          { 
            $set: { 
              answer: improvedAnswer,
              accuracy: Math.min(pattern.accuracy + 0.1, 1.0),
              updatedAt: new Date()
            }
          }
        );
      }
    } catch (error) {
      console.error('Error improving pattern:', error);
    }
  }

  // Consolidate similar patterns to avoid redundancy
  private static async consolidateSimilarPatterns(): Promise<void> {
    // Implementation for consolidating similar patterns
    // This would identify patterns with high similarity and merge them
    console.log('Consolidating similar patterns...');
  }

  // Analyze what makes patterns successful
  private static analyzeSuccessfulElements(patterns: LearningPattern[]): string[] {
    const elements: string[] = [];
    
    patterns.forEach(pattern => {
      // Extract common successful elements
      if (pattern.answer.includes('example')) elements.push('include_examples');
      if (pattern.answer.includes('step')) elements.push('step_by_step');
      if (pattern.answer.length > 100) elements.push('detailed_explanation');
    });

    return [...new Set(elements)];
  }

  // Incorporate successful elements into responses
  private static incorporateSuccessfulElements(answer: string, elements: string[]): string {
    let improved = answer;
    
    if (elements.includes('include_examples') && !improved.includes('example')) {
      improved += '\n\nFor example, this concept applies in various scenarios.';
    }
    
    if (elements.includes('step_by_step') && !improved.includes('step')) {
      improved += '\n\nHere\'s a step-by-step approach to better understand this.';
    }
    
    return improved;
  }

  // Initialize the Learning AI system
  static async initialize(): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Ensure indexes exist for better performance
      await db.collection('learning_patterns').createIndex({ tags: 1 });
      await db.collection('learning_patterns').createIndex({ accuracy: -1 });
      await db.collection('ai_interactions').createIndex({ sessionId: 1 });
      
      console.log('🧠 Learning AI initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Learning AI:', error);
    }
  }

  // Get learning metrics
  static async getMetrics(): Promise<LearningMetrics> {
    try {
      const db = await getDatabase();
      
      const totalPatterns = await db.collection('learning_patterns').countDocuments();
      const totalInteractions = await db.collection('ai_interactions').countDocuments();
      
      const patterns = await db.collection('learning_patterns').find({}).toArray();
      const averageAccuracy = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + (p.accuracy || 0.5), 0) / patterns.length
        : 0.5;
      
      const totalResponses = patterns.reduce((sum, p) => sum + (p.usageCount || 0), 0);
      const learningScore = Math.min(totalPatterns / 100, 1.0); // Learning score based on pattern count
      
      return {
        totalPatterns,
        totalInteractions,
        averageAccuracy,
        totalResponses,
        learningScore,
        improvementRate: 0.1,
        topicExpertise: {},
        userSatisfaction: averageAccuracy
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      return {
        totalPatterns: 0,
        totalInteractions: 0,
        averageAccuracy: 0.5,
        totalResponses: 0,
        learningScore: 0,
        improvementRate: 0,
        topicExpertise: {},
        userSatisfaction: 0.5
      };
    }
  }
}
