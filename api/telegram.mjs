import fetch from 'node-fetch';

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
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        response,
        data,
        url
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
