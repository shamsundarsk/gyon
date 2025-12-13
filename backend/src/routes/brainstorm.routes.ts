import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as ollamaClient from '../modules/idea-generator/ollamaClient';

const router = Router();

// In-memory storage for brainstorm rooms (in production, use Redis or database)
interface BrainstormRoom {
  id: string;
  code: string;
  createdAt: Date;
  participants: string[];
  messages: Array<{
    id: string;
    type: 'user' | 'ai' | 'system';
    content: string;
    timestamp: Date;
    sender?: string;
  }>;
}

const brainstormRooms = new Map<string, BrainstormRoom>();

/**
 * @route POST /api/brainstorm/create
 * @desc Create a new brainstorm room
 */
router.post('/create', (req: Request, res: Response) => {
  try {
    // Generate a 6-character room code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const room: BrainstormRoom = {
      id: uuidv4(),
      code,
      createdAt: new Date(),
      participants: [],
      messages: [
        {
          id: uuidv4(),
          type: 'system',
          content: `Welcome to Brainstorm Room ${code}! This is your collaborative space for AI-powered project planning and API discovery.`,
          timestamp: new Date()
        }
      ]
    };

    brainstormRooms.set(code, room);

    res.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating brainstorm room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create brainstorm room'
    });
  }
});

/**
 * @route POST /api/brainstorm/join
 * @desc Join an existing brainstorm room
 */
router.post('/join', (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Room code is required'
      });
    }

    const room = brainstormRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        createdAt: room.createdAt,
        participantCount: room.participants.length
      }
    });
  } catch (error) {
    console.error('Error joining brainstorm room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join brainstorm room'
    });
  }
});

/**
 * @route GET /api/brainstorm/:code/messages
 * @desc Get messages from a brainstorm room
 */
router.get('/:code/messages', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = brainstormRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    res.json({
      success: true,
      messages: room.messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

/**
 * @route POST /api/brainstorm/:code/message
 * @desc Send a message to a brainstorm room
 */
router.post('/:code/message', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { content, sender } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    const room = brainstormRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const message = {
      id: uuidv4(),
      type: 'user' as const,
      content,
      timestamp: new Date(),
      sender: sender || 'Anonymous'
    };

    room.messages.push(message);

    // Generate AI response using Ollama
    const isOllamaAvailable = await ollamaClient.isAvailable();
    let aiResponse: string;
    
    if (isOllamaAvailable) {
      aiResponse = await generateOllamaResponse(content, room.messages);
    } else {
      aiResponse = "**AI Assistant Unavailable**\n\nOllama is not currently running. Please start Ollama to enable AI assistance:\n```bash\nollama serve\n```\n\nIn the meantime, I can still help you organize your thoughts and collaborate with your team!";
    }

    const aiMessage = {
      id: uuidv4(),
      type: 'ai' as const,
      content: aiResponse,
      timestamp: new Date()
    };

    room.messages.push(aiMessage);

    res.json({
      success: true,
      messages: [message, aiMessage]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

/**
 * Generate AI response using Ollama with context from conversation history
 */
async function generateOllamaResponse(userMessage: string, messageHistory: any[]): Promise<string> {
  try {
    // Build context from recent messages (last 10 messages)
    const recentMessages = messageHistory.slice(-10);
    let conversationContext = '';
    
    for (const msg of recentMessages) {
      if (msg.type === 'user') {
        conversationContext += `User: ${msg.content}\n`;
      } else if (msg.type === 'ai') {
        conversationContext += `Assistant: ${msg.content}\n`;
      }
    }

    const systemPrompt = `You are an AI assistant for Gyon, a powerful API mashup and project scaffolding platform. You help developers with:

**Core Capabilities:**
- Project architecture and planning
- API integration strategies (120+ APIs available including Indian Government APIs)
- Technology stack recommendations
- Team collaboration best practices
- Code structure and best practices

**Available APIs in Gyon Registry:**
- Indian Government APIs: Aadhaar, PAN, GSTIN, EPFO, DigiLocker, etc.
- Payment APIs: Stripe, Razorpay, PayPal
- Communication: Twilio, SendGrid, Slack
- Cloud Services: AWS, Google Cloud, Azure
- Social Media: Twitter, Facebook, Instagram
- And 100+ more APIs

**Response Guidelines:**
- Be practical and actionable
- Provide specific code examples when relevant
- Suggest appropriate APIs from the Gyon registry
- Focus on modern development practices
- Keep responses concise but comprehensive
- Use markdown formatting for better readability

**Current Conversation Context:**
${conversationContext}

**User's Current Question:**
${userMessage}

Provide a helpful, specific response that addresses their question while leveraging Gyon's capabilities.`;

    const response = await ollamaClient.generate(systemPrompt, {
      model: process.env.OLLAMA_MODEL || 'llama3:latest',
      temperature: 0.7,
      max_tokens: 1000
    });

    return response;
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('404')) {
        return `**AI Model Not Found**

The AI model 'llama3:latest' was not found. Available models can be checked with:
\`\`\`bash
ollama list
\`\`\`

Please ensure you have the correct model installed:
\`\`\`bash
ollama pull llama3:latest
\`\`\`

In the meantime, I can still help you organize your brainstorming session!`;
      }
      
      if (error.message.includes('ECONNREFUSED')) {
        return `**Ollama Not Running**

Ollama service is not running. Please start it with:
\`\`\`bash
ollama serve
\`\`\`

Once Ollama is running, I'll be able to provide AI-powered assistance for your brainstorming session!`;
      }
    }
    
    return `**AI Assistant Temporarily Unavailable**

I'm having trouble connecting to the AI service right now. Here's some general guidance:

**For project planning and API integration:**
- Consider using Gyon's 120+ API registry including Indian Government APIs
- Plan your architecture with scalability in mind
- Use modern frameworks like React/Next.js for frontend
- Implement proper authentication and error handling

**Available Resources:**
- Aadhaar, PAN, GSTIN APIs for Indian applications
- Payment integration with Stripe/Razorpay
- Communication APIs for notifications
- Cloud deployment options

Please try your question again in a moment!`;
  }
}

/**
 * @route GET /api/brainstorm/test-ai
 * @desc Test Ollama connectivity
 */
router.get('/test-ai', async (req: Request, res: Response) => {
  try {
    const isAvailable = await ollamaClient.isAvailable();
    
    if (!isAvailable) {
      return res.json({
        success: false,
        error: 'Ollama is not running',
        message: 'Please start Ollama with: ollama serve'
      });
    }

    const testResponse = await ollamaClient.generate('Say "AI is working!" in a friendly way.', {
      model: process.env.OLLAMA_MODEL || 'llama3:latest',
      temperature: 0.7,
      max_tokens: 50
    });

    res.json({
      success: true,
      message: 'Ollama is working correctly',
      testResponse
    });
  } catch (error) {
    console.error('AI test error:', error);
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Ollama test failed'
    });
  }
});

/**
 * @route GET /api/brainstorm/share/:code
 * @desc Get shareable room information
 */
router.get('/share/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = brainstormRooms.get(code.toUpperCase());

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Return room info for sharing
    res.json({
      success: true,
      room: {
        code: room.code,
        createdAt: room.createdAt,
        participantCount: room.participants.length,
        messageCount: room.messages.length,
        shareUrl: `${req.protocol}://${req.get('host')}/brainstorm/${room.code}`
      }
    });
  } catch (error) {
    console.error('Error getting shareable room info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room information'
    });
  }
});

export default router;