#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Create directories if they don't exist
mkdir -p dist/main
mkdir -p dist/renderer

# Create a basic .env file
echo "NODE_ENV=development" > .env

echo "Setup complete! You can now run 'npm run dev' to start the application."