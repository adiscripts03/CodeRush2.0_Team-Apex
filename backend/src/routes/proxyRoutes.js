import express from 'express';
import { env } from '../config/env.js';

const router = express.Router();

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const forwardTextResponse = async (upstreamResponse, res) => {
  const contentType = upstreamResponse.headers.get('content-type');
  if (contentType) {
    res.set('content-type', contentType);
  }

  res.status(upstreamResponse.status);
  res.send(await upstreamResponse.text());
};

router.post('/overpass', async (req, res, next) => {
  try {
    const query = req.body?.query || req.query.data;

    if (!query) {
      return res.status(400).json({ success: false, error: 'Missing Overpass query.' });
    }

    const upstreamResponse = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    return forwardTextResponse(upstreamResponse, res);
  } catch (error) {
    return next(error);
  }
});

router.all('/supabase/*', async (req, res, next) => {
  try {
    if (!env.supabaseProjectId || !env.supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase proxy is missing SUPABASE_PROJECT_ID or SUPABASE_ANON_KEY.',
      });
    }

    const supabaseBase = `https://${env.supabaseProjectId}.supabase.co/functions/v1/${env.supabaseFunctionName}`;
    const suffix = req.originalUrl.replace(/^\/api\/proxy\/supabase/, '');
    const targetUrl = `${supabaseBase}${suffix}`;
    const hasBody = !['GET', 'HEAD'].includes(req.method.toUpperCase());

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.supabaseAnonKey}`,
      },
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });

    return forwardTextResponse(upstreamResponse, res);
  } catch (error) {
    return next(error);
  }
});

export default router;