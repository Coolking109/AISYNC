import { getDatabase } from './mongodb';
import { LearningPattern, LearningData, FeedbackData, AIPersonality, LearningMetrics } from './learning-types';
import { AISyncSelfLearning } from './ai-self-learning';

// Web search function using a backend API approach
async function searchWeb(query: string): Promise<string[]> {
  try {
    // Check if we're running on the server side
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // Server-side: call the search functions directly instead of making HTTP requests
      console.log('🔍 Server-side web search for:', query);
      return await serverSideSearch(query);
    } else {
      // Client-side: make HTTP request to API
      console.log('🔍 Client-side web search for:', query);
      const response = await fetch('/api/web-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error('Search API failed');
      }
      
      const data = await response.json();
      return data.results || [];
    }
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

// Server-side search function
async function serverSideSearch(query: string): Promise<string[]> {
  try {
    console.log(`📚 Server-side search for: "${query}"`);
    
    // Try Wikipedia search first
    const searchResults = await searchWikipediaServerSide(query);
    
    if (searchResults.length > 0) {
      return searchResults;
    }
    
    // If no Wikipedia results, provide a general response
    return await provideServerSideGeneralResponse(query);
  } catch (error) {
    console.error('Server-side search error:', error);
    return [];
  }
}

// Server-side Wikipedia search
async function searchWikipediaServerSide(query: string): Promise<string[]> {
  try {
    // Extract search terms
    const searchTerms = extractSearchTermsServerSide(query);
    
    for (const term of searchTerms) {
      try {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.extract) {
            console.log(`✅ Wikipedia found information for: "${term}"`);
            return [data.extract];
          }
        }
      } catch (err) {
        console.log(`❌ Wikipedia search failed for term: "${term}"`);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Wikipedia server-side search error:', error);
    return [];
  }
}

// Extract search terms on server side
function extractSearchTermsServerSide(query: string): string[] {
  const terms: string[] = [];
  const queryLower = query.toLowerCase();
  
  // Clean up the query for better search
  const cleanQuery = queryLower
    .replace(/\b(what|whats|what's|how|why|when|where|who|is|are|a|an|the)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  
  if (cleanQuery.length > 2) {
    terms.push(cleanQuery);
  }
  
  // Also try the original query
  terms.push(query);
  
  // Extract individual significant words
  const words = query.split(/\s+/).filter(word => 
    word.length > 3 && 
    !['what', 'whats', "what's", 'how', 'why', 'when', 'where', 'who', 'is', 'are', 'the', 'and', 'or', 'made', 'of'].includes(word.toLowerCase())
  );
  
  terms.push(...words);
  
  return [...new Set(terms)];
}

// Server-side general response
async function provideServerSideGeneralResponse(query: string): Promise<string[]> {
  const queryLower = query.toLowerCase();
  const keywords = query.split(' ').filter(word => word.length > 3);
  
  if (queryLower.includes('made of') || queryLower.includes('materials')) {
    return [
      "Materials and construction can vary greatly depending on the specific item you're asking about. Common building materials include wood, steel, concrete, brick, glass, and various composites. Could you be more specific about what you'd like to know about?"
    ];
  }
  
  if (queryLower.includes('house') && (queryLower.includes('made') || queryLower.includes('materials'))) {
    return [
      "Houses are typically made from a variety of materials including: foundation materials like concrete or stone, framing materials like wood or steel, exterior materials like brick, vinyl siding, or stucco, roofing materials like asphalt shingles or metal, and interior materials like drywall, flooring, and insulation. The specific materials vary by region, climate, budget, and architectural style."
    ];
  }
  
  return [
    `I searched for information about "${keywords.slice(0, 3).join(', ')}" but couldn't find specific details in my current sources. Could you provide more context or try rephrasing your question? I'm always learning and expanding my knowledge base.`
  ];
}

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
      
      console.log(`🎯 Learning AI received question: "${question}"`);
      console.log(`🔍 Question analysis - Length: ${question.length}, Type: ${typeof question}`);
      
      // Check if user is teaching the AI something new
      const teachingResponse = await this.handleTeachingInput(question);
      if (teachingResponse) {
        console.log(`📚 Detected teaching input, responding with learned information`);
        return teachingResponse;
      }
      
      // Check for specific personal questions (name, identity, etc.)
      const personalResponse = await this.handlePersonalQuestions(question);
      if (personalResponse) {
        console.log(`👤 Detected personal question, responding with stored facts`);
        return personalResponse;
      }
      
      // Check for math questions and solve them
      const mathResponse = await this.handleMathQuestions(question);
      if (mathResponse) {
        console.log(`🔢 Detected math question, providing calculation result`);
        return mathResponse;
      }
      
      // Special case: Block grammar patterns for manufacturing questions with "they"
      if (this.isManufacturingQuestion(question)) {
        console.log(`🏭 Detected manufacturing question - will prioritize web search over grammar patterns`);
        // Skip pattern matching entirely for manufacturing questions and go straight to web search
        const manufacturingResponse = await this.generateLearningResponse(question, context);
        console.log(`🆕 Learning AI: Generated manufacturing-focused response`);
        return manufacturingResponse;
      }
      
      // Find similar patterns in the learning database
      const similarPatterns = await this.findSimilarPatterns(question);
      console.log(`🔍 Found ${similarPatterns.length} similar patterns in memory`);
      
      // DEBUG: Log all found patterns for troubleshooting
      if (similarPatterns.length > 0) {
        console.log(`📋 All found patterns:`);
        similarPatterns.forEach((pattern, index) => {
          console.log(`   ${index + 1}. "${pattern.question.substring(0, 60)}..." (accuracy: ${(pattern.accuracy * 100).toFixed(1)}%)`);
        });
      }
      
      // Only use existing pattern if it's VERY similar (>60%) AND has high accuracy (>70%) AND contextually relevant
      if (similarPatterns.length > 0) {
        const bestPattern = similarPatterns[0];
        const similarity = this.calculateSimilarity(question.toLowerCase(), bestPattern.question.toLowerCase());
        const contextualRelevance = this.calculateContextualRelevance(question, bestPattern);
        
        console.log(`🎯 Best pattern similarity: ${(similarity * 100).toFixed(1)}% (accuracy: ${(bestPattern.accuracy * 100).toFixed(1)}%, context: ${(contextualRelevance * 100).toFixed(1)}%)`);
        
        // Only use existing pattern if it's VERY similar AND accurate AND contextually relevant
        // Make contextual relevance much stricter for better accuracy
        if (similarity > 0.7 && bestPattern.accuracy > 0.8 && contextualRelevance > 0.7) {
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
          
          console.log(`🧠 Learning AI: Using high-confidence pattern (similarity: ${(similarity * 100).toFixed(1)}%, accuracy: ${(bestPattern.accuracy * 100).toFixed(1)}%, context: ${(contextualRelevance * 100).toFixed(1)}%)`);
          
          return response;
        } else {
          console.log(`⚠️ Found patterns but similarity (${(similarity * 100).toFixed(1)}%), accuracy (${(bestPattern.accuracy * 100).toFixed(1)}%), or contextual relevance (${(contextualRelevance * 100).toFixed(1)}%) too low - triggering web search instead`);
        }
      }

      console.log(`🆕 No high-confidence patterns found, performing web search for: "${question}"`);
      
      // If no high-confidence patterns found, always do web search for new learning
      const newResponse = await this.generateLearningResponse(question, context);
      
      console.log(`🆕 Learning AI: Generated new learning response with web search`);
      
      return newResponse;
    } catch (error) {
      console.error('Learning AI error:', error);
      return this.getFallbackResponse(question);
    }
  }

  // Handle teaching input from user (like "your name is X")
  private static async handleTeachingInput(question: string): Promise<string | null> {
    try {
      const db = await getDatabase();
      const questionLower = question.toLowerCase().trim();
      
      // Expanded teaching patterns
      const teachingPatterns = [
        // Name teaching - more variations
        { 
          pattern: /(?:your name is|you are called|you're called|call you|you are|i'll call you|lets call you|your name should be)\s+(.+)/i, 
          type: 'name' 
        },
        { 
          pattern: /(?:my name is|i am|i'm|call me|you can call me|i'm called)\s+(.+)/i, 
          type: 'user_name' 
        },
        // Identity/personality teaching
        { 
          pattern: /(?:you are|you're|you should be)\s+(.+)/i, 
          type: 'identity' 
        },
        // Facts teaching - more variations
        { 
          pattern: /(?:remember that|remember|know that|you should know|learn that|understand that)\s+(.+)/i, 
          type: 'fact' 
        },
        // Preferences teaching
        { 
          pattern: /(?:i like|i love|i prefer|i enjoy|i'm into|i really like)\s+(.+)/i, 
          type: 'user_preference' 
        },
        { 
          pattern: /(?:you like|you love|you prefer|you enjoy|you're into|you really like)\s+(.+)/i, 
          type: 'ai_preference' 
        }
      ];

      for (const { pattern, type } of teachingPatterns) {
        const match = questionLower.match(pattern);
        if (match && match[1]) {
          const value = match[1].trim();
          
          // Save the fact to personal memory
          await this.savePersonalFact(type, value);
          
          // Create appropriate response
          let response = '';
          switch (type) {
            case 'name':
              response = `✅ Got it! I'll remember that my name is ${value}. Thank you for telling me!`;
              break;
            case 'user_name':
              response = `✅ Nice to meet you, ${value}! I'll remember your name.`;
              break;
            case 'identity':
              response = `✅ I'll remember that I am ${value}. Thanks for teaching me about myself!`;
              break;
            case 'fact':
              response = `✅ I've learned and will remember: ${value}`;
              break;
            case 'user_preference':
              response = `✅ I'll remember that you like ${value}. Good to know!`;
              break;
            case 'ai_preference':
              response = `✅ I'll remember that I like ${value}. Thanks for telling me about my preferences!`;
              break;
          }
          
          // Also create a learning pattern for this fact
          await this.createFactPattern(question, response, type, value);
          
          console.log(`📚 Learned new ${type}: ${value}`);
          return response;
        }
      }
      
      return null; // No teaching pattern detected
    } catch (error) {
      console.error('Error handling teaching input:', error);
      return null;
    }
  }

  // Handle personal questions about the AI
  private static async handlePersonalQuestions(question: string): Promise<string | null> {
    try {
      const db = await getDatabase();
      const questionLower = question.toLowerCase().trim();
      
      // Expanded patterns for personal questions
      const personalQuestions = [
        { 
          patterns: [
            'what is your name', 'what\'s your name', 'whats your name',
            'who are you', 'tell me your name', 'what are you called',
            'what do they call you', 'your name', 'name?',
            'what should i call you', 'how should i address you'
          ], 
          type: 'name' 
        },
        { 
          patterns: [
            'what do you like', 'what are your preferences', 'what do you enjoy',
            'tell me what you like', 'your preferences', 'your interests'
          ], 
          type: 'ai_preference' 
        },
        { 
          patterns: [
            'who am i', 'what is my name', 'what\'s my name', 'whats my name',
            'do you remember me', 'do you know my name', 'my name'
          ], 
          type: 'user_name' 
        },
        { 
          patterns: [
            'what do i like', 'my preferences', 'what are my interests',
            'tell me what i like', 'my interests'
          ], 
          type: 'user_preference' 
        }
      ];

      for (const { patterns, type } of personalQuestions) {
        // Check if any pattern matches the question
        const matches = patterns.some(pattern => {
          // Exact match
          if (questionLower === pattern) return true;
          // Contains match
          if (questionLower.includes(pattern)) return true;
          // Check if question ends with the pattern (for short queries like "name?")
          if (questionLower.endsWith(pattern)) return true;
          return false;
        });

        if (matches) {
          const facts = await db.collection('personal_facts').find({ type }).toArray();
          
          if (facts.length > 0) {
            const latestFact = facts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
            
            let response = '';
            switch (type) {
              case 'name':
                response = `My name is ${latestFact.value}! 😊`;
                break;
              case 'user_name':
                response = `Yes, I remember you! Your name is ${latestFact.value}. 😊`;
                break;
              case 'ai_preference':
                const aiPrefs = facts.map(f => f.value).join(', ');
                response = `I like ${aiPrefs}! 😊`;
                break;
              case 'user_preference':
                const userPrefs = facts.map(f => f.value).join(', ');
                response = `I remember that you like ${userPrefs}! 😊`;
                break;
            }
            
            console.log(`🎯 Answered personal question about ${type}: ${latestFact.value}`);
            return response;
          } else {
            // No facts stored yet
            switch (type) {
              case 'name':
                return "I don't have a specific name yet. What would you like to call me? 😊";
              case 'user_name':
                return "I don't know your name yet. What should I call you? 😊";
              case 'ai_preference':
                return "I haven't learned about my preferences yet. You can teach me by telling me what I like! 😊";
              case 'user_preference':
                return "I don't know your preferences yet. Tell me what you like! 😊";
            }
          }
        }
      }
      
      return null; // No personal question detected
    } catch (error) {
      console.error('Error handling personal questions:', error);
      return null;
    }
  }

  // Handle math questions and calculations
  private static async handleMathQuestions(question: string): Promise<string | null> {
    try {
      const questionLower = question.toLowerCase().trim();
      
      console.log(`🔢 Checking if question is math-related: "${question}"`);
      
      // Math detection patterns
      const mathPatterns = [
        // Basic arithmetic
        /(?:what\s+is\s+|calculate\s+|solve\s+)?(\d+(?:\.\d+)?)\s*([+\-*/÷×])\s*(\d+(?:\.\d+)?)/,
        
        // Percentage calculations
        /(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/,
        /(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*percent\s*of\s*(\d+(?:\.\d+)?)/,
        
        // Square operations
        /(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*(?:squared|to\s+the\s+power\s+of\s+2|\^2)/,
        /(?:what\s+is\s+the\s+)?square\s+root\s+of\s+(\d+(?:\.\d+)?)/,
        
        // Simple word problems
        /(\d+(?:\.\d+)?)\s+(?:plus|add|added\s+to|\+)\s+(\d+(?:\.\d+)?)/,
        /(\d+(?:\.\d+)?)\s+(?:minus|subtract|subtracted\s+from|\-)\s+(\d+(?:\.\d+)?)/,
        /(\d+(?:\.\d+)?)\s+(?:times|multiplied\s+by|multiply|\*|×)\s+(\d+(?:\.\d+)?)/,
        /(\d+(?:\.\d+)?)\s+(?:divided\s+by|divide|÷|\/)\s+(\d+(?:\.\d+)?)/,
      ];
      
      // Check for math keywords
      const mathKeywords = [
        'calculate', 'solve', 'math', 'plus', 'minus', 'times', 'divided', 
        'multiply', 'subtract', 'add', 'equals', 'percent', '%', 'square', 
        'root', 'power', 'factorial', 'sum', 'difference', 'product', 'quotient'
      ];
      
      const hasMathKeywords = mathKeywords.some(keyword => questionLower.includes(keyword));
      const hasNumbers = /\d/.test(question);
      const hasOperators = /[+\-*/÷×%^]/.test(question);
      
      if (!hasMathKeywords && !hasOperators && !hasNumbers) {
        return null; // Not a math question
      }
      
      console.log(`🎯 Detected potential math question`);
      
      // Try to match and solve math patterns
      for (const pattern of mathPatterns) {
        const match = questionLower.match(pattern);
        if (match) {
          console.log(`🔍 Matched math pattern:`, match);
          const result = await this.solveMathPattern(match, pattern);
          if (result) {
            // Save this math solution as a learning pattern
            await this.createMathPattern(question, result);
            return result;
          }
        }
      }
      
      // If no specific pattern matched but has math indicators, try general math parsing
      if (hasMathKeywords || hasOperators) {
        const generalResult = await this.parseGeneralMath(question);
        if (generalResult) {
          await this.createMathPattern(question, generalResult);
          return generalResult;
        }
      }
      
      return null; // Not a solvable math question
    } catch (error) {
      console.error('Error handling math questions:', error);
      return null;
    }
  }

  // Solve math based on matched patterns
  private static async solveMathPattern(match: RegExpMatchArray, pattern: RegExp): Promise<string | null> {
    try {
      const patternStr = pattern.toString();
      
      // Basic arithmetic: (\d+(?:\.\d+)?)\s*([+\-*/÷×])\s*(\d+(?:\.\d+)?)
      if (patternStr.includes('[+\\-*/÷×]')) {
        const num1 = parseFloat(match[1]);
        const operator = match[2];
        const num2 = parseFloat(match[3]);
        
        let result: number;
        let operation: string;
        
        switch (operator) {
          case '+':
            result = num1 + num2;
            operation = 'addition';
            break;
          case '-':
            result = num1 - num2;
            operation = 'subtraction';
            break;
          case '*':
          case '×':
            result = num1 * num2;
            operation = 'multiplication';
            break;
          case '/':
          case '÷':
            if (num2 === 0) return "❌ Cannot divide by zero!";
            result = num1 / num2;
            operation = 'division';
            break;
          default:
            return null;
        }
        
        return `🔢 ${num1} ${operator} ${num2} = **${result}**\n\nThis is a ${operation} problem. ${this.getMathExplanation(num1, operator, num2, result)}`;
      }
      
      // Percentage: (\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)
      if (patternStr.includes('%.*of') || patternStr.includes('percent.*of')) {
        const percentage = parseFloat(match[1]);
        const number = parseFloat(match[2]);
        const result = (percentage / 100) * number;
        
        return `🔢 ${percentage}% of ${number} = **${result}**\n\nTo calculate a percentage: multiply the number by the percentage divided by 100. So ${number} × (${percentage}/100) = ${result}`;
      }
      
      // Square: (\d+(?:\.\d+)?)\s*(?:squared|to\s+the\s+power\s+of\s+2|\^2)
      if (patternStr.includes('squared|to.*power.*2')) {
        const number = parseFloat(match[1]);
        const result = number * number;
        
        return `🔢 ${number}² = **${result}**\n\nSquaring a number means multiplying it by itself: ${number} × ${number} = ${result}`;
      }
      
      // Square root: square\s+root\s+of\s+(\d+(?:\.\d+)?)
      if (patternStr.includes('square.*root.*of')) {
        const number = parseFloat(match[1]);
        const result = Math.sqrt(number);
        const rounded = Math.round(result * 100) / 100; // Round to 2 decimal places
        
        return `🔢 √${number} = **${rounded}**\n\nThe square root is the number that, when multiplied by itself, gives the original number.`;
      }
      
      // Word problems (plus, minus, times, divided)
      if (patternStr.includes('plus|add|added')) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        const result = num1 + num2;
        return `🔢 ${num1} + ${num2} = **${result}**\n\nAddition combines two numbers to get their total sum.`;
      }
      
      if (patternStr.includes('minus|subtract')) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        const result = num1 - num2;
        return `🔢 ${num1} - ${num2} = **${result}**\n\nSubtraction finds the difference between two numbers.`;
      }
      
      if (patternStr.includes('times|multiplied|multiply')) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        const result = num1 * num2;
        return `🔢 ${num1} × ${num2} = **${result}**\n\nMultiplication is repeated addition: adding ${num1} to itself ${num2} times.`;
      }
      
      if (patternStr.includes('divided|divide')) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);
        if (num2 === 0) return "❌ Cannot divide by zero!";
        const result = num1 / num2;
        return `🔢 ${num1} ÷ ${num2} = **${result}**\n\nDivision splits a number into equal parts.`;
      }
      
      return null;
    } catch (error) {
      console.error('Error solving math pattern:', error);
      return null;
    }
  }

  // Parse general math expressions
  private static async parseGeneralMath(question: string): Promise<string | null> {
    try {
      // Simple expression extraction
      const expression = question.match(/[\d+\-*/÷×().\s]+/)?.[0]?.trim();
      
      if (!expression) return null;
      
      // Clean up the expression
      let cleanExpression = expression
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/\s+/g, '');
      
      // Basic safety check - only allow numbers, operators, and parentheses
      if (!/^[\d+\-*/.()]+$/.test(cleanExpression)) {
        return null;
      }
      
      try {
        // Use Function constructor for safe evaluation (basic expressions only)
        const result = Function(`"use strict"; return (${cleanExpression})`)();
        
        if (typeof result === 'number' && !isNaN(result)) {
          return `🔢 ${expression} = **${result}**\n\nMath calculation completed successfully.`;
        }
      } catch (evalError) {
        console.log('Math evaluation failed:', evalError);
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing general math:', error);
      return null;
    }
  }

  // Get math explanation
  private static getMathExplanation(num1: number, operator: string, num2: number, result: number): string {
    switch (operator) {
      case '+':
        return `When you add ${num1} and ${num2}, you combine their values to get ${result}.`;
      case '-':
        return `When you subtract ${num2} from ${num1}, you find the difference, which is ${result}.`;
      case '*':
      case '×':
        return `When you multiply ${num1} by ${num2}, you add ${num1} to itself ${num2} times to get ${result}.`;
      case '/':
      case '÷':
        return `When you divide ${num1} by ${num2}, you split ${num1} into ${num2} equal parts, each worth ${result}.`;
      default:
        return 'Mathematical operation completed.';
    }
  }

  // Create a learning pattern for math solutions
  private static async createMathPattern(question: string, response: string): Promise<void> {
    try {
      const db = await getDatabase();
      
      const keywords = this.extractKeywords(question);
      const mathKeywords = ['math', 'calculation', 'arithmetic', 'solve', 'compute'];
      
      const pattern: LearningPattern = {
        id: `math-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: question.trim(),
        answer: response,
        context: ['mathematics', 'calculation'],
        accuracy: 1.0, // Math answers are always accurate
        usageCount: 1,
        feedback: 1, // Start with positive feedback for math
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['mathematics', 'calculation', 'solved', ...mathKeywords, ...keywords]
      };
      
      await db.collection('learning_patterns').insertOne(pattern);
      
      console.log(`💾 Saved math solution pattern:`);
      console.log(`   📝 Question: "${question.substring(0, 50)}..."`);
      console.log(`   🔢 Type: Mathematics`);
      console.log(`   🎯 Accuracy: 100%`);
      
    } catch (error) {
      console.error('Error creating math pattern:', error);
    }
  }

  // Check if question is about manufacturing/building/making things
  private static isManufacturingQuestion(question: string): boolean {
    const questionLower = question.toLowerCase().trim();
    
    // Manufacturing question patterns
    const manufacturingPatterns = [
      /how\s+do\s+they\s+(make|build|create|manufacture|produce|construct)/,
      /how\s+to\s+(make|build|create|manufacture|produce|construct)/,
      /how\s+are\s+\w+\s+(made|built|created|manufactured|produced|constructed)/,
      /how\s+is\s+a?\s*\w+\s+(made|built|created|manufactured|produced|constructed)/,
      /what\s+is\s+the\s+process\s+(of|to)\s+(making|building|creating)/
    ];
    
    // Check for direct pattern matches
    const hasManufacturingPattern = manufacturingPatterns.some(pattern => pattern.test(questionLower));
    
    // Check for manufacturing keywords combined with products
    const manufacturingKeywords = ['make', 'build', 'create', 'manufacture', 'produce', 'construct', 'assembly', 'factory'];
    const productKeywords = ['tv', 'television', 'phone', 'computer', 'car', 'house', 'building', 'device', 'machine', 'product'];
    
    const hasManufacturingKeyword = manufacturingKeywords.some(keyword => questionLower.includes(keyword));
    const hasProductKeyword = productKeywords.some(keyword => questionLower.includes(keyword));
    
    const isManufacturing = hasManufacturingPattern || (hasManufacturingKeyword && hasProductKeyword);
    
    if (isManufacturing) {
      console.log(`🏭 Manufacturing question detected:`);
      console.log(`   Pattern match: ${hasManufacturingPattern}`);
      console.log(`   Keywords: manufacturing(${hasManufacturingKeyword}) + product(${hasProductKeyword})`);
    }
    
    return isManufacturing;
  }

  // Save personal facts to database
  private static async savePersonalFact(type: string, value: string): Promise<void> {
    try {
      const db = await getDatabase();
      
      const personalFact = {
        type,
        value,
        timestamp: new Date(),
        id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      await db.collection('personal_facts').insertOne(personalFact);
    } catch (error) {
      console.error('Error saving personal fact:', error);
    }
  }

  // Create a learning pattern for taught facts
  private static async createFactPattern(question: string, response: string, type: string, value: string): Promise<void> {
    try {
      const db = await getDatabase();
      
      const pattern: LearningPattern = {
        id: `fact-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question,
        answer: response,
        context: [type, value],
        accuracy: 1.0, // High accuracy for taught facts
        usageCount: 1,
        feedback: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [type, 'personal', 'taught', ...this.extractKeywords(question)]
      };
      
      await db.collection('learning_patterns').insertOne(pattern);
    } catch (error) {
      console.error('Error creating fact pattern:', error);
    }
  }

  // Create a learning pattern from web search results
  private static async createWebSourcedPattern(question: string, response: string, keywords: string[], searchResults: string[]): Promise<void> {
    try {
      const db = await getDatabase();
      
      // Create comprehensive tags for better searchability
      const allTags = [
        'web-search', 
        'factual', 
        'knowledge-base',
        ...keywords,
        ...this.extractKeywords(response.substring(0, 200)) // Extract keywords from the answer too
      ];
      
      // Remove duplicates and filter out short words
      const uniqueTags = [...new Set(allTags)].filter(tag => tag.length > 2);
      
      const pattern: LearningPattern = {
        id: `web-pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        question: question.trim(),
        answer: response,
        context: searchResults, // Store all search results as context
        accuracy: 0.85, // High accuracy for web-sourced information
        usageCount: 1,
        feedback: 1, // Start with positive feedback since it's web-sourced
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: uniqueTags
      };
      
      await db.collection('learning_patterns').insertOne(pattern);
      
      console.log(`💾 Saved web-sourced learning pattern:`);
      console.log(`   📝 Question: "${question.substring(0, 50)}..."`);
      console.log(`   🏷️  Tags: [${uniqueTags.slice(0, 5).join(', ')}${uniqueTags.length > 5 ? '...' : ''}]`);
      console.log(`   🎯 Accuracy: ${pattern.accuracy}`);
      console.log(`   📊 Context items: ${searchResults.length}`);
      
      // Also create additional patterns for related keywords to improve future matching
      for (const keyword of keywords.slice(0, 3)) { // Limit to top 3 keywords
        if (keyword.length > 3) {
          const keywordPattern: LearningPattern = {
            id: `keyword-pattern-${Date.now()}-${keyword}-${Math.random().toString(36).substr(2, 6)}`,
            question: `What is ${keyword}?`,
            answer: `Based on my web search: ${searchResults[0].substring(0, 300)}...`,
            context: [keyword, question],
            accuracy: 0.75,
            usageCount: 0,
            feedback: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: [keyword, 'web-search', 'keyword-derived', 'factual']
          };
          
          await db.collection('learning_patterns').insertOne(keywordPattern);
        }
      }
      
    } catch (error) {
      console.error('Error creating web-sourced pattern:', error);
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
    const questionLower = question.toLowerCase().trim();
    
    console.log(`🔍 Searching for patterns similar to: "${question}"`);
    console.log(`🔑 Question keywords: [${keywords.join(', ')}]`);
    
    // Enhanced search queries with better pattern matching
    const searchQueries = [
      // Exact phrase matching (highest priority)
      { question: { $regex: this.escapeRegex(questionLower), $options: 'i' } },
      
      // Exact keyword matching in tags (high priority)
      { tags: { $all: keywords.slice(0, 2) } }, // Must have first 2 keywords
      
      // Any keyword matching in tags (medium priority)
      { tags: { $in: keywords } },
      
      // Keyword matching in question text (medium priority)
      ...keywords.map(keyword => ({
        question: { $regex: `\\b${this.escapeRegex(keyword)}\\b`, $options: 'i' }
      })),
      
      // Partial keyword matching in question (lower priority)
      ...keywords.filter(k => k.length > 4).map(keyword => ({
        question: { $regex: this.escapeRegex(keyword), $options: 'i' }
      })),
      
      // Question type matching (what, how, why, etc.)
      ...(questionLower.match(/^(what|how|why|when|where|who|which)\s/) ? [{
        question: { $regex: `^${questionLower.match(/^(what|how|why|when|where|who|which)/)?.[0]}`, $options: 'i' }
      }] : [])
    ];
    
    const patterns = await db.collection('learning_patterns')
      .find({
        $or: searchQueries
      })
      .sort({ 
        accuracy: -1,      // Prioritize more accurate patterns
        usageCount: -1,    // Then by usage frequency
        feedback: -1,      // Then by positive feedback
        updatedAt: -1      // Then by recency
      })
      .limit(20) // Get more candidates for better filtering
      .toArray();

    console.log(`📊 Found ${patterns.length} candidate patterns from database`);

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
      
      // Calculate multiple similarity metrics
      const textSimilarity = this.calculateSimilarity(questionLower, pattern.question.toLowerCase());
      const keywordSimilarity = this.calculateKeywordSimilarity(keywords, pattern.tags);
      const semanticSimilarity = this.calculateSemanticSimilarity(questionLower, pattern.question.toLowerCase());
      
      // Weighted combined score
      const combinedScore = (textSimilarity * 0.4) + (keywordSimilarity * 0.3) + (semanticSimilarity * 0.3);
      
      console.log(`🔍 Pattern similarity analysis:`);
      console.log(`   📝 Pattern: "${pattern.question.substring(0, 40)}..."`);
      console.log(`   📊 Text: ${(textSimilarity * 100).toFixed(1)}%, Keywords: ${(keywordSimilarity * 100).toFixed(1)}%, Semantic: ${(semanticSimilarity * 100).toFixed(1)}%`);
      console.log(`   🎯 Combined: ${(combinedScore * 100).toFixed(1)}%`);
      
      return { pattern, similarity: combinedScore };
    });

    // Sort by similarity score and return top matches
    const filteredPatterns = patternsWithScores
      .filter(p => p.similarity > 0.25) // Lower threshold for better matching
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(p => p.pattern);
      
    console.log(`✅ Returning ${filteredPatterns.length} similar patterns with similarity > 25%`);
    
    return filteredPatterns;
  }

  // Calculate text similarity between two strings
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 2));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate keyword similarity between question keywords and pattern tags
  private static calculateKeywordSimilarity(questionKeywords: string[], patternTags: string[]): number {
    if (questionKeywords.length === 0 || patternTags.length === 0) return 0;
    
    const questionSet = new Set(questionKeywords.map(k => k.toLowerCase()));
    const tagSet = new Set(patternTags.map(t => t.toLowerCase()));
    
    const intersection = new Set([...questionSet].filter(k => tagSet.has(k)));
    const union = new Set([...questionSet, ...tagSet]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  // Calculate semantic similarity (simplified version)
  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    // Check for question type similarity (what, how, why, etc.)
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which'];
    const text1Type = questionWords.find(w => text1.startsWith(w));
    const text2Type = questionWords.find(w => text2.startsWith(w));
    
    let semanticScore = 0;
    
    // Same question type gets bonus points
    if (text1Type && text2Type && text1Type === text2Type) {
      semanticScore += 0.3;
    }
    
    // Check for similar sentence structure
    const text1Length = text1.split(/\s+/).length;
    const text2Length = text2.split(/\s+/).length;
    const lengthSimilarity = 1 - Math.abs(text1Length - text2Length) / Math.max(text1Length, text2Length);
    semanticScore += lengthSimilarity * 0.2;
    
    // Check for similar concepts (simple keyword overlap)
    const conceptWords = ['define', 'definition', 'explain', 'meaning', 'process', 'work', 'function'];
    const text1Concepts = conceptWords.filter(w => text1.includes(w));
    const text2Concepts = conceptWords.filter(w => text2.includes(w));
    
    if (text1Concepts.length > 0 && text2Concepts.length > 0) {
      const conceptOverlap = text1Concepts.filter(c => text2Concepts.includes(c)).length;
      semanticScore += (conceptOverlap / Math.max(text1Concepts.length, text2Concepts.length)) * 0.3;
    }
    
    return Math.min(semanticScore, 1.0);
  }

  // Calculate contextual relevance to avoid matching irrelevant patterns
  private static calculateContextualRelevance(question: string, pattern: LearningPattern): number {
    const questionLower = question.toLowerCase();
    const patternLower = pattern.question.toLowerCase();
    const answerLower = pattern.answer.toLowerCase();
    
    // Extract main topics from both questions
    const questionTopics = this.extractTopics(questionLower);
    const patternTopics = this.extractTopics(patternLower);
    const answerTopics = this.extractTopics(answerLower);
    
    console.log(`🔍 Context analysis:`);
    console.log(`   Question topics: [${questionTopics.join(', ')}]`);
    console.log(`   Pattern topics: [${patternTopics.join(', ')}]`);
    console.log(`   Answer topics: [${answerTopics.join(', ')}]`);
    
    // Check if the topics are related
    let relevanceScore = 0;
    
    // Direct topic overlap between questions
    const questionTopicOverlap = questionTopics.filter(t => patternTopics.includes(t)).length;
    const totalQuestionTopics = Math.max(questionTopics.length, patternTopics.length);
    if (totalQuestionTopics > 0) {
      relevanceScore += (questionTopicOverlap / totalQuestionTopics) * 0.4;
    }
    
    // Check if question topics relate to answer content
    const answerRelevance = questionTopics.filter(t => answerTopics.includes(t)).length;
    const totalAnswerTopics = Math.max(questionTopics.length, answerTopics.length);
    if (totalAnswerTopics > 0) {
      relevanceScore += (answerRelevance / totalAnswerTopics) * 0.3;
    }
    
    // Check for domain consistency (technology, science, grammar, etc.)
    const questionDomain = this.identifyDomain(questionLower);
    const patternDomain = this.identifyDomain(patternLower);
    const answerDomain = this.identifyDomain(answerLower);
    
    console.log(`   Domains: Question(${questionDomain}), Pattern(${patternDomain}), Answer(${answerDomain})`);
    
    // Special case: completely block grammar patterns for manufacturing/technology questions
    if ((questionDomain === 'manufacturing' || questionDomain === 'technology') && 
        (patternDomain === 'grammar' || answerDomain === 'grammar')) {
      console.log(`   🚫 Blocking grammar pattern for manufacturing/technology question`);
      return 0; // No relevance for grammar when asking about manufacturing
    }
    
    // Special case: completely block technology patterns for grammar questions
    if (questionDomain === 'grammar' && 
        (patternDomain === 'manufacturing' || patternDomain === 'technology')) {
      console.log(`   🚫 Blocking technology pattern for grammar question`);
      return 0; // No relevance for technology when asking about grammar
    }
    
    if (questionDomain === patternDomain || questionDomain === answerDomain) {
      relevanceScore += 0.3;
    }
    
    // Penalty for completely unrelated content
    if (questionDomain && patternDomain && questionDomain !== patternDomain && answerDomain !== questionDomain) {
      relevanceScore *= 0.3; // Reduce score significantly for domain mismatch
    }
    
    console.log(`   🎯 Contextual relevance: ${(relevanceScore * 100).toFixed(1)}%`);
    
    return Math.min(relevanceScore, 1.0);
  }

  // Extract main topics from text
  private static extractTopics(text: string): string[] {
    // Remove question words and common words
    const stopWords = new Set(['how', 'what', 'why', 'when', 'where', 'who', 'which', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'they', 'them', 'their']);
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limit to 5 main topics
  }

  // Identify the domain/subject area of the text
  private static identifyDomain(text: string): string {
    const domains = {
      technology: ['tv', 'television', 'computer', 'phone', 'device', 'electronic', 'digital', 'software', 'hardware', 'build', 'manufacture', 'assembly', 'factory', 'make', 'create', 'produce', 'construct', 'screen', 'display'],
      science: ['chemical', 'physics', 'biology', 'scientific', 'experiment', 'theory', 'research', 'study', 'atom', 'molecule', 'energy'],
      grammar: ['pronoun', 'grammatical', 'subject', 'english', 'language', 'grammar', 'linguistic', 'syntax', 'third-person', 'verb', 'noun', 'adjective', 'modern english'],
      mathematics: ['calculate', 'equation', 'number', 'math', 'arithmetic', 'solve', 'plus', 'minus', 'times', 'divide', 'percent'],
      manufacturing: ['how to make', 'how do they make', 'how to build', 'how do they build', 'production', 'assembly line', 'factory', 'manufacturing process'],
      general: ['person', 'people', 'human', 'society', 'culture', 'history']
    };
    
    // Check for manufacturing/technology patterns first (more specific)
    if (text.includes('how do they make') || text.includes('how do they build') || text.includes('how to make') || text.includes('how to build')) {
      return 'manufacturing';
    }
    
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
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

  // Check if the input looks like a question that needs web search
  private static isQuestionNeedingWebSearch(question: string): boolean {
    const questionLower = question.toLowerCase().trim();
    
    // Question word patterns
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'whose', 'whom'];
    const startsWithQuestionWord = questionWords.some(word => questionLower.startsWith(word));
    
    // Question patterns
    const questionPatterns = [
      /\?$/,                          // Ends with question mark
      /^(what|how|why|when|where|who|which|whose|whom)\s/i,  // Starts with question words
      /^(is|are|can|could|would|will|should|do|does|did|have|has|had)\s/i,  // Starts with auxiliary verbs
      /^(tell me|explain|describe|define)\s/i,  // Command forms that are questions
      /\b(meaning|definition|explanation)\b/i,   // Looking for definitions
      /\b(how to|step by step)\b/i,             // How-to questions
    ];
    
    const isQuestion = questionPatterns.some(pattern => pattern.test(questionLower));
    
    // Length check - very short statements probably aren't questions needing web search
    const isLongEnough = question.trim().length > 5;
    
    // Contains meaningful keywords (not just personal chat)
    const personalChatWords = ['hi', 'hello', 'thanks', 'thank you', 'bye', 'goodbye', 'ok', 'okay'];
    const isNotJustChat = !personalChatWords.includes(questionLower);
    
    return (isQuestion || startsWithQuestionWord) && isLongEnough && isNotJustChat;
  }

  // Generate a response when no patterns are found (learning mode)
  private static async generateLearningResponse(question: string, context: string[]): Promise<string> {
    const keywords = this.extractKeywords(question);
    
    console.log(`🔍 Learning AI: No existing patterns found for "${question}"`);
    console.log(`🔍 Attempting web search for any question I don't know...`);
    
    // ALWAYS try to search the web for information when we don't have existing patterns
    try {
      const searchResults = await searchWeb(question);
      
      if (searchResults.length > 0) {
        console.log(`✅ Web search successful! Found ${searchResults.length} results`);
        
        // Create a clean response from search results
        let response = "";
        
        // Use the first search result as the main answer
        const mainResult = searchResults[0];
        response += mainResult;
        
        // Add additional context if available
        if (searchResults.length > 1) {
          response += "\n\n📚 Additional information:\n";
          searchResults.slice(1, 3).forEach((result, index) => {
            response += `\n${index + 1}. ${result.substring(0, 200)}...`;
          });
        }
        
        // Save this as a high-quality learning pattern with web-sourced information
        await this.createWebSourcedPattern(question, response, keywords, searchResults);
        
        console.log(`💾 Saved web search results as learning pattern for future use`);
        return response;
      } else {
        console.log(`❌ Web search returned no results`);
      }
    } catch (error) {
      console.error('Web search failed:', error);
    }
    
    // If web search fails, provide a learning-focused response
    let response = `🧠 I don't have specific information about "${keywords.join(', ')}" in my current knowledge base. `;
    
    // Analyze the question type to provide contextual guidance
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('what') && questionLower.includes('is')) {
      response += "This appears to be asking for a definition or explanation. ";
      response += "I'll try to learn more about this topic to better answer similar questions in the future. ";
    } else if (questionLower.includes('how')) {
      response += "This seems to be asking about a process or method. ";
      response += "Understanding 'how' questions often involves step-by-step explanations. ";
    } else if (questionLower.includes('why')) {
      response += "You're looking for reasoning or causation. ";
      response += "These questions help me understand the underlying principles and relationships. ";
    } else if (questionLower.includes('when') || questionLower.includes('where')) {
      response += "This is asking about timing or location - specific factual information. ";
      response += "I'll work on gathering more factual data to improve my responses. ";
    } else if (questionLower.includes('who')) {
      response += "This is asking about people or entities. ";
      response += "Identifying specific individuals or organizations requires detailed knowledge. ";
    } else {
      response += "I'm analyzing the pattern of your question to improve my understanding. ";
    }
    
    response += "\n\n🔄 I attempted to search for this information online but wasn't able to find relevant results at this time. ";
    response += "Could you provide more context or try rephrasing your question? ";
    response += "\n\n💡 Every interaction helps me learn and improve! I'm continuously building my knowledge base to serve you better.";

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

  // Self-improvement method with ChatGPT learning
  static async selfImprove(): Promise<void> {
    try {
      const db = await getDatabase();
      
      console.log('🔄 Starting AISync self-improvement with ChatGPT learning...');
      
      // Check if we should trigger a learning session
      const lastLearningSession = await db.collection('learning_sessions')
        .findOne({}, { sort: { startTime: -1 } });
      
      const shouldLearn = !lastLearningSession || 
        (new Date().getTime() - lastLearningSession.startTime.getTime()) > (24 * 60 * 60 * 1000); // 24 hours
      
      if (shouldLearn) {
        console.log('🧠 Triggering AISync self-learning session with ChatGPT...');
        try {
          await AISyncSelfLearning.startSelfLearningSession();
          console.log('✅ AISync successfully learned new knowledge from ChatGPT');
        } catch (error) {
          console.error('❌ AISync self-learning failed:', error);
        }
      }
      
      // Continue with existing improvement logic
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
      
      console.log('🧠 AISync self-improvement completed');
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
      await db.collection('personal_facts').createIndex({ type: 1 });
      await db.collection('personal_facts').createIndex({ timestamp: -1 });
      
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
      const totalPersonalFacts = await db.collection('personal_facts').countDocuments();
      
      const patterns = await db.collection('learning_patterns').find({}).toArray();
      const averageAccuracy = patterns.length > 0 
        ? patterns.reduce((sum, p) => sum + (p.accuracy || 0.5), 0) / patterns.length
        : 0.5;
      
      const totalResponses = patterns.reduce((sum, p) => sum + (p.usageCount || 0), 0);
      const learningScore = Math.min((totalPatterns + totalPersonalFacts) / 100, 1.0); // Include personal facts in learning score
      
      return {
        totalPatterns,
        totalInteractions,
        averageAccuracy,
        totalResponses,
        learningScore,
        improvementRate: 0.1,
        topicExpertise: { personalFacts: totalPersonalFacts },
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
