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

    const response = await fetch(finalUrl);

    if (!response.ok) {
      return res.status(response.status).blob(response);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      requestedPath: path
    });
  }
};
