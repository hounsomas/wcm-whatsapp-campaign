# Guide de Déploiement WCM sur Vercel

## 🚀 Déploiement Rapide

### Étape 1 : Préparation
1. Assurez-vous que tous les fichiers sont sauvegardés
2. Le projet est prêt pour le déploiement

### Étape 2 : Déploiement sur Vercel

#### Option A : Via l'interface web Vercel
1. Allez sur [vercel.com](https://vercel.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Importez votre repository GitHub
5. Configurez les variables d'environnement :
   ```
   NODE_ENV=production
   JWT_SECRET=votre-secret-jwt-securise
   ```
6. Cliquez sur "Deploy"

#### Option B : Via Vercel CLI
```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod
```

### Étape 3 : Configuration des Variables d'Environnement

Dans le dashboard Vercel, ajoutez ces variables :

```
NODE_ENV=production
JWT_SECRET=votre-secret-jwt-securise-2024
WHATSAPP_TOKEN=votre-token-whatsapp
WHATSAPP_PHONE_NUMBER_ID=votre-phone-number-id
```

### Étape 4 : Test de l'Application

Une fois déployée, votre application sera accessible à :
- `https://votre-projet.vercel.app`

## 🔧 Configuration Post-Déploiement

### 1. Test de l'API
Testez l'endpoint de santé :
```
GET https://votre-projet.vercel.app/api/health
```

### 2. Création du Premier Compte
1. Accédez à votre application
2. Cliquez sur "Créer un compte"
3. Remplissez les informations
4. Connectez-vous

### 3. Test des Fonctionnalités
- Créer une campagne
- Uploader un fichier
- Programmer un envoi
- Consulter les rapports

## 🛠️ Dépannage

### Problème : Erreur de build
- Vérifiez que tous les fichiers sont commités
- Vérifiez les variables d'environnement

### Problème : API non accessible
- Vérifiez que le fichier `api/index.js` existe
- Vérifiez la configuration `vercel.json`

### Problème : Base de données
- La base de données SQLite est en mémoire pour Vercel
- Les données ne persistent pas entre les redémarrages
- Pour la production, utilisez une base de données externe

## 📝 Notes Importantes

1. **Base de données** : SQLite en mémoire (données perdues au redémarrage)
2. **Fichiers** : Stockage temporaire (pas de persistance)
3. **Limitations** : Fonctionne pour les tests et démonstrations
4. **Production** : Recommandé d'utiliser une base de données externe

## 🔄 Mise à Jour

Pour mettre à jour votre application :
```bash
git add .
git commit -m "Update"
git push
```

Vercel redéploiera automatiquement.

## 🆘 Support

En cas de problème :
1. Vérifiez les logs dans le dashboard Vercel
2. Testez l'API avec Postman ou curl
3. Vérifiez les variables d'environnement 