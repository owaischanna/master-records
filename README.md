# Individual Record

Small Next.js dashboard that reads an Excel file at build time and exposes a simple per-entry submission API that commits to your GitHub repo.

Quick start:

1. Install dependencies

```bash
cd individual-record
npm install
```

2. Add your Excel file at `data/data.xlsx` (first sheet used) or edit `data/sample-data.json` for testing.

3. Set environment variables in Vercel:

- `GITHUB_TOKEN` — personal access token with `repo`/`contents` scope
- `GITHUB_OWNER` — your GitHub username or org
- `GITHUB_REPO` — repo name (the repo where files will be updated)

4. Deploy to Vercel (connect this repository) and ensure env vars are set.
