#!/usr/bin/env bash
# Publish the locally built image to Docker Hub (rajketha/sharenplay)
# Usage: ./push-to-dockerhub.sh   (prompts for Docker Hub login once)
set -e
docker login
docker tag sharenplay:2.0.0 rajketha/sharenplay:2.0.0
docker tag sharenplay:2.0.0 rajketha/sharenplay:latest
docker push rajketha/sharenplay:2.0.0
docker push rajketha/sharenplay:latest
echo "Published: https://hub.docker.com/r/rajketha/sharenplay"
echo "Run anywhere with: docker run -p 7860:7860 rajketha/sharenplay:latest"
