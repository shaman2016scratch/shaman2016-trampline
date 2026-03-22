export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter.'
    });
  }

  try {
    const url = `https://api.telegram.org/${path.replace(/^\//, '')}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Dash API error: ${response.statusText}`,
        status: response.status,
        requestedPath: path
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || 'image/png';
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
