#!/bin/bash

echo "🚀 Déploiement WCM sur O2switch..."

# Variables
PROJECT_NAME="wcm-whatsapp-campaign"
O2SWITCH_PATH="/home/your-username/public_html/wcm"

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
npm install

echo -e "${YELLOW}🔨 Build du frontend...${NC}"
cd client
npm install
npm run build
cd ..

echo -e "${YELLOW}📁 Préparation des fichiers...${NC}"
# Créer le dossier de déploiement
mkdir -p deploy

# Copier les fichiers backend
cp server.js deploy/
cp package.json deploy/
cp -r node_modules deploy/
cp .env deploy/ 2>/dev/null || echo "Fichier .env non trouvé"

# Copier le frontend buildé
cp -r client/build deploy/public

# Copier les fichiers de configuration
cp README.md deploy/
cp .gitignore deploy/

echo -e "${YELLOW}📋 Création du fichier de configuration...${NC}"

# Créer un fichier .htaccess pour O2switch
cat > deploy/.htaccess << 'EOF'
RewriteEngine On

# Rediriger les requêtes API vers le serveur Node.js
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# Servir les fichiers statiques du frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /public/index.html [L]

# Headers de sécurité
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
EOF

# Créer un script de démarrage
cat > deploy/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Démarrage du serveur WCM..."
export NODE_ENV=production
export PORT=3000
node server.js
EOF

chmod +x deploy/start.sh

echo -e "${GREEN}✅ Déploiement préparé avec succès !${NC}"
echo -e "${YELLOW}📁 Dossier 'deploy' créé avec tous les fichiers nécessaires${NC}"
echo ""
echo -e "${GREEN}📋 Instructions pour O2switch :${NC}"
echo "1. Uploadez le contenu du dossier 'deploy' sur votre hébergement O2switch"
echo "2. Placez les fichiers dans : $O2SWITCH_PATH"
echo "3. Configurez votre domaine pour pointer vers ce dossier"
echo "4. Démarrez le serveur avec : ./start.sh"
echo ""
echo -e "${YELLOW}🔗 URL d'accès : https://votre-domaine.com${NC}" 