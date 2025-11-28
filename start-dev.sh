#!/bin/bash

# Quick start script for Ody'sai development

echo "🚀 Starting Ody'sai Development Environment..."
echo ""

# Check if in correct directory
if [ ! -d "odysai-backend" ] || [ ! -d "odysai-frontend" ]; then
    echo "❌ Error: Please run this script from the odysai root directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "odysai-backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd odysai-backend && npm install && cd ..
fi

if [ ! -d "odysai-frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd odysai-frontend && npm install && cd ..
fi

echo ""
echo "Starting servers..."
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers in background and wait
trap 'kill %1; kill %2; exit' SIGINT SIGTERM

cd odysai-backend && npm run dev &
cd odysai-frontend && npm run dev &

wait
