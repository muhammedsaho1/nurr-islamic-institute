// Cloudflare Pages Function: serves every /api/* request.
// Adapter only: the real API stays in netlify/functions/api.js, unchanged.
import { handler } from '../../netlify/functions/api.js';

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Netlify-style headers object (lowercase keys)
  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  // api.js reads the client IP (login throttling) from x-forwarded-for
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers['x-forwarded-for'] = ip;

  const queryStringParameters = {};
  url.searchParams.forEach((v, k) => { queryStringParameters[k] = v; });

  const method = request.method.toUpperCase();
  const body = (method === 'GET' || method === 'HEAD') ? '' : await request.text();

  const result = await handler({
    httpMethod: method,
    path: url.pathname,
    headers,
    queryStringParameters,
    body,
    isBase64Encoded: false,
  });

  const res = result || { statusCode: 500, body: '' };
  const status = res.statusCode || 200;
  const noBody = status === 204 || status === 304;
  return new Response(noBody ? null : (res.body == null ? '' : String(res.body)), {
    status,
    headers: res.headers || {},
  });
}
