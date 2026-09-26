#!/usr/bin/env bash
# Push this folder to the Hugging Face Space Rajketha/sharenplay
# Usage:  HF_TOKEN=hf_xxx ./push-to-hf.sh
set -e
TOKEN="${HF_TOKEN:?Set HF_TOKEN to your Hugging Face token (needs write access)}"
REMOTE="https://Rajketha:${TOKEN}@huggingface.co/spaces/Rajketha/sharenplay"
cd "$(dirname "$0")"
export GIT_DIR="$PWD/.hf-git"
export GIT_WORK_TREE="$PWD"
if [ ! -d "$GIT_DIR" ]; then
  git init -q
  git checkout -q -b main
fi
git add -A
git commit -q -m "ShareNPlay v2.0.0 - cinematic UI, logo, same-origin deploys" || true
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
git push -q origin main --force
echo "Pushed. The Space rebuilds automatically: https://rajketha-sharenplay.hf.space"
