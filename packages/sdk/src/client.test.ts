import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CraftClient } from './client';
import { CraftApiError } from './errors';
import type { UserProfile } from './types';

describe('CraftClient.request', () => {
  const baseUrl = 'https://api.example.com';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns parsed JSON on a successful response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });
    const result = await client.request<{ ok: boolean }>('/ping');

    expect(result).toEqual({ ok: true });
  });

  it('returns undefined for a 204 No Content response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });
    const result = await client.request('/empty');

    expect(result).toBeUndefined();
  });

  it('throws CraftApiError when a 200 response body is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html><body>Proxy error</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });

    await expect(client.request('/html')).rejects.toBeInstanceOf(CraftApiError);
    await expect(client.request('/html')).rejects.toMatchObject({ status: 200 });
  });

  it('throws CraftApiError on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });

    await expect(client.request('/bad')).rejects.toBeInstanceOf(CraftApiError);
  });
});

describe('CraftClient.listTemplates', () => {
  const baseUrl = 'https://api.example.com';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the plain array shape produced by GET /api/templates', async () => {
    const templates = [
      { id: 'tpl_1', name: 'Welcome', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: 'tpl_2', name: 'Goodbye', createdAt: '2024-01-02T00:00:00.000Z' },
    ];

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(templates), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });
    const result = await client.listTemplates();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual(templates);
  });

  it('does not send limit/offset query parameters the route ignores', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });
    await client.listTemplates();

    const [requestedUrl] = fetchMock.mock.calls[0] as [string];
    const url = new URL(requestedUrl);
    expect(url.pathname).toBe('/api/templates');
    expect(url.searchParams.has('limit')).toBe(false);
    expect(url.searchParams.has('offset')).toBe(false);
  });
});

describe('CraftClient.getUser', () => {
  const baseUrl = 'https://api.example.com';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns createdAt as an ISO 8601 string, not a Date', async () => {
    const createdAt = '2024-01-01T00:00:00.000Z';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'usr_1', createdAt }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const client = new CraftClient({ baseUrl, apiKey: 'test-key' });
    const profile = await client.getUser();

    // Type-level assertion: createdAt must be assignable to string.
    const createdAtValue: string = profile.createdAt;
    expect(typeof createdAtValue).toBe('string');
    expect(profile.createdAt).toBe(createdAt);
    expect(profile.createdAt).not.toBeInstanceOf(Date);
    expect(new Date(profile.createdAt).toISOString()).toBe(createdAt);

    // Guard against the old Date typing: .getTime() must not exist on the value.
    expect((profile as UserProfile).createdAt).not.toHaveProperty('getTime');
  });
});
