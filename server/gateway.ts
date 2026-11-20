import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ModelChoice, MarkType, ModelAvailability } from '../types';
import { getSystemInstruction, textPrompt } from './prompt';

type Environment = Record<string, string | undefined>;
type RequestWithBody = IncomingMessage & { body?: unknown };

const CONFIG: Record<ModelChoice, { id: string }> = {
  gemini: { id: 'gemini/gemini-2.5-flash' },
  claude: { id: 'kiro/claude-sonnet-4.5-high' },
  deepseek: { id: 'dva/deepseek-v4-flash-high' },
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(body));
}

function gatewayConfig(env: Environment) {
  const raw = env.AI_GATEWAY_URL?.trim() || env.GATEWAY_BASE_URL?.trim();
  const key = env.AI_GATEWAY_API_KEY?.trim() || env.OMNIROUTE_API_KEY?.trim();
  if (!raw || !key) {
    throw new Error('AI gateway is not configured. Set AI_GATEWAY_URL and AI_GATEWAY_API_KEY on your server.');
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('AI_GATEWAY_URL must be a valid URL ending in /v1.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('AI_GATEWAY_URL must use HTTP or HTTPS.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('AI_GATEWAY_URL must not contain credentials, query parameters or fragments.');
  }
  if (!/\/(v1)\/?$/.test(url.pathname)) {
    throw new Error('AI_GATEWAY_URL must end in /v1, not /chat/completions.');
  }
  if (env.NODE_ENV === 'production' && url.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('Use an HTTPS gateway URL in production to protect the API key.');
  }
  return { base: url.href.replace(/\/$/, ''), key };
}

function modelIds(env: Environment): Record<ModelChoice, string> {
  return {
    gemini: env.AI_MODEL_GEMINI?.trim() || CONFIG.gemini.id,
    claude: env.AI_MODEL_CLAUDE?.trim() || CONFIG.claude.id,
    deepseek: env.AI_MODEL_DEEPSEEK?.trim() || CONFIG.deepseek.id,
  };
}

function parseGatewayError(body: unknown, status: number) {
  const raw = typeof body === 'object' && body !== null ? body as Record<string, any> : {};
  const message = typeof raw.error?.message === 'string' ? raw.error.message :
    typeof raw.message === 'string' ? raw.message : `The gateway returned HTTP ${status}.`;
  // Never send raw gateway response objects or accidental secret tokens to browsers.
  return message.slice(0, 500).replace(/sk-[\w-]{12,}/gi, '[redacted]');
}

async function readJSON(req: RequestWithBody): Promise<any> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    return req.body;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 12 * 1024 * 1024) throw new Error('Image upload is too large (12 MB limit).');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function validImage(input: unknown): input is string {
  return typeof input === 'string' && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(input) && input.length < 5 * 1024 * 1024;
}

function parseContent(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n');
  return '';
}

async function checkModels(res: ServerResponse, env: Environment) {
  const { base, key } = gatewayConfig(env);
  const ids = modelIds(env);
  let availability: Record<ModelChoice, ModelAvailability> = { gemini: 'unknown', claude: 'unknown', deepseek: 'unknown' };
  try {
    const response = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const models = await response.json() as { data?: Array<{ id?: string }> };
      if (Array.isArray(models.data)) {
        const available = new Set(models.data.map(item => item?.id).filter(Boolean));
        availability = {
          gemini: available.has(ids.gemini) ? 'available' : 'not-listed',
          claude: available.has(ids.claude) ? 'available' : 'not-listed',
          deepseek: available.has(ids.deepseek) ? 'available' : 'not-listed',
        };
      }
    }
  } catch {
    // Model listings are optional on some OpenAI-compatible gateways.
    // An unverified listing must not be mistaken for an unavailable model.
  }
  json(res, 200, { availability });
}

export async function handleGatewayRequest(req: RequestWithBody, res: ServerResponse, env: Environment = process.env) {
  try {
    if (req.method === 'GET') return await checkModels(res, env);
    if (req.method !== 'POST') return json(res, 405, { error: 'Only GET and POST are supported.' });

    const { base, key } = gatewayConfig(env);
    let payload: any;
    try {
      payload = await readJSON(req);
    } catch {
      return json(res, 400, { error: 'Invalid or oversized JSON upload.' });
    }
    const model: unknown = payload?.model;
    const marks: unknown = payload?.marks;
    const images: unknown = payload?.images;
    if (typeof model !== 'string' || !Object.prototype.hasOwnProperty.call(CONFIG, model)) {
      return json(res, 400, { error: 'Choose one of the three supported AI models.' });
    }
    if (![1, 2, 3, 4].includes(marks as number)) {
      return json(res, 400, { error: 'Marks must be 1, 2, 3 or 4.' });
    }
    if (!Array.isArray(images) || images.length < 1 || images.length > 10 || !images.every(validImage)) {
      return json(res, 400, { error: 'Upload 1–10 JPEG, PNG, WebP or GIF images smaller than 5 MB each.' });
    }
    const selected = model as ModelChoice;
    const ids = modelIds(env);
    const messages = [
      { role: 'system', content: getSystemInstruction(marks as MarkType) },
      { role: 'user', content: [
        { type: 'text', text: textPrompt },
        ...images.map(img => ({ type: 'image_url', image_url: { url: img } })),
      ] },
    ];

    const upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ids[selected], messages, temperature: 0.1, max_tokens: 8192, stream: false }),
      signal: AbortSignal.timeout(115000),
    });
    let result: any;
    try {
      result = await upstream.json();
    } catch {
      return json(res, 502, { error: 'Gateway returned an unreadable response.' });
    }
    if (!upstream.ok) {
      return json(res, 502, { error: `${ids[selected]}: ${parseGatewayError(result, upstream.status)}` });
    }
    if (result?.choices?.[0]?.finish_reason === 'length') {
      return json(res, 502, { error: 'The model reached its output-token limit. Try fewer images/questions.' });
    }
    const text = parseContent(result);
    if (!text.trim()) return json(res, 502, { error: `Gateway returned an empty answer for ${ids[selected]}.` });
    return json(res, 200, { text });
  } catch (error: any) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      return json(res, 504, { error: 'Gateway request timed out. Try fewer questions or another model.' });
    }
    const message = error?.message || 'Unexpected gateway error.';
    return json(res, message.startsWith('AI gateway is not configured') || message.startsWith('AI_GATEWAY_URL') || message.startsWith('Use an HTTPS gateway') ? 503 : 502, { error: message });
  }
}
