# 🚀 Guide de déploiement WCM sur O2switch

## 📋 Prérequis

- Compte O2switch avec hébergement mutualisé ou VPS
- Accès SSH (recommandé) ou FTP
- Domaine configuré sur O2switch

## 🔧 Étape 1 : Préparer le projet

### Option A : Via Git (recommandé)
```bash
# Sur votre serveur O2switch
cd /home/your-username
git clone https://github.com/hounsomas/wcm-whatsapp-campaign.git
cd wcm-whatsapp-campaign
```

### Option B : Via upload FTP
1. Exécutez le script de préparation localement :
```bash
chmod +x o2switch-deploy.sh
./o2switch-deploy.sh
```
2. Uploadez le contenu du dossier `deploy/` sur votre serveur

## 🔧 Étape 2 : Configuration sur O2switch

### 1. Accéder à votre serveur
```bash
ssh your-username@your-server.o2switch.net
```

### 2. Installer Node.js (si pas déjà installé)
```bash
# Vérifier si Node.js est installé
node --version

# Si pas installé, contacter le support O2switch
# ou installer via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### 3. Configurer le projet
```bash
cd /home/your-username/public_html/wcm
npm install
cd client
npm install
npm run build
cd ..
```

### 4. Créer le fichier .env
```bash
nano .env
```

Contenu du fichier .env :
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=votre-secret-jwt-super-securise
DATABASE_URL=/home/your-username/wcm.db
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

## 🔧 Étape 3 : Configuration du serveur

### 1. Créer un service systemd (pour VPS)
```bash
sudo nano /etc/systemd/system/wcm.service
```

Contenu :
```ini
[Unit]
Description=WCM WhatsApp Campaign Manager
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/public_html/wcm
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Démarrer le service
```bash
sudo systemctl daemon-reload
sudo systemctl enable wcm
sudo systemctl start wcm
sudo systemctl status wcm
```

### 3. Pour hébergement mutualisé (sans SSH)
Utilisez un gestionnaire de processus comme PM2 :
```bash
npm install -g pm2
pm2 start server.js --name "wcm"
pm2 startup
pm2 save
```

## 🔧 Étape 4 : Configuration du domaine

### 1. Dans le panel O2switch
- Allez dans "Domaines"
- Configurez votre domaine pour pointer vers le dossier `/public_html/wcm`

### 2. Configuration Apache (.htaccess)
Le fichier `.htaccess` est déjà créé dans le script de déploiement.

### 3. Configuration SSL
- Activez SSL dans le panel O2switch
- Redirigez HTTP vers HTTPS

## 🔧 Étape 5 : Test et vérification

### 1. Tester l'API
```bash
curl https://votre-domaine.com/api/health
```

### 2. Tester l'application
- Ouvrez https://votre-domaine.com
- Connectez-vous avec : admin / admin123

### 3. Vérifier les logs
```bash
# Pour systemd
sudo journalctl -u wcm -f

# Pour PM2
pm2 logs wcm
```

## 🔧 Étape 6 : Sécurisation

### 1. Changer le mot de passe admin
- Connectez-vous à l'application
- Créez un nouveau compte administrateur
- Supprimez le compte admin par défaut

### 2. Configuration firewall
```bash
# Si vous avez accès au firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Sauvegarde automatique
```bash
# Créer un script de sauvegarde
nano /home/your-username/backup-wcm.sh
```

Contenu :
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/your-username/backups"
mkdir -p $BACKUP_DIR

# Sauvegarder la base de données
cp /home/your-username/wcm.db $BACKUP_DIR/wcm_$DATE.db

# Sauvegarder les uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/your-username/uploads

# Nettoyer les anciennes sauvegardes (garder 7 jours)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🚨 Dépannage

### Problème : Application ne démarre pas
```bash
# Vérifier les logs
pm2 logs wcm
# ou
sudo journalctl -u wcm -f

# Vérifier les permissions
chmod 755 /home/your-username/public_html/wcm
chmod 644 /home/your-username/public_html/wcm/server.js
```

### Problème : Base de données inaccessible
```bash
# Vérifier les permissions de la base de données
chmod 666 /home/your-username/wcm.db
chown your-username:your-username /home/your-username/wcm.db
```

### Problème : Uploads ne fonctionnent pas
```bash
# Créer le dossier uploads
mkdir -p /home/your-username/uploads
chmod 755 /home/your-username/uploads
chown your-username:your-username /home/your-username/uploads
```

## 📞 Support

- **Documentation O2switch :** https://www.o2switch.fr/faq/
- **Support technique :** support@o2switch.fr
- **Documentation WCM :** README.md

## 🔄 Mise à jour

Pour mettre à jour l'application :
```bash
cd /home/your-username/public_html/wcm
git pull origin main
npm install
cd client && npm install && npm run build
cd ..
pm2 restart wcm
# ou
sudo systemctl restart wcm
``` 