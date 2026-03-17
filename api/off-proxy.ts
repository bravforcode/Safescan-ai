export const config = {
  runtime: 'edge',
};

const DOMAINS: Record<string, string> = {
  'world': 'https://world.openfoodfacts.org',
  'th': 'https://th.openfoodfacts.org',
  'beauty': 'https://world.openbeautyfacts.org',
  'pet': 'https://world.openpetfoodfacts.org',
};

export default async (request: Request) => {
  const url = new URL(request.url);
  const domain = url.searchParams.get('domain') || 'world';
  const path = url.pathname.replace('/api/off-proxy', '');
  const baseUrl = DOMAINS[domain] || DOMAINS['world'];

  // Remove domain param from query string
  const searchParams = new URLSearchParams(url.search);
  searchParams.delete('domain');
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';

  const offUrl = `${baseUrl}${path}${search}`;

  try {
    const response = await fetch(offUrl, {
      headers: { 'User-Agent': 'SafeScanAI/1.0' },
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy request failed' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
};
