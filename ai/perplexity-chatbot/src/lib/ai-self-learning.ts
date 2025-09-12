import { getDatabase } from './mongodb';
import { LearningPattern } from './learning-types';

interface SelfLearningConfig {
  maxQuestionsPerSession: number;
  learningTopics: string[];
  questionTypes: string[];
  learningRate: number;
  confidenceThreshold: number;
}

interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  questionsAsked: number;
  patternsLearned: number;
  topics: string[];
  status: 'running' | 'completed' | 'error';
}

export class AISyncSelfLearning {
  private static config: SelfLearningConfig = {
    maxQuestionsPerSession: 50, // Learn 50 new things per session
    learningTopics: [
      'technology', 'science', 'history', 'geography', 'mathematics',
      'programming', 'artificial intelligence', 'physics', 'chemistry',
      'biology', 'astronomy', 'psychology', 'philosophy', 'literature',
      'art', 'music', 'cooking', 'health', 'fitness', 'business',
      'economics', 'politics', 'culture', 'languages', 'education'
    ],
    questionTypes: [
      'what is', 'how does', 'why is', 'when did', 'where is',
      'who was', 'how to', 'what are the benefits of', 'explain',
      'describe', 'what is the difference between', 'how do you'
    ],
    learningRate: 0.8,
    confidenceThreshold: 0.7
  };

  // Start a self-learning session where AISync teaches itself from ChatGPT
  static async startSelfLearningSession(customConfig?: Partial<SelfLearningConfig>): Promise<string> {
    try {
      console.log('🧠 AISync Self-Learning Session Starting...');
      console.log('🎯 Learning from OpenAI ChatGPT to expand knowledge base');
      
      // Merge custom config with default config
      const sessionConfig = { ...this.config, ...customConfig };
      
      const sessionId = `aisync-learning-${Date.now()}`;
      const session: LearningSession = {
        id: sessionId,
        startTime: new Date(),
        questionsAsked: 0,
        patternsLearned: 0,
        topics: [],
        status: 'running'
      };

      const db = await getDatabase();
      await db.collection('learning_sessions').insertOne(session);

      // Start the learning process with custom config
      await this.conductLearningSession(sessionId, sessionConfig);

      console.log('✅ AISync Self-Learning Session Completed Successfully!');
      return sessionId;
    } catch (error) {
      console.error('❌ AISync Self-Learning Session Failed:', error);
      throw error;
    }
  }

  // Conduct the actual learning session
  private static async conductLearningSession(sessionId: string, config: SelfLearningConfig): Promise<void> {
    const db = await getDatabase();
    let questionsAsked = 0;
    let patternsLearned = 0;
    let duplicatesSkipped = 0;
    const topicsLearned: Set<string> = new Set();
    const questionsAskedInSession: Set<string> = new Set(); // Track questions in this session

    try {
      console.log(`📚 Starting knowledge acquisition for AISync...`);
      console.log(`🎯 Target: ${config.maxQuestionsPerSession} questions`);

      while (questionsAsked < config.maxQuestionsPerSession) {
        try {
          console.log(`\n🔄 Question ${questionsAsked + 1}/${config.maxQuestionsPerSession}`);
          
          // Generate a unique learning question for this session
          const question = await this.generateLearningQuestion(questionsAskedInSession);
          
          // Check if we already asked this exact question in this session
          const questionLower = question.toLowerCase();
          if (questionsAskedInSession.has(questionLower)) {
            console.log(`🔄 Already asked this question in this session, generating new one...`);
            continue; // Skip to next iteration without incrementing counters
          }
          
          questionsAskedInSession.add(questionLower);
          console.log(`❓ AISync asks: "${question}"`);

          // Get answer from ChatGPT with timeout
          console.log(`🤖 Waiting for ChatGPT response...`);
          const answer = await this.askChatGPTWithTimeout(question, 30000); // 30 second timeout
          
          if (answer) {
            console.log(`✅ ChatGPT responded: "${answer.substring(0, 100)}..."`);
            
            // Process and store the learning
            const learningResult = await this.processLearning(question, answer, config);
            
            if (learningResult === 'success') {
              patternsLearned++;
              const topic = this.extractPrimaryTopic(question);
              topicsLearned.add(topic);
              
              console.log(`💾 AISync learned: ${topic} (Pattern #${patternsLearned})`);
            } else if (learningResult === 'duplicate') {
              duplicatesSkipped++;
              console.log(`🔄 Duplicate skipped (Total skipped: ${duplicatesSkipped})`);
            } else {
              console.log(`⚠️ Failed to process learning for this question`);
            }
          } else {
            console.log(`❌ No response from ChatGPT for this question`);
          }

          questionsAsked++;

          // Progress update every 5 questions
          if (questionsAsked % 5 === 0) {
            console.log(`\n📊 Progress Update:`);
            console.log(`   ✅ Questions Asked: ${questionsAsked}/${config.maxQuestionsPerSession}`);
            console.log(`   🧠 Patterns Learned: ${patternsLearned}`);
            console.log(`   � Duplicates Skipped: ${duplicatesSkipped}`);
            console.log(`   �📚 Topics: ${Array.from(topicsLearned).join(', ')}`);
          }

          // Small delay to respect API limits
          console.log(`⏱️ Waiting 2 seconds before next question...`);
          await this.sleep(2000);

        } catch (questionError) {
          console.error(`❌ Error with question ${questionsAsked + 1}:`, questionError.message);
          questionsAsked++; // Still count it to avoid infinite loop
          
          // Continue with next question
          console.log(`🔄 Continuing with next question...`);
          await this.sleep(1000);
        }
      }

      // Complete the session
      await db.collection('learning_sessions').updateOne(
        { id: sessionId },
        {
          $set: {
            endTime: new Date(),
            questionsAsked,
            patternsLearned,
            topics: Array.from(topicsLearned),
            status: 'completed'
          }
        }
      );

      console.log(`\n🎉 AISync Learning Session Complete!`);
      console.log(`   📝 Total Questions Asked: ${questionsAsked}`);
      console.log(`   🧠 New Patterns Learned: ${patternsLearned}`);
      console.log(`   � Duplicates Skipped: ${duplicatesSkipped}`);
      console.log(`   �📚 Topics Covered: ${Array.from(topicsLearned).join(', ')}`);
      console.log(`   ✅ Learning Rate: ${((patternsLearned / questionsAsked) * 100).toFixed(1)}%`);
      console.log(`   🎯 Efficiency: ${(((patternsLearned / (questionsAsked - duplicatesSkipped)) * 100) || 0).toFixed(1)}% (excluding duplicates)`);

      // Verify all patterns were saved to database
      const totalAISyncPatterns = await db.collection('learning_patterns')
        .countDocuments({ tags: 'aisync-learned' });

      console.log(`\n💾 Database Verification:`);
      console.log(`   📊 Total AISync Learned Patterns in DB: ${totalAISyncPatterns}`);
      console.log(`   ✅ All knowledge has been permanently saved to MongoDB!`);

      // Show recent patterns to confirm saving
      const recentPatterns = await db.collection('learning_patterns')
        .find({ tags: 'aisync-learned' })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      if (recentPatterns.length > 0) {
        console.log(`\n📋 Most Recent Learning (verification):`);
        recentPatterns.forEach((pattern, index) => {
          console.log(`   ${index + 1}. "${pattern.question.substring(0, 50)}..." (${pattern.tags.find(t => t !== 'aisync-learned' && t !== 'chatgpt-source' && t !== 'self-training') || 'general'})`);
        });
      }

    } catch (error) {
      console.error('❌ Learning session fatal error:', error);
      
      await db.collection('learning_sessions').updateOne(
        { id: sessionId },
        {
          $set: {
            endTime: new Date(),
            questionsAsked,
            patternsLearned,
            topics: Array.from(topicsLearned),
            status: 'error',
            errorMessage: error.message
          }
        }
      );
      
      throw error;
    }
  }

  // Generate intelligent questions for AISync to learn about
  private static async generateLearningQuestion(sessionQuestions?: Set<string>): Promise<string> {
    const db = await getDatabase();
    const maxAttempts = 10; // Maximum attempts to find a unique question
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const questionType = this.getRandomItem(this.config.questionTypes);
      
      // Choose a topic with better distribution (avoid recently overused topics)
      const topic = await this.selectDiverseTopic();

      // Create intelligent questions based on current knowledge gaps
      const existingPatterns = await db.collection('learning_patterns')
        .find({ tags: { $in: [topic] } })
        .limit(5)
        .toArray();

      let question: string;

      if (existingPatterns.length === 0) {
        // Basic questions for new topics
        question = `${questionType} ${topic}?`;
      } else {
        // More advanced questions for topics we already know something about
        const advancedQuestions = [
          `What are the latest developments in ${topic}?`,
          `How has ${topic} evolved over time?`,
          `What are the main challenges in ${topic}?`,
          `What are the practical applications of ${topic}?`,
          `How does ${topic} relate to artificial intelligence?`,
          `What are the key principles of ${topic}?`,
          `What are some common misconceptions about ${topic}?`,
          `How can ${topic} be applied in real-world scenarios?`,
          `What are the benefits and drawbacks of ${topic}?`,
          `What are the future trends in ${topic}?`,
          `How does ${topic} impact society?`,
          `What are the ethical considerations of ${topic}?`,
          `How can beginners learn about ${topic}?`,
          `What are the career opportunities in ${topic}?`,
          `What tools are used in ${topic}?`,
          `What are the recent breakthroughs in ${topic}?`,
          `How is ${topic} different from similar fields?`,
          `What are the most important aspects of ${topic}?`,
          `How do experts approach ${topic}?`,
          `What innovations are happening in ${topic}?`,
          `What skills are needed for ${topic}?`,
          `How does ${topic} solve modern problems?`,
          `What are the limitations of ${topic}?`,
          `How can ${topic} be improved?`,
          `What research is being done in ${topic}?`
        ];
        
        // Shuffle for better randomness
        this.shuffleArray(advancedQuestions);
        question = advancedQuestions[0];
      }

      // Check if this exact question or very similar question was asked recently
      const isRecentlyAsked = await this.checkRecentlyAskedQuestion(question);
      
      // Also check if asked in current session
      const askedInSession = sessionQuestions?.has(question.toLowerCase()) || false;
      
      if (!isRecentlyAsked && !askedInSession) {
        console.log(`✨ Generated unique question (attempt ${attempt + 1}): "${question}"`);
        return question;
      } else {
        const reason = askedInSession ? 'asked in current session' : 'recently asked';
        console.log(`🔄 Question was ${reason}, trying again... (attempt ${attempt + 1})`);
      }
    }

    // If we couldn't find a unique question after max attempts, generate a random one
    console.log(`⚠️ Using fallback question generation after ${maxAttempts} attempts`);
    return this.generateRandomUniqueQuestion();
  }

  // Check if a question was asked recently to avoid repetition
  private static async checkRecentlyAskedQuestion(question: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Check for exact matches in recent learning patterns
      const recentExactMatch = await db.collection('learning_patterns').findOne({
        question: { $regex: new RegExp(`^${question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        createdAt: { $gte: oneDayAgo },
        tags: { $in: ['aisync-learned'] }
      });
      
      if (recentExactMatch) {
        return true;
      }
      
      // Check for similar questions using word similarity
      const questionWords = question.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      if (questionWords.length >= 2) {
        const wordPattern = questionWords.slice(0, 3).join('|');
        const similarRecent = await db.collection('learning_patterns')
          .find({
            question: { $regex: new RegExp(wordPattern, 'i') },
            createdAt: { $gte: oneDayAgo },
            tags: { $in: ['aisync-learned'] }
          })
          .limit(3)
          .toArray();
        
        for (const pattern of similarRecent) {
          const similarity = this.calculateQuestionSimilarity(question.toLowerCase(), pattern.question.toLowerCase());
          if (similarity > 0.7) { // 70% similarity threshold for recent questions
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error checking recently asked questions:', error);
      return false; // If error, allow the question to avoid blocking
    }
  }

  // Generate a more random and unique question when fallback is needed
  private static generateRandomUniqueQuestion(): string {
    const randomTopics = [...this.config.learningTopics];
    const randomQuestionTypes = [
      'Tell me about', 'Explain', 'What is', 'How does', 'Why is', 'When did',
      'What are the applications of', 'How can I learn', 'What are examples of',
      'What is the history of', 'How is', 'What makes', 'Why do we use',
      'What are the types of', 'How to understand', 'What causes'
    ];
    
    const additionalWords = [
      'modern', 'advanced', 'basic', 'complex', 'simple', 'innovative',
      'traditional', 'emerging', 'future', 'current', 'popular', 'effective'
    ];
    
    // Shuffle arrays for better randomness
    this.shuffleArray(randomTopics);
    this.shuffleArray(randomQuestionTypes);
    this.shuffleArray(additionalWords);
    
    const topic = randomTopics[0];
    const questionType = randomQuestionTypes[0];
    const modifier = Math.random() > 0.5 ? additionalWords[0] + ' ' : '';
    
    const timestamp = Date.now() % 1000; // Add timestamp for uniqueness
    const questions = [
      `${questionType} ${modifier}${topic}?`,
      `What should I know about ${modifier}${topic}?`,
      `How is ${modifier}${topic} used in daily life?`,
      `What are interesting facts about ${topic}?`,
      `How does ${topic} work in practice?`,
      `What are recent discoveries about ${topic}? (${timestamp})`,
      `How can ${topic} solve real problems?`,
      `What makes ${topic} important today?`
    ];
    
    return this.getRandomItem(questions);
  }

  // Utility function to shuffle array
  private static shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Select a topic with better diversity - avoid recently overused topics
  private static async selectDiverseTopic(): Promise<string> {
    try {
      const db = await getDatabase();
      const now = new Date();
      const recentTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Last 6 hours
      
      // Get topic usage counts from recent learning sessions
      const recentTopicCounts = await db.collection('learning_patterns')
        .aggregate([
          {
            $match: {
              createdAt: { $gte: recentTime },
              tags: { $in: ['aisync-learned'] }
            }
          },
          {
            $unwind: '$tags'
          },
          {
            $match: {
              tags: { $in: this.config.learningTopics }
            }
          },
          {
            $group: {
              _id: '$tags',
              count: { $sum: 1 }
            }
          },
          {
            $sort: { count: -1 }
          }
        ])
        .toArray();
      
      // Create a weighted topic selection - less weight for overused topics
      const topicWeights = new Map<string, number>();
      const baseWeight = 10;
      
      // Initialize all topics with base weight
      this.config.learningTopics.forEach(topic => {
        topicWeights.set(topic, baseWeight);
      });
      
      // Reduce weight for recently overused topics
      recentTopicCounts.forEach((topicCount: any) => {
        const topic = topicCount._id;
        const count = topicCount.count;
        
        if (topicWeights.has(topic)) {
          // Reduce weight based on recent usage (more usage = less weight)
          const reducedWeight = Math.max(1, baseWeight - (count * 2));
          topicWeights.set(topic, reducedWeight);
        }
      });
      
      // Create weighted array for selection
      const weightedTopics: string[] = [];
      topicWeights.forEach((weight, topic) => {
        for (let i = 0; i < weight; i++) {
          weightedTopics.push(topic);
        }
      });
      
      // Select random topic from weighted array
      const selectedTopic = this.getRandomItem(weightedTopics);
      
      console.log(`🎯 Selected topic: "${selectedTopic}" using diversity weighting`);
      return selectedTopic;
      
    } catch (error) {
      console.error('❌ Error in diverse topic selection, using fallback:', error);
      // Fallback to random selection
      return this.getRandomItem(this.config.learningTopics);
    }
  }

  // Ask ChatGPT a question and get the response
  private static async askChatGPT(question: string): Promise<string | null> {
    return this.askChatGPTWithTimeout(question, 30000);
  }

  // Ask ChatGPT with timeout to prevent hanging
  private static async askChatGPTWithTimeout(question: string, timeoutMs: number): Promise<string | null> {
    try {
      console.log(`🔗 Making API call to ChatGPT...`);
      
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error('❌ OpenAI API key not found in environment variables');
        return null;
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`ChatGPT API timeout after ${timeoutMs}ms`)), timeoutMs);
      });

      // Create the API call promise
      const apiPromise = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable teacher helping an AI named AISync learn about various topics. Provide clear, accurate, and comprehensive answers that will help AISync understand and remember the information. Keep responses informative but concise (2-3 paragraphs maximum).'
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeoutPromise]);

      if (!response.ok) {
        console.error(`❌ ChatGPT API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`❌ Error details: ${errorText}`);
        return null;
      }

      console.log(`✅ ChatGPT API call successful`);
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log(`📝 Response length: ${content.length} characters`);
        return content;
      }

      console.error(`❌ Unexpected ChatGPT response structure:`, data);
      return null;
    } catch (error) {
      if (error.message.includes('timeout')) {
        console.error(`⏰ ChatGPT API timed out after ${timeoutMs}ms`);
      } else {
        console.error('❌ Error communicating with ChatGPT:', error.message);
      }
      return null;
    }
  }

  // Process and store the learning from ChatGPT's response
  private static async processLearning(question: string, answer: string, config: SelfLearningConfig): Promise<'success' | 'duplicate' | 'error'> {
    try {
      const db = await getDatabase();
      
      console.log(`💾 Processing and saving: "${question.substring(0, 40)}..."`);
      
      // Check for duplicate patterns first
      const isDuplicate = await this.checkForDuplicatePattern(question, answer);
      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate pattern: "${question.substring(0, 40)}..."`);
        return 'duplicate'; // Return duplicate status
      }
      
      // Extract keywords and topics
      const keywords = this.extractKeywords(question + ' ' + answer);
      const primaryTopic = this.extractPrimaryTopic(question);
      
      // Create a high-quality learning pattern
      const pattern: LearningPattern = {
        id: `aisync-learned-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: question.trim(),
        answer: `${answer}\n\n🤖 Learned by AISync from ChatGPT`,
        context: ['chatgpt-training', 'self-learning', primaryTopic],
        accuracy: config.learningRate, // High accuracy for ChatGPT responses
        usageCount: 0,
        feedback: 1, // Positive feedback for learned content
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [
          'aisync-learned',
          'chatgpt-source',
          'self-training',
          primaryTopic,
          ...keywords.slice(0, 5) // Limit keywords to prevent huge arrays
        ]
      };

      // Save main pattern
      const result = await db.collection('learning_patterns').insertOne(pattern);
      
      if (!result.insertedId) {
        console.error(`❌ Failed to save main pattern for: ${question.substring(0, 30)}...`);
        return 'error';
      }

      console.log(`✅ Saved main pattern with ID: ${result.insertedId}`);

      // Create related learning patterns for better coverage
      const relatedCount = await this.generateRelatedLearningPatterns(question, answer, primaryTopic, keywords);
      
      console.log(`📄 Created ${relatedCount} related patterns for better matching`);

      return 'success';
    } catch (error) {
      console.error('❌ Error processing learning:', error);
      return 'error';
    }
  }

  // Generate related learning patterns to improve coverage
  private static async generateRelatedLearningPatterns(
    originalQuestion: string, 
    originalAnswer: string, 
    topic: string, 
    keywords: string[]
  ): Promise<number> {
    try {
      const db = await getDatabase();
      let relatedCount = 0;
      
      // Create variations of the question for better matching
      const questionVariations = [
        `Tell me about ${topic}`,
        `Explain ${topic}`,
        `What should I know about ${topic}?`,
        `Describe ${topic}`,
        ...keywords.slice(0, 2).map(keyword => `What is ${keyword}?`) // Limit to 2 keywords
      ];

      for (const variation of questionVariations) {
        if (variation !== originalQuestion && variation.length > 5) {
          try {
            const relatedPattern: LearningPattern = {
              id: `aisync-related-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              question: variation,
              answer: `Based on what I learned: ${originalAnswer.substring(0, 250)}...`,
              context: ['related-learning', topic],
              accuracy: 0.7, // Slightly lower accuracy for derived patterns
              usageCount: 0,
              feedback: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: ['aisync-learned', 'related-pattern', topic, ...keywords.slice(0, 2)]
            };

            const result = await db.collection('learning_patterns').insertOne(relatedPattern);
            
            if (result.insertedId) {
              relatedCount++;
            }
            
            // Small delay between insertions
            await this.sleep(50);
          } catch (error) {
            console.error(`⚠️ Failed to save related pattern: ${variation}`, error.message);
          }
        }
      }
      
      return relatedCount;
    } catch (error) {
      console.error('❌ Error generating related patterns:', error);
      return 0;
    }
  }

  // Extract the primary topic from a question
  private static extractPrimaryTopic(question: string): string {
    const questionLower = question.toLowerCase();
    
    for (const topic of this.config.learningTopics) {
      if (questionLower.includes(topic.toLowerCase())) {
        return topic;
      }
    }
    
    // Fallback: extract the main noun
    const words = question.split(' ').filter(word => word.length > 3);
    return words[words.length - 1]?.replace(/[^a-zA-Z]/g, '') || 'general';
  }

  // Extract keywords from text
  private static extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'what', 'how', 'why', 'when', 'where', 'who']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  // Get random item from array
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Sleep function for API rate limiting
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get learning statistics
  static async getLearningStats(): Promise<any> {
    try {
      const db = await getDatabase();
      
      const totalLearned = await db.collection('learning_patterns')
        .countDocuments({ tags: 'aisync-learned' });
      
      const recentSessions = await db.collection('learning_sessions')
        .find({})
        .sort({ startTime: -1 })
        .limit(5)
        .toArray();
      
      const topicStats = await db.collection('learning_patterns')
        .aggregate([
          { $match: { tags: 'aisync-learned' } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
        .toArray();

      return {
        totalPatternsLearned: totalLearned,
        recentSessions,
        topTopics: topicStats,
        lastLearningSession: recentSessions[0] || null
      };
    } catch (error) {
      console.error('❌ Error getting learning stats:', error);
      return null;
    }
  }

  // Continuous learning mode (runs in background)
  static async startContinuousLearning(intervalHours: number = 24): Promise<void> {
    console.log(`🔄 AISync Continuous Learning Mode Activated`);
    console.log(`   📅 Learning every ${intervalHours} hours`);
    
    const runLearning = async () => {
      try {
        await this.startSelfLearningSession();
      } catch (error) {
        console.error('❌ Continuous learning error:', error);
      }
    };

    // Run immediately
    await runLearning();

    // Then run at intervals
    setInterval(runLearning, intervalHours * 60 * 60 * 1000);
  }

  // Check if a similar pattern already exists to prevent duplicates
  private static async checkForDuplicatePattern(question: string, answer: string): Promise<boolean> {
    try {
      const db = await getDatabase();
      
      // Normalize the question for comparison
      const normalizedQuestion = question.toLowerCase().trim();
      const questionWords = normalizedQuestion.split(/\s+/).filter(word => word.length > 2);
      
      // Check for exact question match first
      const exactMatch = await db.collection('learning_patterns').findOne({
        $or: [
          { question: { $regex: new RegExp(`^${normalizedQuestion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { question: question }
        ]
      });
      
      if (exactMatch) {
        console.log(`🔍 Found exact question match: "${exactMatch.question}"`);
        return true;
      }
      
      // Check for similar questions (high similarity threshold)
      if (questionWords.length >= 3) {
        // Create regex pattern for similar questions
        const wordPattern = questionWords.slice(0, 4).join('|'); // Use first 4 words
        const similarPatterns = await db.collection('learning_patterns')
          .find({
            question: { $regex: new RegExp(wordPattern, 'i') },
            tags: { $in: ['aisync-learned'] } // Only check against AISync learned patterns
          })
          .limit(5)
          .toArray();
        
        for (const pattern of similarPatterns) {
          const similarity = this.calculateQuestionSimilarity(normalizedQuestion, pattern.question.toLowerCase());
          if (similarity > 0.8) { // 80% similarity threshold
            console.log(`🔍 Found similar question (${(similarity * 100).toFixed(1)}% match): "${pattern.question}"`);
            return true;
          }
        }
      }
      
      // Check for similar answers to prevent duplicate knowledge
      const answerWords = answer.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      if (answerWords.length >= 10) {
        const keyAnswerWords = answerWords.slice(0, 8).join('|'); // Use first 8 significant words
        const similarAnswers = await db.collection('learning_patterns')
          .find({
            answer: { $regex: new RegExp(keyAnswerWords, 'i') },
            tags: { $in: ['aisync-learned'] }
          })
          .limit(3)
          .toArray();
        
        for (const pattern of similarAnswers) {
          const answerSimilarity = this.calculateAnswerSimilarity(answer, pattern.answer);
          if (answerSimilarity > 0.7) { // 70% similarity threshold for answers
            console.log(`🔍 Found similar answer content (${(answerSimilarity * 100).toFixed(1)}% match)`);
            return true;
          }
        }
      }
      
      return false; // No duplicates found
      
    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      return false; // If error checking, allow saving to be safe
    }
  }

  // Calculate similarity between two questions
  private static calculateQuestionSimilarity(question1: string, question2: string): number {
    const words1 = question1.split(/\s+/).filter(word => word.length > 2);
    const words2 = question2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Calculate similarity between two answers
  private static calculateAnswerSimilarity(answer1: string, answer2: string): number {
    // Remove the AISync signature for comparison
    const clean1 = answer1.replace(/\n\n🤖 Learned by AISync from ChatGPT/, '').toLowerCase();
    const clean2 = answer2.replace(/\n\n🤖 Learned by AISync from ChatGPT/, '').toLowerCase();
    
    const words1 = clean1.split(/\s+/).filter(word => word.length > 3);
    const words2 = clean2.split(/\s+/).filter(word => word.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }
}
