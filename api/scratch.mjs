import fetch from 'node-fetch';

export default async (req, res) => {
  const { path } = req.query;
  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path') {
      queryParams.append(key, value);
    }
  }

  if (!path) {
    return res.status(400).json({
      error: 'Missing path parameter. Example: /scratch/users/griffpatch'
    });
  }

  try {
    const basePath = path.replace(/^\//, '');
    const url = `https://api.scratch.mit.edu/${basePath}`;
    const finalUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    const response = await fetch(finalUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Scratch API error: ${response.statusText}`,
        status: response.status,
        requestedPath: path,
        requestedQuery: Object.fromEntries(queryParams)
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      requestedPath: path,
      requestedQuery: Object.fromEntries(queryParams)
    });
  }
};
