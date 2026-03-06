export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query, limit = 10 } = req.query;
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token is required' });
  }

  try {
    // Use dynamic import for node-fetch if fetch is not available
    const fetchFn = globalThis.fetch || (await import('node-fetch')).default;
    
    const params = new URLSearchParams({
      query: query.trim(),
      sortOn: 'RELEVANCE',
      page: '0',
      size: String(limit)
    });

    const response = await fetchFn(`https://api.ah.nl/mobile-services/product/search/v2?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-application': 'AHWEBSHOP',
        'x-client-name': 'appie-ios',
        'x-client-version': '9.28'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AH Search Proxy] Error response:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Search request failed: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[AH Search Proxy] Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
