// Local demo server. Serves demo/index.html and exposes the library over a small JSON API,
// so the page renders from getBankFields and validates with the same code a real server would use.
// Run with `npm run demo`, then open http://localhost:3000.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getBankFields,
  getConfiguredCountries,
  getCountryConfig,
  isCountrySupported,
  isXeroSyncable,
  maskBankDetails,
  validateBankDetails,
} from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3000);

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

const readJson = async (req) => {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/') {
      return send(res, 200, await readFile(join(here, 'index.html'), 'utf8'), 'text/html; charset=utf-8');
    }

    if (url.pathname === '/api/countries') {
      const countries = getConfiguredCountries().map((code) => ({
        code,
        name: getCountryConfig(code).name,
      }));
      countries.sort((a, b) => a.name.localeCompare(b.name));
      return send(res, 200, countries);
    }

    const match = url.pathname.match(/^\/api\/fields\/([A-Za-z]{2})$/);
    if (match) {
      const code = match[1].toUpperCase();
      const config = getCountryConfig(code);
      return send(res, 200, {
        country: code,
        name: config.name,
        supported: isCountrySupported(code),
        xeroSyncable: isXeroSyncable(code),
        // RegExp does not survive JSON, so send the source for display.
        fields: getBankFields(code).map((f) => ({ ...f, pattern: f.pattern?.source })),
      });
    }

    const validate = url.pathname.match(/^\/api\/validate\/([A-Za-z]{2})$/);
    if (validate && req.method === 'POST') {
      const code = validate[1].toUpperCase();
      const result = validateBankDetails(code, await readJson(req));
      return send(res, 200, { ...result, masked: result.valid ? maskBankDetails(code, result.normalised) : {} });
    }

    send(res, 404, { error: 'Not found' });
  } catch (err) {
    send(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Bank fields demo running at http://localhost:${port}`);
});
