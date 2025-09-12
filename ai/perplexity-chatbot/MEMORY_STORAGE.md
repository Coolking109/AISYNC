# AISync Learning AI Memory Storage

## Where Your AI's Memory is Saved

The Learning AI saves all its memory to **MongoDB Atlas Cloud Database** using the following structure:

### 📍 Database Location
- **Service**: MongoDB Atlas (Cloud Database)
- **Connection**: `mongodb+srv://coresystembots_db_user:eXBLikJoEBqJUgcA@cluster0.diplw6a.mongodb.net/perplexity-chatbot`
- **Database Name**: `perplexity-chatbot`

### 🗄️ Memory Storage Collections

#### 1. **Personal Facts** (`personal_facts`)
Stores specific information you teach the AI:
- **Name**: When you say "your name is X" or "my name is Y"
- **Identity**: When you tell it "you are X"
- **Preferences**: When you say "you like X" or "I like Y"
- **Facts**: When you say "remember that X"

**Example stored data:**
```json
{
  "type": "name",
  "value": "Alex",
  "timestamp": "2025-09-11T00:21:56.324Z",
  "id": "fact-1694389316324-abc123"
}
```

#### 2. **Learning Patterns** (`learning_patterns`)
Stores question-answer patterns the AI learns:
- **Question**: Original question asked
- **Answer**: The response given
- **Accuracy**: How accurate the response was (0-1)
- **Usage Count**: How many times this pattern was used
- **Tags**: Keywords for pattern matching

**Example stored data:**
```json
{
  "id": "pattern-1694389316324-xyz789",
  "question": "what is your name",
  "answer": "My name is Alex! 😊",
  "accuracy": 1.0,
  "usageCount": 5,
  "tags": ["name", "personal", "identity"]
}
```

#### 3. **AI Interactions** (`ai_interactions`)
Records every conversation for learning:
- **Question**: What you asked
- **Answer**: What the AI responded
- **Session ID**: Conversation session
- **Timestamp**: When it happened

#### 4. **AI Feedback** (`ai_feedback`)
Stores your ratings and feedback:
- **Feedback Type**: positive, negative, neutral
- **Question**: What was asked
- **Response ID**: Which response was rated

## 🧠 How Memory Works

### Teaching the AI:
1. **Name**: Say "your name is [name]" → AI saves and remembers
2. **Facts**: Say "remember that [fact]" → AI stores the information
3. **Preferences**: Say "you like [thing]" → AI learns its preferences
4. **Your info**: Say "my name is [name]" → AI remembers about you

### Retrieving Memory:
1. **Ask for name**: "what is your name?" → AI recalls saved name
2. **Ask about facts**: AI searches patterns and personal facts
3. **Similar questions**: AI finds patterns from previous conversations
4. **Context aware**: AI considers conversation history

### Memory Persistence:
- ✅ **Permanent**: Stored in cloud database (MongoDB Atlas)
- ✅ **Accessible**: Available across all sessions and restarts
- ✅ **Searchable**: AI can find relevant memories using keywords
- ✅ **Improving**: Gets more accurate with feedback and usage
- ✅ **Secure**: Protected by database authentication

## 🔧 Memory Configuration

Current settings in your `.env.local`:
```bash
# Learning AI is enabled
CUSTOM_AI_LEARNING_ENABLED=true
CUSTOM_AI_MAX_KNOWLEDGE=10000
CUSTOM_AI_CONFIDENCE_THRESHOLD=0.7

# MongoDB connection for memory storage
MONGODB_URI=mongodb+srv://coresystembots_db_user:eXBLikJoEBqJUgcA@cluster0.diplw6a.mongodb.net/perplexity-chatbot
```

## 💡 Usage Examples

### Teaching the AI its name:
**You**: "Your name is Alex"
**AI**: "✅ Got it! I'll remember that my name is Alex. Thank you for telling me!"

### Asking for its name later:
**You**: "What is your name?"
**AI**: "My name is Alex! 😊"

### Teaching facts:
**You**: "Remember that I live in New York"
**AI**: "✅ I've learned and will remember: I live in New York"

### Teaching preferences:
**You**: "You like helping people with coding"
**AI**: "✅ I'll remember that I like helping people with coding. Thanks for telling me about my preferences!"

The AI will remember all of this information permanently and can recall it in future conversations!
