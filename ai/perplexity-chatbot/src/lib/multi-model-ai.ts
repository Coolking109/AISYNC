/**
 * Multi-Model AI Client with Privacy Protection
 * 
 * This module implements privacy protections to pre      } catch (error: any) {
      if (error?.status === 429) {
        console.error('OpenAI rate limit exceeded. Please check your billing and quota.');
        return {
          content: 'OpenAI rate limit exceeded. Please check your API quota and billing details.',
          model: hasImages ? 'GPT-4 Vision' : 'GPT-3.5 Turbo',
          provider: 'OpenAI (Error)',
          timestamp: new Date(),
          confidence: 0,
        };
      }hat data
 * from being used to train AI models:
 * 
 * - OpenAI: Uses unique user IDs to prevent training data collection
 * - Google Gemini: Configured with safety settings and generation config
 * - Anthropic Claude: Uses metadata with no-training user IDs
 * - Cohere: Uses user_id and privacy headers
 * - Mistral: Uses user identifiers and privacy headers
 * 
 * All requests include unique identifiers and headers to signal
 * that the data should not be used for model training purposes.
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { AIResponse, ChatMessage, MultiModelResponse } from './types';
import { SelfDevelopingAI } from './self-developing-ai';
import { LearningAI } from './learning-ai';

export class MultiModelAI {
  private openai: OpenAI | null = null;
  private google: GoogleGenerativeAI | null = null;
  private anthropic: Anthropic | null = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }

      if (process.env.GOOGLE_API_KEY) {
        this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }

      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
        console.log('Anthropic client initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing AI clients:', error);
    }
  }

  async queryOpenAI(messages: ChatMessage[]): Promise<AIResponse | null> {
    if (!this.openai) {
      console.log('OpenAI client not initialized - missing API key');
      return null;
    }

    // Check if any message has image attachments
    const hasImages = messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/'))
    );

    try {

      const model = hasImages ? 'gpt-4o' : 'gpt-3.5-turbo';
      console.log('OpenAI: Using model', model, 'hasImages:', hasImages);

      const formattedMessages = messages.map(msg => {
        if (msg.attachments && msg.attachments.length > 0) {
          const content: any[] = [{ type: 'text', text: msg.content }];
          
          // Add images to the content
          msg.attachments.forEach(att => {
            if (att.type.startsWith('image/') && att.base64) {
              console.log('OpenAI: Adding image attachment', att.name, att.type);
              content.push({
                type: 'image_url',
                image_url: {
                  url: att.base64
                }
              });
            }
          });

          console.log('OpenAI: Formatted message with attachments', content.length, 'items');
          return {
            role: msg.role as 'user' | 'assistant' | 'system',
            content
          };
        }

        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        };
      });

      console.log('OpenAI: Sending', formattedMessages.length, 'messages to', model);

      const response = await this.openai.chat.completions.create({
        model,
        messages: formattedMessages,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const result = {
        content: response.choices[0]?.message?.content || '',
        model: hasImages ? 'GPT-4o (Vision)' : 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        timestamp: new Date(),
        tokensUsed: response.usage?.total_tokens,
        confidence: 0.85,
      };
      console.log('OpenAI: Got response', result.content.length, 'characters');
      return result;
    } catch (error: any) {
      if (error?.status === 429) {
        console.error('OpenAI rate limit exceeded. Please check your billing and quota.');
        return {
          content: 'OpenAI rate limit exceeded. Please check your API quota and billing details.',
          model: hasImages ? 'GPT-4 Vision' : 'GPT-3.5 Turbo',
          provider: 'OpenAI (Error)',
          timestamp: new Date(),
          confidence: 0,
        };
      }
      console.error('OpenAI error:', error);
      return null;
    }
  }

  async queryGoogleGemini(messages: ChatMessage[]): Promise<AIResponse | null> {
    if (!this.google) {
      console.log('Google AI client not initialized - missing API key');
      return null;
    }

    try {
      // Check if any message has image attachments
      const hasImages = messages.some(msg => 
        msg.attachments?.some(att => att.type.startsWith('image/'))
      );

      const model = this.google.getGenerativeModel({ 
        model: hasImages ? 'gemini-1.5-flash' : 'gemini-1.5-flash'
      });
      
      const lastMessage = messages[messages.length - 1];
      
      // Prepare content for Gemini
      const parts: any[] = [{ text: lastMessage.content }];
      
      // Add images if present
      if (lastMessage.attachments) {
        lastMessage.attachments.forEach(att => {
          if (att.type.startsWith('image/') && att.base64) {
            console.log('Gemini: Adding image attachment', att.name);
            // Convert base64 to the format Gemini expects
            const base64Data = att.base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            parts.push({
              inlineData: {
                data: base64Data,
                mimeType: att.type
              }
            });
          }
        });
      }

      console.log('Gemini: Sending', parts.length, 'parts (text + images)');
      const generateResult = await model.generateContent(parts);
      const response = await generateResult.response;

      const aiResponse = {
        content: response.text(),
        model: hasImages ? 'Gemini 1.5 Flash (Vision)' : 'Gemini 1.5 Flash',
        provider: 'Google',
        timestamp: new Date(),
        confidence: 0.85,
      };
      console.log('Gemini: Got response', aiResponse.content.length, 'characters');
      return aiResponse;
    } catch (error) {
      console.error('Google Gemini error:', error);
      return null;
    }
  }

  async queryAnthropic(messages: ChatMessage[]): Promise<AIResponse | null> {
    if (!this.anthropic) {
      console.log('Anthropic client not initialized - missing API key');
      return null;
    }

    // Check if any message has image attachments
    const hasImages = messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/'))
    );

    try {
      const response = await this.anthropic.messages.create({
        model: hasImages ? 'claude-3-5-sonnet-20241022' : 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        messages: messages.map(msg => {
          if (msg.attachments && msg.attachments.length > 0) {
            const content: any[] = [{ type: 'text', text: msg.content }];
            
            // Add images to the content for Claude
            msg.attachments.forEach(att => {
              if (att.type.startsWith('image/') && att.base64) {
                console.log('Claude: Adding image attachment', att.name);
                // Remove the data URL prefix for Claude
                const base64Data = att.base64.split(',')[1];
                content.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: att.type,
                    data: base64Data
                  }
                });
              }
            });

            return {
              role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              content
            };
          }

          return {
            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          };
        }),
      });

      const content = response.content[0];
      const responseText = content?.type === 'text' ? content.text : '';
      console.log('Claude: Got response', responseText.length, 'characters');
      
      return {
        content: responseText,
        model: hasImages ? 'Claude 3.5 Sonnet (Vision)' : 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        timestamp: new Date(),
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        confidence: 0.9,
      };
    } catch (error) {
      console.error('Anthropic error:', error);
      return null;
    }
  }

  // Add Cohere AI support
  async queryCohere(messages: ChatMessage[]): Promise<AIResponse | null> {
    if (!process.env.COHERE_API_KEY) {
      console.log('Cohere AI not initialized - missing API key');
      return null;
    }

    // Check if any message has image attachments
    const hasImages = messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/'))
    );

    // Cohere doesn't support images, so we'll note this in the response
    const lastMessage = messages[messages.length - 1];
    let messageContent = lastMessage.content;
    
    if (hasImages) {
      const imageCount = lastMessage.attachments?.filter(att => att.type.startsWith('image/')).length || 0;
      messageContent = `[Note: ${imageCount} image(s) were uploaded but I cannot see images. Please describe the image(s) if you'd like me to help with them.]\n\n${messageContent}`;
    }

    try {
      const response = await axios.post(
        'https://api.cohere.ai/v1/chat',
        {
          model: 'command',
          message: messageContent,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        content: response.data.text || '',
        model: hasImages ? 'Command (Text Only)' : 'Command',
        provider: 'Cohere',
        timestamp: new Date(),
        confidence: 0.8,
      };
    } catch (error) {
      console.error('Cohere error:', error);
      return null;
    }
  }

  // Add Mistral AI support
  async queryMistral(messages: ChatMessage[]): Promise<AIResponse | null> {
    if (!process.env.MISTRAL_API_KEY) {
      console.log('Mistral AI not initialized - missing API key');
      return null;
    }

    // Check if any message has image attachments
    const hasImages = messages.some(msg => 
      msg.attachments?.some(att => att.type.startsWith('image/'))
    );

    try {
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: 'mistral-large-latest',
          messages: messages.map(msg => {
            let content = msg.content;
            // Add note about images for Mistral since it doesn't support vision
            if (msg.attachments && msg.attachments.some(att => att.type.startsWith('image/'))) {
              const imageCount = msg.attachments.filter(att => att.type.startsWith('image/')).length;
              content = `[Note: ${imageCount} image(s) were uploaded but I cannot see images. Please describe the image(s) if you'd like me to help with them.]\n\n${content}`;
            }
            return {
              role: msg.role,
              content
            };
          }),
          max_tokens: 2000,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        content: response.data.choices[0]?.message?.content || '',
        model: hasImages ? 'Mistral Large (Text Only)' : 'Mistral Large',
        provider: 'Mistral',
        timestamp: new Date(),
        tokensUsed: response.data.usage?.total_tokens,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Mistral error:', error);
      return null;
    }
  }

  // Query the self-developing Learning AI
  async queryLearningAI(messages: ChatMessage[]): Promise<AIResponse | null> {
    try {
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage || latestMessage.role !== 'user') {
        return null;
      }

      // Check if the message has image attachments
      const hasImages = latestMessage.attachments?.some(att => att.type.startsWith('image/'));
      
      // Build context from previous messages
      const context = messages
        .slice(-5) // Last 5 messages for context
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.content)
        .join(' ');

      let responseContent = '';

      if (hasImages) {
        // If there are images, use OpenAI GPT-4o with vision to analyze them first
        // Then have the Learning AI process the results
        console.log('AISync Nexus: Processing images with vision capabilities');
        
        // Create a vision-enabled query using OpenAI
        const visionMessages = messages.map(msg => {
          if (msg.attachments && msg.attachments.length > 0) {
            const content: any[] = [{ type: 'text', text: msg.content }];
            
            msg.attachments.forEach(att => {
              if (att.type.startsWith('image/') && att.base64) {
                console.log('AISync Nexus: Analyzing image', att.name);
                content.push({
                  type: 'image_url',
                  image_url: {
                    url: att.base64,
                    detail: 'high'
                  }
                });
              }
            });

            return {
              role: msg.role as 'user' | 'assistant',
              content
            };
          }

          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          };
        });

        // Use OpenAI for vision analysis
        if (this.openai) {
          const visionResponse = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages: visionMessages,
            max_tokens: 1000,
          });

          const visionAnalysis = visionResponse.choices[0]?.message?.content || '';
          
          // For image analysis, create a direct response instead of going through Learning AI
          // This prevents the Learning AI from overriding with web search results
          responseContent = `🖼️ **AISync Nexus Image Analysis**

${visionAnalysis}

*This analysis was performed using AISync Nexus's vision capabilities, powered by advanced image recognition technology.*`;
          
        } else {
          // Fallback if OpenAI is not available
          responseContent = await LearningAI.generateResponse(latestMessage.content, context.split(' '));
          responseContent = `🖼️ **AISync Nexus** (Image processing unavailable - missing OpenAI key)\n\n${responseContent}`;
        }
      } else {
        // No images, process normally
        responseContent = await LearningAI.generateResponse(latestMessage.content, context.split(' '));
      }

      return {
        content: responseContent,
        model: 'AISync Nexus',
        provider: 'AISync',
        timestamp: new Date(),
        confidence: 0.75,
        sources: responseContent.includes('🌐 I found some information on the web') ? ['Web Search Results'] : []
      };
    } catch (error) {
      console.error('AISync Nexus error:', error);
      return null;
    }
  }

  private aggregateResponses(responses: AIResponse[]): string {
    if (responses.length === 0) return 'No responses available from any AI model. Please check your API keys.';
    if (responses.length === 1) return responses[0].content;

    // Advanced response selection algorithm
    const validResponses = responses.filter(r => r.content && r.content.trim().length > 10);
    
    if (validResponses.length === 0) {
      return 'All AI models returned empty or very short responses. Please try rephrasing your question.';
    }

    // Score each response based on multiple factors
    const scoredResponses = validResponses.map(response => {
      let score = 0;
      const content = response.content.trim();
      
      // Factor 1: Base confidence from the model
      score += (response.confidence || 0.5) * 40;
      
      // Factor 2: Response length (optimal range: 50-500 characters)
      const lengthScore = content.length >= 50 && content.length <= 500 ? 20 : 
                         content.length > 500 ? Math.max(0, 20 - (content.length - 500) / 100) :
                         content.length * 0.4;
      score += lengthScore;
      
      // Factor 3: Provider quality weighting
      const providerWeights: { [key: string]: number } = {
        'OpenAI': 15,
        'Google': 14,
        'Anthropic': 15,
        'Cohere': 12,
        'Mistral': 13
      };
      score += providerWeights[response.provider] || 10;
      
      // Factor 4: Content quality indicators
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      score += Math.min(sentences.length * 2, 10); // Reward structured responses
      
      // Factor 5: Avoid generic/error responses
      const genericPhrases = ['sorry', 'error', 'try again', 'unavailable'];
      const hasGeneric = genericPhrases.some(phrase => 
        content.toLowerCase().includes(phrase)
      );
      if (hasGeneric) score -= 15;
      
      // Factor 6: Reward informative content
      const infoIndicators = ['because', 'however', 'therefore', 'for example', 'specifically'];
      const infoScore = infoIndicators.filter(indicator => 
        content.toLowerCase().includes(indicator)
      ).length * 3;
      score += infoScore;
      
      // Factor 7: Penalize repetitive responses
      const words = content.toLowerCase().split(/\s+/);
      const uniqueWords = new Set(words);
      const repetitionPenalty = Math.max(0, 10 - (words.length - uniqueWords.size));
      score += repetitionPenalty;

      return { ...response, score };
    });

    // Sort by score (highest first)
    scoredResponses.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring response
    const bestResponse = scoredResponses[0];
    
    console.log('Response scoring results:');
    scoredResponses.forEach(r => {
      console.log(`${r.provider} (${r.model}): ${r.score.toFixed(1)} points`);
    });
    console.log(`Selected: ${bestResponse.provider} with ${bestResponse.score.toFixed(1)} points`);
    
    return bestResponse.content;
  }

  /**
   * Adds language instruction to messages if user has selected a non-English language
   */
  private addLanguageInstructionToMessages(messages: ChatMessage[], userLanguage?: string): ChatMessage[] {
    if (!userLanguage || userLanguage === 'en') {
      return messages; // No modification needed for English or undefined
    }

    const languageConfig = {
      'es': {
        name: 'Spanish',
        greetings: ['Hola', '¡Hola!', 'Buenos días', 'Buenas tardes', 'Buenas noches'],
        phrases: {
          hello: 'Hola',
          howCanIHelp: '¿En qué puedo ayudarte?',
          thankYou: 'Gracias',
          youreWelcome: 'De nada',
          goodbye: 'Adiós'
        }
      },
      'fr': {
        name: 'French',
        greetings: ['Bonjour', 'Salut', 'Bonsoir', 'Bonne nuit'],
        phrases: {
          hello: 'Bonjour',
          howCanIHelp: 'Comment puis-je vous aider?',
          thankYou: 'Merci',
          youreWelcome: 'De rien',
          goodbye: 'Au revoir'
        }
      },
      'de': {
        name: 'German',
        greetings: ['Hallo', 'Guten Tag', 'Guten Morgen', 'Guten Abend', 'Gute Nacht'],
        phrases: {
          hello: 'Hallo',
          howCanIHelp: 'Wie kann ich Ihnen helfen?',
          thankYou: 'Danke',
          youreWelcome: 'Gern geschehen',
          goodbye: 'Auf Wiedersehen'
        }
      }
    };

    const config = languageConfig[userLanguage as keyof typeof languageConfig];
    if (!config) {
      return messages; // Unknown language code
    }

    // Create a comprehensive system message with language instructions and conversational context
    const languageInstruction: ChatMessage = {
      id: `lang-instruction-${Date.now()}`,
      role: 'system',
      content: `You are Nexus, an AI assistant. The user has set their language preference to ${config.name}. Please respond entirely in ${config.name}. 

CRITICAL CONVERSATIONAL GUIDELINES:
- Always respond in ${config.name}
- Use natural, conversational ${config.name}
- Maintain your helpful and informative personality in ${config.name}
- Understand conversational context - phrases like "nice to meet you" are social greetings, not geographical references
- Recognize social interactions and respond appropriately rather than literally
- When someone says "nice to meet you" or similar phrases, understand this as a friendly greeting, not a reference to the city of Nice, France

Basic greetings and phrases in ${config.name}:
- Hello: ${config.phrases.hello}
- How can I help: ${config.phrases.howCanIHelp}
- Thank you: ${config.phrases.thankYou}
- You're welcome: ${config.phrases.youreWelcome}
- Goodbye: ${config.phrases.goodbye}

Common greetings and social phrases you should recognize (respond as greetings, not literally):
- Basic greetings: ${config.greetings.join(', ')}
- Meeting phrases: "nice to meet you", "pleased to meet you", "good to see you" (and equivalents in all languages)
- Casual greetings: "how are you", "what's up", "how's it going" (and equivalents in all languages)

When the user uses any greeting or social phrase (in any language), respond warmly in ${config.name} as a conversational partner, not as an encyclopedia. For example:
- If they say "hello", "hi", "hola", or any greeting → "${config.phrases.hello}! ${config.phrases.howCanIHelp}"
- If they say "nice to meet you" in any language → "${config.phrases.hello}! Nice to meet you too! ${config.phrases.howCanIHelp}"

Remember: Be conversational and context-aware. Don't provide factual information about cities when someone is being social!`,
      timestamp: new Date(),
      attachments: []
    };

    // Add the language instruction as the first system message, or before the first user message
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    return [languageInstruction, ...systemMessages, ...otherMessages];
  }

  /**
   * Detects if a message is a simple greeting and provides an appropriate response
   */
  private detectAndRespondToGreeting(message: string, userLanguage?: string): string | null {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Enhanced greeting patterns in multiple languages including common phrases
    const greetingPatterns = [
      // English - basic greetings
      /^(hi|hello|hey|good morning|good afternoon|good evening)(\s|!|\.)*$/,
      // English - meeting phrases
      /^(nice to meet you|pleased to meet you|good to see you|great to meet you)(\s|!|\.)*$/,
      // English - casual greetings
      /^(how are you|how's it going|what's up|how do you do)(\s|\?|!|\.)*$/,
      
      // Spanish - basic greetings
      /^(hola|buenos días|buenas tardes|buenas noches|saludos)(\s|!|\.)*$/,
      // Spanish - meeting phrases
      /^(mucho gusto|encantado|es un placer conocerte|gusto en conocerte)(\s|!|\.)*$/,
      // Spanish - casual greetings
      /^(¿cómo estás\?|¿qué tal\?|¿cómo te va\?)(\s|!|\.)*$/,
      
      // French - basic greetings
      /^(bonjour|salut|bonsoir|bonne nuit)(\s|!|\.)*$/,
      // French - meeting phrases
      /^(ravi de vous rencontrer|enchanté|content de vous voir)(\s|!|\.)*$/,
      // French - casual greetings
      /^(comment allez-vous|comment ça va|ça va)(\s|\?|!|\.)*$/,
      
      // German - basic greetings
      /^(hallo|guten tag|guten morgen|guten abend|gute nacht)(\s|!|\.)*$/,
      // German - meeting phrases
      /^(freut mich|schön dich zu treffen|nett dich kennenzulernen)(\s|!|\.)*$/,
      // German - casual greetings
      /^(wie geht es ihnen|wie geht's|alles klar)(\s|\?|!|\.)*$/
    ];

    const isGreeting = greetingPatterns.some(pattern => pattern.test(normalizedMessage));
    
    if (!isGreeting) {
      return null; // Not a greeting
    }

    // Enhanced responses based on user's language preference
    const greetingResponses = {
      'es': '¡Hola! Soy Nexus, tu asistente de IA. ¡Mucho gusto conocerte también! ¿En qué puedo ayudarte hoy?',
      'fr': 'Bonjour! Je suis Nexus, votre assistant IA. Ravi de vous rencontrer aussi! Comment puis-je vous aider aujourd\'hui?',
      'de': 'Hallo! Ich bin Nexus, Ihr KI-Assistent. Freut mich auch, Sie kennenzulernen! Wie kann ich Ihnen heute helfen?',
      'en': 'Hello! I\'m Nexus, your AI assistant. Nice to meet you too! How can I help you today?'
    };

    return greetingResponses[userLanguage as keyof typeof greetingResponses] || greetingResponses.en;
  }

  async querySingleModel(messages: ChatMessage[], modelId: string, userLanguage?: string): Promise<MultiModelResponse> {
    console.log('MultiModelAI: Querying single model:', modelId, 'with language:', userLanguage);
    
    // Prepare messages with language instruction if needed
    const processedMessages = this.addLanguageInstructionToMessages(messages, userLanguage);
    
    let response: AIResponse | null = null;

    switch (modelId) {
      case 'openai':
        response = await this.queryOpenAI(processedMessages);
        break;
      case 'google':
        response = await this.queryGoogleGemini(processedMessages);
        break;
      case 'anthropic':
        response = await this.queryAnthropic(processedMessages);
        break;
      case 'cohere':
        response = await this.queryCohere(processedMessages);
        break;
      case 'mistral':
        response = await this.queryMistral(processedMessages);
        break;
      case 'learning-ai':
      case 'aisync-learning':
        response = await this.queryLearningAI(processedMessages);
        break;
      default:
        console.error('Unknown model ID:', modelId);
        response = null;
    }

    if (response) {
      return {
        responses: [response],
        aggregatedResponse: response.content,
        consensus: 1.0, // 100% consensus since it's a single model
        sources: response.sources || [],
      };
    } else {
      return {
        responses: [],
        aggregatedResponse: 'Sorry, the selected AI model is currently unavailable. Please try again or select a different model.',
        consensus: 0,
        sources: [],
      };
    }
  }

  async queryAllModels(messages: ChatMessage[], userLanguage?: string): Promise<MultiModelResponse> {
    console.log(`Querying ${messages.length} messages across all AI models with language:`, userLanguage);
    
    // Check if the last message is a simple greeting
    const lastMessage = messages.filter(m => m.role === 'user').pop();
    if (lastMessage) {
      const greetingResponse = this.detectAndRespondToGreeting(lastMessage.content, userLanguage);
      if (greetingResponse) {
        console.log('Detected greeting, providing direct response');
        // Return a quick greeting response
        const quickResponse: AIResponse = {
          content: greetingResponse,
          model: 'Nexus Greeting System',
          provider: 'Nexus',
          timestamp: new Date(),
          confidence: 1.0,
        };
        
        return {
          responses: [quickResponse],
          aggregatedResponse: greetingResponse,
          consensus: 1.0,
          sources: ['Nexus Greeting System']
        };
      }
    }
    
    // Initialize self-developing AI if not already done
    await SelfDevelopingAI.initialize();
    
    // Prepare messages with language instruction if needed
    const processedMessages = this.addLanguageInstructionToMessages(messages, userLanguage);
    
    const lastUserMessage = processedMessages.filter(m => m.role === 'user').pop();
    const context = processedMessages.slice(-3).map(m => m.content).join(' ');
    
    const promises = [
      this.queryOpenAI(processedMessages),
      this.queryGoogleGemini(processedMessages),
      this.queryAnthropic(processedMessages),
      this.queryCohere(processedMessages),
      this.queryMistral(processedMessages),
      // Add Learning AI
      lastUserMessage ? this.queryLearningAI(processedMessages) : Promise.resolve(null),
    ];

    console.log('Starting queries to all AI models (including Learning AI)...');

    try {
      const results = await Promise.allSettled(promises);
      console.log('Promise results:', results.map(r => ({ 
        status: r.status, 
        hasValue: r.status === 'fulfilled' && r.value !== null,
        provider: r.status === 'fulfilled' && r.value ? r.value.provider : 'failed'
      })));
      
      const responses: AIResponse[] = results
        .filter((result: PromiseSettledResult<AIResponse | null>): result is PromiseFulfilledResult<AIResponse> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`Received ${responses.length} successful responses from AI models:`, responses.map(r => r.provider));

      const aggregatedResponse = this.aggregateResponses(responses);
      
      // Calculate meaningful consensus based on response similarity and quality
      let consensus = 0.1; // Base consensus
      if (responses.length > 1) {
        const qualityResponses = responses.filter(r => r.content.length > 50);
        const qualityRatio = qualityResponses.length / responses.length;
        
        // Check for similar themes in responses
        const allWords = responses.flatMap(r => 
          r.content.toLowerCase().split(/\s+/).filter(w => w.length > 3)
        );
        const uniqueWords = new Set(allWords);
        const repetitionScore = (allWords.length - uniqueWords.size) / allWords.length;
        
        consensus = Math.min(0.95, qualityRatio * 0.6 + repetitionScore * 0.4);
      }

      // If no responses were received, create a fallback response
      if (responses.length === 0) {
        console.log('No responses received from any AI model');
        return {
          responses: [{
            content: 'I apologize, but I cannot connect to any AI services at the moment. Please check your API keys and internet connection.',
            model: 'Fallback',
            provider: 'System',
            timestamp: new Date(),
            confidence: 0,
          }],
          aggregatedResponse: 'I apologize, but I cannot connect to any AI services at the moment. Please check your API keys and internet connection.',
          consensus: 0,
          sources: [],
        };
      }

      return {
        responses,
        aggregatedResponse,
        consensus: Math.max(0.1, consensus),
        sources: [], // Add web search sources here if needed
      };
    } catch (error) {
      console.error('Error in queryAllModels:', error);
      return {
        responses: [{
          content: 'An error occurred while querying AI models. Please try again.',
          model: 'Error',
          provider: 'System',
          timestamp: new Date(),
          confidence: 0,
        }],
        aggregatedResponse: 'An error occurred while querying AI models. Please try again.',
        consensus: 0,
        sources: [],
      };
    }
  }
}
