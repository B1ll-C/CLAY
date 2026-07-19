import { describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('GET /health', () => {
  it('responds 200 without needing a database connection', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });
});

describe('unregistered route', () => {
  it('falls through to a 404 rather than a raw framework error page', async () => {
    const app = buildApp();

    const response = await app.inject({ method: 'GET', url: '/not-a-real-route' });

    expect(response.statusCode).toBe(404);
  });
});
