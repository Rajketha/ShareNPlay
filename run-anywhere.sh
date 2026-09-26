#!/bin/bash

echo ""
echo " ============================================="
echo "  🎮  ShareNPlay - One Click Launcher"
echo " ============================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo " ❌ Docker is NOT installed!"
    echo ""
    echo " Install Docker Desktop (free):"
    echo " https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo " ✅ Docker found."
echo " 📦 Pulling latest ShareNPlay image..."
echo ""

# Pull latest image from Docker Hub
docker pull rajketha/sharenplay:latest

# Stop old container if running
docker rm -f sharenplay-app 2>/dev/null

# Start fresh container
docker run -d \
  --name sharenplay-app \
  -p 5000:5000 \
  -v sharenplay-uploads:/app/backend/uploads \
  --restart unless-stopped \
  rajketha/sharenplay:latest

if [ $? -ne 0 ]; then
    echo " ❌ Failed to start ShareNPlay!"
    exit 1
fi

echo ""
echo " ⏳ Starting up (8 seconds)..."
sleep 8

# Detect local IP (Mac and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    LOCAL_IP=$(hostname -I | awk '{print $1}')
fi

echo ""
echo " ============================================="
echo "  ✅  ShareNPlay is LIVE!"
echo " ============================================="
echo ""
echo "  🌐 Your link (share this on same WiFi):"
echo "     http://$LOCAL_IP:5000"
echo ""
echo "  💻 Localhost:"
echo "     http://localhost:5000"
echo ""
echo "  🛑 To stop: docker rm -f sharenplay-app"
echo " ============================================="
echo ""

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://$LOCAL_IP:5000"
else
    xdg-open "http://$LOCAL_IP:5000" 2>/dev/null || echo "Open your browser and go to http://$LOCAL_IP:5000"
fi
