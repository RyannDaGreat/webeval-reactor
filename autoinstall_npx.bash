#!/bin/bash

# Update your system
sudo apt-get update

# Install curl if it's not already installed
sudo apt-get install -y curl

# Download the Node.js 20.x setup script from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs

# Verify the installation
node -v
npm -v
npx -v