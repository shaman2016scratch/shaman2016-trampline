import fetch from 'node-fetch';


export default async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'Missing URL parameter. Example: /other/example.com',
      timestamp: new Date().toISOString()
    });
  }

  try {
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch (e) {
      console.warn('[PROXY] decodeURIComponent failed:', e.message);
    }

    decodedUrl = decodedUrl.replace(/^\/+/, '');
    if (!/^https?:\/\//i.test(decodedUrl)) {
      decodedUrl = 'https://' + decodedUrl;
    }

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.126 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow',
      timeout: 10000
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.statusText}`,
        status: response.status,
        requestedUrl: decodedUrl,
        responsePreview: errorText.slice(0, 200)
      });
    }

    const contentType = response.headers.get('content-type') || '';

    if (/text\/html|text\/css|application\/javascript/i.test(contentType)) {
      const text = await response.text();

      if (text.length === 0) {
        return res.status(204).send();
      }

      const baseDomain = url.split('/')[0].replace(/^https?:\/\//, '');


      const transformLink = (link) => {
        if (link.startsWith('/other/')) {
          return link;
        }
        if (link.startsWith('http://') || link.startsWith('https://')) {
          const cleaned = link.replace(/^(https?:\/\/)/, '');
          return `/other/${cleaned}`;
        }
        if (link.startsWith('/')) {
          return `/other/${baseDomain}${link}`;
        }
        return `/other/${baseDomain}/${link}`;
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
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.set('Content-Type', contentType);
      res.set('Content-Length', buffer.length);
      res.status(200).send(buffer);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
      requestedUrl: url,
      timestamp: new Date().toISOString()
    });
  }
};
