// OpenAI Wrapper for Next.js compatibility
export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: any) => Promise<any>;
    };
  };
}

let OpenAI: any;

try {
  // Try to import the main OpenAI SDK
  const OpenAIModule = require('openai');
  OpenAI = OpenAIModule.default || OpenAIModule;
  
  // Test if we can create an instance
  if (process.env.OPENAI_API_KEY) {
    const testClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI SDK loaded successfully');
  }
} catch (error) {
  console.warn('OpenAI SDK import failed, using axios fallback:', error);
  
  // Fallback to direct API calls using axios
  const axios = require('axios');
  
  OpenAI = class OpenAIFallback implements OpenAIClient {
    private apiKey: string;
    private baseURL: string = 'https://api.openai.com/v1';
    
    constructor(config: { apiKey: string }) {
      this.apiKey = config.apiKey;
    }
    
    get chat() {
      return {
        completions: {
          create: async (params: any) => {
            try {
              const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                params,
                {
                  headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              return response.data;
            } catch (error: any) {
              if (error.response) {
                throw new Error(`OpenAI API Error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
              }
              throw error;
            }
          }
        }
      };
    }
  };
}

export default OpenAI;
