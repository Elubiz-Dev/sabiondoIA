import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

export const config = { maxDuration: 30 };

// Preferred models in priority order
const PREFERRED_GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'qwen/qwen3.8-27b'
];

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

// Dynamically select and call the best available Groq model
async function callGroqWithAutoDiscovery(openai, safeMessages, temp) {
  let modelQueue = [...PREFERRED_GROQ_MODELS];

  try {
    const list = await openai.models.list();
    const available = new Set(list.data.map(m => m.id));
    const activePreferred = PREFERRED_GROQ_MODELS.filter(m => available.has(m));
    if (activePreferred.length > 0) {
      modelQueue = activePreferred;
    }
  } catch (e) {
    console.warn('No se pudo listar modelos de Groq dinámicamente, usando cola por defecto.');
  }

  let lastError;
  for (const model of modelQueue) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: safeMessages,
        temperature: temp,
        stream: false,
        max_tokens: 2048
      });
      return { content: completion.choices[0]?.message?.content || '' };
    } catch (err) {
      const msg = err?.error?.message || err?.message || '';
      console.warn(`Modelo Groq ${model} falló:`, msg);
      lastError = err;
      // If it's a rate limit or decommissioning error, try next model
      continue;
    }
  }
  throw lastError || new Error('No se pudo conectar con los modelos de Groq.');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
      error: 'Por favor ingresa tu API Key en Ajustes ⚙️ (Groq, Gemini o OpenRouter).'
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

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL,
      defaultHeaders: apiKey.startsWith('sk-or-') ? {
        'HTTP-Referer': 'https://sabiondoia.vercel.app',
        'X-Title': 'Sabiondo AI'
      } : {}
    });

    if (isGroq) {
      const result = await callGroqWithAutoDiscovery(openai, safeMessages, temp);
      return res.status(200).json(result);
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: safeMessages,
      temperature: temp,
      stream: false,
      max_tokens: 2048
    });

    return res.status(200).json({ content: completion.choices[0]?.message?.content || '' });

  } catch (error) {
    console.error('Error Sabiondo API:', error?.status, error?.message);
    const code = error?.status || 500;
    const safeMsg = code === 429 ? 'Límite de solicitudes alcanzado. Espera un momento.' :
                    code === 401 ? 'API Key inválida o sin permisos.' :
                    code >= 500 ? 'El servicio de IA no está disponible en este momento. Intenta de nuevo.' :
                    (error?.error?.message || error?.message || 'Error al comunicarse con la IA.');
    return res.status(code > 499 ? 502 : code).json({ error: safeMsg });
  }
}
