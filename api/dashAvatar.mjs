export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'image/png')
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter.'
    });
  }

  try {
    const url = `https://dashblocks-server.vercel.app/users/avatars/${path.replace(/^\//, '')}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Dash API error: ${response.statusText}`,
        status: response.status,
        requestedPath: path
      });
    }

    const data = await response.blob();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      requestedPath: path
    });
  }
};
