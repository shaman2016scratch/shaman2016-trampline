import fetch from 'node-fetch';

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { path } = req.query;
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      queryParams.append(key, value);
    }
  }

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter.'
    });
  }

  try {
    const basePath = path.replace(/^\//, '');
    const url = `https://api.telegram.org/${basePath}`;
    const finalUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    let response = {}

    if (req.query.useHeaders === true) {
      response = await fetch(finalUrl, {
        method: req.method,
        body: JSON.stringify(req.body)
      })
    } else {
      response = await fetch(finalUrl)
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        response,
        data,
        url,
        body: req.body
      });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      requestedPath: path
    });
  }
};
