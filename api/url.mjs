import fetch from 'node-fetch';

export default async (req, res) => {
  const { url } = req.query;
  console.log('[PROXY] Request received', { url });

  if (!url) {
    console.log('[PROXY] Missing URL parameter');
    return res.status(400).json({
      error: 'Missing URL parameter. Example: /other/example.com',
      timestamp: new Date().toISOString()
    });
  }

  try {
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
      console.log('[PROXY] URL decoded:', decodedUrl);
    } catch (e) {
      console.warn('[PROXY] decodeURIComponent failed:', e.message);
    }

    decodedUrl = decodedUrl.replace(/^\/+/, '');
    if (!/^https?:\/\//i.test(decodedUrl)) {
      decodedUrl = 'https://' + decodedUrl;
    }
    console.log('[PROXY] Final request URL:', decodedUrl);

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      timeout: 10000
    });

    console.log('[PROXY] Fetch response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PROXY] Fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.slice(0, 500)
      });
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.statusText}`,
        status: response.status,
        requestedUrl: decodedUrl,
        responsePreview: errorText.slice(0, 200)
      });
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('[PROXY] Content-Type:', contentType);

    if (/text\/html|text\/css|application\/javascript/i.test(contentType)) {
      const text = await response.text();
      console.log('[PROXY] Response length:', text.length);

      if (text.length === 0) {
        console.warn('[PROXY] Empty response body');
        return res.status(204).send();
      }

      const baseDomain = url.split('/')[0];

      const transformLink = (link) => {
        if (link.startsWith('http://') || link.startsWith('https://')) {
          return `/other/${link.replace(/^(https?:\/\/)/, '')}`;
        } else if (link.startsWith('/')) {
          return `/other/${baseDomain}${link}`;
        } else {
          return `/other/${url}/${link}`;
        }
      };

      const modifiedText = text
        .replace(/(src=")([^"]+)/gi, (match, p1, p2) => `${p1}${transformLink(p2)}`)
        .replace(/(href=")([^"]+)/gi, (match, p1, p2) => `${p1}${transformLink(p2)}`)
        .replace(/(')([^']+)/gi, (match, p1, p2) => {
          if (p2.match(/^(src|href)="/)) return match;
          return `${p1}${transformLink(p2)}`;
        })
        .replace(/(")([^"]+)/gi, (match, p1, p2) => {
          if (p2.match(/^(src|href)="/)) return match;
          return `${p1}${transformLink(p2)}`;
        });

      response.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (!lowerKey.startsWith('access-control-') &&
            lowerKey !== 'content-encoding' &&
            lowerKey !== 'transfer-encoding') {
          res.setHeader(key, value);
        }
      });

      res.status(200).send(modifiedText);
      console.log('[PROXY] Successfully sent modified response');
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set('Content-Type', contentType);
      res.set('Content-Length', buffer.length);
      res.status(200).send(buffer);
      console.log('[PROXY] Sent binary response:', { size: buffer.length, type: contentType });
    }
  } catch (error) {
    console.error('[PROXY] Unexpected error:', error.message, error.stack);
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
      requestedUrl: url,
      timestamp: new Date().toISOString()
    });
  }
};
