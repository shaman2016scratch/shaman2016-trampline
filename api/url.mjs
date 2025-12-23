import fetch from 'node-fetch';


export default async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      error: 'Missing URL parameter. Example: /other/https://example.com'
    });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch: ${response.statusText}`,
        status: response.status,
        requestedUrl: decodedUrl
      });
    }

    const text = await response.text();
    const proxyBase = 'https://shaman2016-trampline/url/';
    const modifiedText = text
      .replace(/(src=")(https?:\/\/[^"]+)/gi, `$1${proxyBase}$2`)
      .replace(/(href=")(https?:\/\/[^"]+)/gi, `$1${proxyBase}$2`)
      .replace(/(')(https?:\/\/[^']+)/gi, `$1${proxyBase}$2`)
      .replace(/(")(https?:\/\/[^"]+)/gi, `$1${proxyBase}$2`);


    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'access-control-allow-origin') {
        res.setHeader(key, value);
      }
    });

    res.status(200).send(modifiedText);
  } catch (error) {
    res.status(500).json({
      error: 'Proxy error',
      details: error.message,
      requestedUrl: url
    });
  }
};
