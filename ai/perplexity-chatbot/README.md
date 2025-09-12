# AISync

An advanced AI chat platform that queries multiple AI models simultaneously and aggregates their responses for comprehensive answers.

## Features

- **Multi-Model Integration**: Queries OpenAI GPT-4, Google Gemini, Anthropic Claude, and Cohere simultaneously
- **Response Aggregation**: Combines responses from multiple models for better accuracy
- **Real-time Chat Interface**: Modern, responsive UI for seamless AI interactions
- **Source Attribution**: Shows sources and references when available
- **Consensus Scoring**: Displays consensus level between different AI models
- **Individual Model Responses**: View responses from each model separately

## Supported AI Models

- **OpenAI**: GPT-4 Turbo
- **Google**: Gemini Pro
- **Anthropic**: Claude 3 Sonnet
- **Cohere**: Command Model
- **Extensible**: Easy to add more AI providers

## Setup Instructions

### 1. Install Dependencies

```bash
cd perplexity-chatbot
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your API keys:

```env
# Required: Add your API keys here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# Optional: Add more AI service keys
MISTRAL_API_KEY=your_mistral_api_key_here
```

### 3. Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key

#### Google AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Create a new project or use existing one
3. Generate an API key for Gemini

#### Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up for access
3. Generate an API key

#### Cohere API Key
1. Go to [Cohere Dashboard](https://dashboard.cohere.ai/)
2. Sign up for an account
3. Generate an API key

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/chat/
│   │   └── route.ts          # API endpoint for chat
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page
├── components/
│   ├── ChatInterface.tsx     # Main chat interface
│   └── ChatMessage.tsx       # Message component
└── lib/
    ├── multi-model-ai.ts     # AI model integration
    └── types.ts              # TypeScript types
```

## How It Works

1. **User Input**: User types a question in the chat interface
2. **Multi-Model Query**: The system simultaneously sends the question to all configured AI models
3. **Response Collection**: Collects responses from all available models
4. **Aggregation**: Uses intelligent aggregation to combine responses
5. **Display**: Shows the aggregated response plus individual model responses
6. **Consensus**: Calculates and displays consensus level between models

## Customization

### Adding New AI Models

1. Add the new model configuration to `src/lib/multi-model-ai.ts`
2. Implement the query method for the new provider
3. Add it to the `queryAllModels` method
4. Update environment variables as needed

### Styling

The app uses Tailwind CSS with a custom color scheme:
- Primary: `#1a1a1a` (dark background)
- Secondary: `#2a2a2a` (secondary background)
- Accent: `#00d4aa` (teal accent color)
- Text: `#ffffff` (white text)
- Text Secondary: `#a0a0a0` (gray text)

## API Endpoints

### POST /api/chat

Sends a message to all AI models and returns aggregated response.

**Request Body:**
```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "Your question here",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Response:**
```json
{
  "responses": [
    {
      "content": "Response from model",
      "model": "GPT-4 Turbo",
      "provider": "OpenAI",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "tokensUsed": 150,
      "confidence": 0.9
    }
  ],
  "aggregatedResponse": "Combined response from all models",
  "consensus": 0.85,
  "sources": []
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## Roadmap

- [ ] Add web search integration
- [ ] Implement response caching
- [ ] Add conversation memory
- [ ] Support for image inputs
- [ ] Real-time streaming responses
- [ ] Custom model weights for aggregation
- [ ] Export chat history
- [ ] API rate limiting and usage tracking
