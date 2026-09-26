# Deploy ShareNPlay v2.0.0 to Hugging Face Spaces

The Space `https://huggingface.co/spaces/Rajketha/sharenplay` already exists
(Docker SDK, port 7860). This folder is the ready-to-push v2.0.0 tree.

## Option A — one command (recommended)

1. Create a **write** token: https://huggingface.co/settings/tokens
2. From this folder, run:

```bash
HF_TOKEN=hf_your_token_here ./push-to-hf.sh
```

The Space rebuilds automatically (5-10 min) and serves the new version at
https://rajketha-sharenplay.hf.space

## Option B — web upload

1. Open https://huggingface.co/spaces/Rajketha/sharenplay/tree/main
2. "Add file" → "Upload files" → drag **everything in this folder**
   (replace the old files; keep `README.md` from this bundle — it carries the
   Space configuration header)
3. Commit → the Space rebuilds automatically.

## Notes

- `README.md` here has the required YAML front-matter (`sdk: docker`, `app_port: 7860`).
- The Dockerfile builds the frontend and serves it same-origin from the backend —
  no CORS or proxy configuration needed.
- This bundle deliberately excludes `portable-node/`, `node_modules/`, dev servers,
  and test files to keep the Space build fast and small (1.2 MB).
