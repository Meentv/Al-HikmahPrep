// Serve the self-contained quiz site without a runtime dependency or database.
// Production can also serve site/index.html directly from any static host/CDN.
import { createHash } from 'node:crypto';
import { readFileSync, watchFile } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const file = fileURLToPath(new URL('./site/index.html', import.meta.url));
const port = Number(process.env.PORT || 3000);

function representations() {
  const html = readFileSync(file);
  const policy = html
    .toString('utf8')
    .match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/i)?.[1];
  const version = createHash('sha256').update(html).digest('hex').slice(0, 24);
  const buffers = {
    br: brotliCompressSync(html, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } }),
    gzip: gzipSync(html, { level: 6 }),
    identity: html,
  };
  return Object.entries(buffers).map(([encoding, body]) => ({
    encoding,
    body,
    policy,
    etag: `"${version}-${encoding}"`,
  }));
}

let versions = representations();
watchFile(file, { persistent: false, interval: 750 }, (current, previous) => {
  if (!current.size || (current.mtimeMs === previous.mtimeMs && current.size === previous.size)) return;
  try {
    versions = representations();
  } catch (error) {
    console.error('Could not reload the website:', error.message);
  }
});

function negotiate(header = '') {
  const quality = new Map();
  for (const part of header.toLowerCase().split(',')) {
    const [encoding, ...parameters] = part.trim().split(';');
    if (!encoding) continue;
    const weight = parameters.find((value) => value.trim().startsWith('q='));
    const parsed = weight ? Number(weight.trim().slice(2)) : 1;
    quality.set(encoding, Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0);
  }
  const score = (encoding) =>
    quality.get(encoding) ??
    (encoding === 'identity' ? (quality.get('*') === 0 ? 0 : 1) : (quality.get('*') ?? 0));
  let best = null;
  let highest = 0;
  for (const candidate of versions) {
    const q = score(candidate.encoding);
    if (q > highest) {
      highest = q;
      best = candidate;
    }
  }
  return best;
}

const defensiveHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

// Arena frames this preview. Production _headers opt out of framing.
const server = createServer(
  { keepAliveTimeout: 8_000, headersTimeout: 15_000, requestTimeout: 30_000 },
  (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { ...defensiveHeaders, Allow: 'GET, HEAD' }).end();
      return;
    }
    const path = (request.url || '/').split('?', 1)[0];
    if (path !== '/' && path !== '/index.html') {
      response
        .writeHead(404, { ...defensiveHeaders, 'Content-Type': 'text/plain; charset=utf-8' })
        .end('Not found');
      return;
    }
    const version = negotiate(request.headers['accept-encoding']);
    if (!version) {
      response.writeHead(406, { ...defensiveHeaders, Vary: 'Accept-Encoding' }).end();
      return;
    }
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      ...defensiveHeaders,
      ...(version.policy ? { 'Content-Security-Policy': version.policy } : {}),
      ETag: version.etag,
      Vary: 'Accept-Encoding',
      ...(version.encoding === 'identity' ? {} : { 'Content-Encoding': version.encoding }),
    };
    const validators = (request.headers['if-none-match'] || '')
      .split(',')
      .map((value) => value.trim().replace(/^W\//, ''));
    if (validators.includes('*') || validators.includes(version.etag)) {
      response.writeHead(304, headers).end();
      return;
    }
    response.writeHead(200, { ...headers, 'Content-Length': version.body.length });
    response.end(request.method === 'HEAD' ? undefined : version.body);
  }
);

server.listen({ port, host: '0.0.0.0', backlog: 4096 }, () => {
  console.log(
    `HikmahPrep is ready on port ${port}. Serving cached HTML (${versions[2].body.length} bytes, ${versions[0].body.length} bytes with Brotli).`
  );
});
