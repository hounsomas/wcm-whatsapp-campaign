#!/bin/bash

# Build du client React
echo "Building React client..."
cd client
npm install
npm run build
cd ..

# Créer le dossier build pour Vercel
mkdir -p build
cp -r client/build/* build/

# Copier les fichiers du serveur
cp server.js build/
cp package.json build/
cp -r node_modules build/

echo "Build completed successfully!" 