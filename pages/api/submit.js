export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { id, values } = req.body || {};
  if (!id) return res.status(400).json({ message: 'Missing id' });

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const targetPath = process.env.SUBMISSIONS_PATH || 'data/submissions.json';

  if (!token || !owner || !repo) {
    return res.status(501).json({ message: 'GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO must be set in environment for persistence. Running in demo mode.' });
  }

  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`;

  try {
    // Try to fetch existing file
    const getResp = await fetch(apiBase, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });

    let submissions = [];
    let sha = undefined;

    if (getResp.status === 200) {
      const file = await getResp.json();
      sha = file.sha;
      const content = Buffer.from(file.content, 'base64').toString('utf8');
      try { submissions = JSON.parse(content); } catch (e) { submissions = []; }
    }

    const newEntry = { id, values, createdAt: new Date().toISOString() };
    submissions.push(newEntry);

    const updatedContent = Buffer.from(JSON.stringify(submissions, null, 2)).toString('base64');

    const body = {
      message: `Add submission for id ${id}`,
      content: updatedContent
    };
    if (sha) body.sha = sha;

    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!putResp.ok) {
      const err = await putResp.text();
      console.error('GitHub PUT error', putResp.status, err);
      return res.status(500).json({ message: 'Error saving submission', details: err });
    }

    return res.status(200).json({ message: 'Submission saved to repository' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error saving submission', error: err.message });
  }
}
