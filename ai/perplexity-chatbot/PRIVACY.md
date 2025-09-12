# Privacy Protection in AISync

## Data Protection Measures

This chatbot implements several privacy protection measures to prevent your conversations from being used to train AI models:

### API Provider Privacy Settings

#### OpenAI (GPT)
- **User ID**: Each request includes a unique user identifier prefixed with "no-training-" to signal privacy intent
- **Data Usage**: OpenAI's API terms generally don't use API data for training, but we add extra precautions

#### Google Gemini
- **Safety Settings**: Configured with harm category blocks to prevent inappropriate content
- **Generation Config**: Custom temperature and token limits for consistent behavior
- **No Training**: Google Gemini API data is not used for model training by default

#### Anthropic Claude
- **Metadata**: Each request includes metadata with a "no-training" user ID
- **Privacy First**: Anthropic has strong privacy commitments and doesn't use API data for training

#### Cohere
- **User ID**: Unique "no-training" user identifiers for each request
- **Privacy Headers**: Custom headers indicating private usage
- **Opt-out**: Explicit user identification to prevent training data collection

#### Mistral
- **User Parameter**: Unique user identifiers to prevent training usage
- **Privacy Headers**: Custom client identification headers
- **Data Protection**: Additional privacy signals in API requests

### Local Data Storage

- **Sessions**: Chat sessions are stored locally in your browser's localStorage
- **No Server Storage**: Conversations are not permanently stored on any server
- **Client-Side Only**: All session management happens in your browser

### Recommendations

1. **API Keys**: Keep your API keys secure and don't share them
2. **Sensitive Data**: Avoid sharing personally identifiable information in chats
3. **Regular Cleanup**: Clear your browser's localStorage periodically to remove old sessions
4. **Monitor Usage**: Check your API provider dashboards for usage patterns

### Provider Privacy Policies

For the most up-to-date information on data usage policies, please review:

- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Google AI Privacy Policy](https://ai.google.dev/terms)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Cohere Privacy Policy](https://cohere.com/privacy)
- [Mistral Privacy Policy](https://mistral.ai/privacy-policy)

### Technical Implementation

The privacy protections are implemented in `src/lib/multi-model-ai.ts` with:
- Unique user identifiers for each session
- Privacy-focused headers and metadata
- No persistent server-side storage
- Client-side session management only

**Note**: While these measures provide additional privacy protection, please review each AI provider's terms of service and privacy policy for their official data usage policies.
