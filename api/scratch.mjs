import fetch from 'node-fetch';

export default async (req, res) => {
  const { path, params } = req.query;

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter. Example: /scratch/users/griffpatch'
    });
  }

  try {
    const url = `https://api.scratch.mit.edu/${path.replace(/^\//, '')}?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Scratch API error: ${response.statusText}`,
        status: response.status,
        requestedPath: path
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      requestedPath: path
    });
  }
};
