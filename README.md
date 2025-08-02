# WCM - Gestionnaire de Campagnes WhatsApp

Une plateforme web complète pour gérer des campagnes de communication WhatsApp avec des milliers de numéros. Envoyez des messages, visuels, vidéos et documents simultanément avec programmation automatique et rapports détaillés.

## 🚀 Fonctionnalités

### ✨ Fonctionnalités principales
- **Envoi en masse** : Envoyez des messages à des milliers de numéros simultanément
- **Médias multiples** : Support des images, vidéos, PDF et documents
- **Programmation** : Planifiez l'envoi de vos campagnes à l'avance
- **Rapports détaillés** : Suivez les messages livrés, échoués et en attente
- **Interface moderne** : Dashboard intuitif avec graphiques et statistiques
- **Authentification sécurisée** : Système de connexion avec JWT

### 📊 Rapports et analyses
- Statistiques en temps réel
- Graphiques de performance
- Taux de livraison
- Historique des campagnes
- Export des données

### 🔧 Gestion des campagnes
- Création de campagnes avec interface drag & drop
- Upload de fichiers (max 16MB)
- Programmation flexible
- Statuts en temps réel
- Gestion des numéros de téléphone

## 🛠️ Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Base de données SQLite (incluse)

### Installation rapide

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd WCM
```

2. **Installer les dépendances**
```bash
# Installer les dépendances du serveur
npm install

# Installer les dépendances du client
cd client
npm install
cd ..
```

3. **Configuration**
```bash
# Créer le fichier .env à la racine
cp .env.example .env
```

4. **Démarrer l'application**
```bash
# Démarrer le serveur (port 5000)
npm start

# Dans un autre terminal, démarrer le client (port 3000)
cd client
npm start
```

5. **Accéder à l'application**
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000

## 📱 Utilisation

### Première connexion
1. Créez un compte utilisateur
2. Connectez-vous à la plateforme
3. Accédez au tableau de bord

### Créer une campagne
1. Cliquez sur "Nouvelle campagne"
2. Remplissez les informations :
   - Nom et description
   - Message à envoyer
   - Upload de média (optionnel)
   - Liste des numéros de téléphone
   - Programmation (optionnelle)
3. Sauvegardez et envoyez

### Programmer une campagne
1. Activez l'option "Programmer l'envoi"
2. Sélectionnez la date et l'heure
3. La campagne sera envoyée automatiquement

### Consulter les rapports
1. Accédez à la section "Rapports"
2. Visualisez les statistiques globales
3. Analysez les performances par campagne
4. Exportez les données si nécessaire

## 🔌 Intégration WhatsApp Business

### Configuration de l'API WhatsApp
Pour utiliser l'API WhatsApp Business réelle, remplacez la simulation dans `server.js` :

```javascript
// Dans server.js, ligne ~300
// Remplacer la simulation par l'appel API réel
const sendWhatsAppMessage = async (phoneNumber, message, mediaUrl) => {
  // Intégrez votre API WhatsApp Business ici
  // Exemple avec l'API officielle WhatsApp Business
  const response = await axios.post('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: mediaUrl ? 'document' : 'text',
    text: { body: message },
    document: mediaUrl ? { link: mediaUrl } : undefined
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
};
```

### Variables d'environnement
```env
# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_business_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Base de données
DATABASE_URL=sqlite:wcm.db
```

## 📁 Structure du projet

```
WCM/
├── server.js              # Serveur Express principal
├── package.json           # Dépendances du serveur
├── wcm.db                 # Base de données SQLite
├── uploads/               # Fichiers uploadés
├── client/                # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── context/       # Contextes (Auth)
│   │   ├── App.js         # Application principale
│   │   └── index.js       # Point d'entrée
│   ├── public/            # Fichiers publics
│   └── package.json       # Dépendances du client
└── README.md             # Documentation
```

## 🗄️ Base de données

### Tables principales
- **campaigns** : Informations des campagnes
- **phone_numbers** : Numéros de téléphone et statuts
- **reports** : Rapports de livraison
- **users** : Utilisateurs de la plateforme

### Schéma de base
```sql
-- Campagnes
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  scheduled_time DATETIME,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Numéros de téléphone
CREATE TABLE phone_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at DATETIME,
  delivered_at DATETIME,
  error_message TEXT
);
```

## 🔒 Sécurité

- **Authentification JWT** : Tokens sécurisés
- **Validation des données** : Vérification des entrées
- **Rate limiting** : Protection contre les abus
- **Helmet** : Sécurité des en-têtes HTTP
- **CORS** : Configuration sécurisée

## 🚀 Déploiement

### Production
```bash
# Build du client
cd client
npm run build

# Démarrage en production
cd ..
NODE_ENV=production npm start
```

### Variables d'environnement de production
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secure_jwt_secret
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## 📊 Monitoring

### Logs
- Logs des campagnes envoyées
- Erreurs de livraison
- Statistiques de performance

### Métriques
- Taux de livraison
- Temps de traitement
- Nombre de campagnes actives

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation
- Contactez l'équipe de développement

## 🔄 Mises à jour

### Version 1.0.0
- ✅ Interface de base
- ✅ Gestion des campagnes
- ✅ Upload de fichiers
- ✅ Programmation
- ✅ Rapports
- ✅ Authentification

### Prochaines fonctionnalités
- 🔄 Templates de messages
- 🔄 Segmentation des contacts
- 🔄 API webhooks
- 🔄 Notifications push
- 🔄 Mode sombre

---

**WCM** - Votre solution complète pour les campagnes WhatsApp 🚀 