#!/bin/bash
echo "Running Luneo load tests..."
echo "Make sure k6 is installed: brew install k6"
echo ""
k6 run --env BASE_URL=${BASE_URL:-http://localhost:3001} --env API_KEY=${API_KEY:-test-key} apps/backend/test/load/k6-config.js
