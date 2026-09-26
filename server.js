import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001;

// Security: only allow localhost origins in development
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json({ limit: '1mb' }));

// Sanitize: strip null bytes and limit size
const sanitize = (str) => typeof str === 'string' ? str.replace(/\0/g, '').slice(0, 4000) : '';
const validateMessages = (messages) => {
  if (!Array.isArray(messages)) return false;
  if (messages.length > 50) return false;
  return messages.every(
    (m) => m && typeof m.role === 'string' && typeof m.content === 'string' &&
      ['user', 'assistant', 'system'].includes(m.role) &&
      m.content.length <= 8000
  );
};

const PREFERRED_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b'
];

// Status check
app.get('/api/status', (req, res) => {
  const apiKey = process.env.GROQ_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  const hasServerKey = Boolean(apiKey && apiKey.trim().length > 10);
  res.json({
    status: 'ok',
    hasServerKey,
    defaultModel: 'openai/gpt-oss-120b'
  });
});

// Chat endpoint — SSE streaming for local dev
app.post('/api/chat', async (req, res) => {
  const { messages, temperature = 0.7 } = req.body || {};

  if (!validateMessages(messages)) {
    return res.status(400).json({ error: 'Mensajes inválidos o demasiado largos.' });
  }

  const temp = parseFloat(temperature);
  if (isNaN(temp) || temp < 0 || temp > 2) {
    return res.status(400).json({ error: 'Temperatura inválida.' });
  }

  const serverKey = process.env.GROQ_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  const clientKey = sanitize(req.headers['x-api-key'] || '');
  const apiKey = serverKey?.trim() || clientKey;

  if (!apiKey || apiKey.length < 10) {
    return res.status(401).json({
      error: 'Por favor ingresa tu API Key en Ajustes ⚙️ (Groq, Google Gemini o OpenRouter).'
    });
  }

  const safeMessages = messages.map((m) => ({ role: m.role, content: sanitize(m.content) }));

  let baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  let model = 'gemini-2.0-flash';
  let isGroq = false;

  if (apiKey.startsWith('gsk_')) {
    baseURL = 'https://api.groq.com/openai/v1';
    isGroq = true;
  } else if (apiKey.startsWith('sk-or-')) {
    baseURL = 'https://openrouter.ai/api/v1';
    model = 'openai/gpt-oss-20b';
  } else if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) {
    baseURL = 'https://api.openai.com/v1';
    model = 'gpt-4o-mini';
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: apiKey.startsWith('sk-or-') ? {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Sabiondo AI'
      } : {}
    });

    if (isGroq) {
      let modelQueue = [...PREFERRED_GROQ_MODELS];
      try {
        const list = await openai.models.list();
        const available = new Set(list.data.map(m => m.id));
        const activePreferred = PREFERRED_GROQ_MODELS.filter(m => available.has(m));
        if (activePreferred.length > 0) {
          modelQueue = activePreferred;
        }
      } catch (e) {}

      let stream = null;
      let lastErr = null;
      for (const groqModel of modelQueue) {
        try {
          stream = await openai.chat.completions.create({
            model: groqModel,
            messages: safeMessages,
            temperature: temp,
            stream: true,
            max_tokens: 2048
          });
          break;
        } catch (err) {
          lastErr = err;
          continue;
        }
      }

      if (!stream) {
        throw lastErr || new Error('No Groq models available');
      }

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    const stream = await openai.chat.completions.create({
      model,
      messages: safeMessages,
      temperature: temp,
      stream: true,
      max_tokens: 2048
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
    console.error('Error en API:', error?.status, error?.message);
    const code = error?.status || 500;
    const safeMsg = code === 429 ? 'Límite de solicitudes alcanzado. Espera un momento.' :
                    code === 401 ? 'API Key inválida o sin permisos.' :
                    'Error al comunicarse con la IA.';
    res.write(`data: ${JSON.stringify({ error: safeMsg })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`📡 Backend API de Sabiondo AI activo en http://localhost:${PORT}`);
});

export default app;
