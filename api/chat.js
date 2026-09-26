import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, temperature = 0.7 } = req.body;

  const clientKey = req.headers['x-api-key'];
  const serverKey = process.env.GROQ_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  const apiKey = (clientKey && clientKey.trim()) ? clientKey.trim() : (serverKey && serverKey.trim() ? serverKey.trim() : '');

  if (!apiKey || apiKey.length < 5) {
    return res.status(401).json({
      error: 'Por favor ingresa tu API Key en Ajustes ⚙️'
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'La lista de mensajes es requerida.' });
  }

  let baseURL = 'https://generativelanguage.googleapis.com/v1beta/openai/';
  let model = 'gemini-2.0-flash';

  if (apiKey.startsWith('gsk_')) {
    baseURL = 'https://api.groq.com/openai/v1';
    model = process.env.DEFAULT_MODEL || 'llama-3.3-70b-versatile';
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

    // Non-streaming response for Vercel serverless compatibility
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: Number(temperature),
      stream: false
    });

    const content = completion.choices[0]?.message?.content || '';
    return res.status(200).json({ content });

  } catch (error) {
    console.error('Error en API:', error);
    const errorMessage = error?.error?.message || error.message || 'Error al comunicarse con la IA.';
    return res.status(500).json({ error: errorMessage });
  }
}
