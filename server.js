import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Status check
app.get('/api/status', (req, res) => {
  const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  const hasServerKey = Boolean(apiKey && apiKey.trim().length > 5);
  res.json({
    status: 'ok',
    hasServerKey,
    defaultModel: process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile'
  });
});

// Chat streaming endpoint
app.post('/api/chat', async (req, res) => {
  const { messages, temperature = 0.7, model: requestedModel } = req.body;

  const clientKey = req.headers['x-api-key'];
  const serverKey = process.env.GROQ_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  const apiKey = (clientKey && clientKey.trim()) ? clientKey.trim() : (serverKey && serverKey.trim() ? serverKey.trim() : '');

  if (!apiKey || apiKey.length < 5) {
    return res.status(401).json({
      error: 'Por favor ingresa tu API Key en Ajustes ⚙️ (Groq, Google Gemini o OpenRouter).'
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'La lista de mensajes es requerida.' });
  }

  // Detect provider baseURL & model
  let baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  let model = requestedModel || 'gemini-2.0-flash';

  if (apiKey.startsWith('gsk_')) {
    baseURL = 'https://api.groq.com/openai/v1';
    model = requestedModel || process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';
  } else if (apiKey.startsWith('sk-or-')) {
    baseURL = 'https://openrouter.ai/api/v1';
    model = requestedModel || 'openai/gpt-oss-20b';
  } else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) {
    baseURL = 'https://api.openai.com/v1';
    model = requestedModel || 'gpt-4o-mini';
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: apiKey.startsWith('sk-or-') ? {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sabiondo AI'
      } : {}
    });

    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: Number(temperature),
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Error en API:', error);
    const errorMessage = error?.error?.message || error.message || 'Error al comunicarse con la IA.';
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// Run server if started directly
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`📡 Backend API de Sabiondo AI activo en http://localhost:${PORT}`);
  });
}

export default app;
