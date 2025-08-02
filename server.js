const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware de sécurité
app.use(helmet());
app.use(compression());

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite chaque IP à 100 requêtes par fenêtre
});
app.use('/api/', limiter);

// Middleware pour parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuration de la base de données SQLite
const sqlite3 = require('sqlite3').verbose();
const dbPath = process.env.NODE_ENV === 'production' ? '/tmp/wcm.db' : './wcm.db';
const db = new sqlite3.Database(dbPath);

// Initialisation de la base de données
db.serialize(() => {
  // Table des utilisateurs
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table des campagnes
  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT,
    media_url TEXT,
    media_type TEXT,
    scheduled_time DATETIME,
    status TEXT DEFAULT 'draft',
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Table des numéros de téléphone
  db.run(`CREATE TABLE IF NOT EXISTS phone_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER,
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    delivered_at DATETIME,
    failed_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
  )`);

  // Table des rapports
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER,
    total_sent INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
  )`);

  // Créer un utilisateur par défaut si la table est vide
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification des utilisateurs:', err);
      return;
    }
    
    if (row.count === 0) {
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        ['admin', 'admin@wcm.com', defaultPassword],
        (err) => {
          if (err) {
            console.error('Erreur lors de la création de l\'utilisateur par défaut:', err);
          } else {
            console.log('Utilisateur par défaut créé: admin / admin123');
          }
        }
      );
    }
  });
});

// Configuration Multer pour les uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

// Middleware d'authentification JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
  }

  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, hashedPassword],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
        }
        return res.status(500).json({ error: 'Erreur lors de la création du compte' });
      }

      const token = jwt.sign(
        { id: this.lastID, username, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: this.lastID,
          username,
          email
        }
      });
    }
  );
});

// Routes des campagnes
app.get('/api/campaigns', authenticateToken, (req, res) => {
  db.all('SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, campaigns) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des campagnes' });
    }
    res.json(campaigns);
  });
});

app.post('/api/campaigns', authenticateToken, upload.single('media'), (req, res) => {
  const { name, message, scheduled_time, phone_numbers } = req.body;
  const media_url = req.file ? `/uploads/${req.file.filename}` : null;
  const media_type = req.file ? req.file.mimetype : null;

  if (!name || !message) {
    return res.status(400).json({ error: 'Nom et message requis' });
  }

  db.run(`INSERT INTO campaigns (name, message, media_url, media_type, scheduled_time, user_id) 
          VALUES (?, ?, ?, ?, ?, ?)`,
    [name, message, media_url, media_type, scheduled_time, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la création de la campagne' });
      }

      const campaignId = this.lastID;

      // Ajouter les numéros de téléphone
      if (phone_numbers && phone_numbers.length > 0) {
        const phoneNumbers = phone_numbers.split(',').map(phone => phone.trim());
        const placeholders = phoneNumbers.map(() => '(?, ?)').join(',');
        const values = phoneNumbers.flatMap(phone => [campaignId, phone]);

        db.run(`INSERT INTO phone_numbers (campaign_id, phone_number) VALUES ${placeholders}`, values, (err) => {
          if (err) {
            console.error('Erreur lors de l\'ajout des numéros:', err);
          }
        });
      }

      res.status(201).json({
        id: campaignId,
        name,
        message,
        media_url,
        media_type,
        scheduled_time,
        status: 'draft'
      });
    }
  );
});

app.get('/api/campaigns/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', [id, req.user.id], (err, campaign) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération de la campagne' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }

    // Récupérer les numéros de téléphone
    db.all('SELECT * FROM phone_numbers WHERE campaign_id = ?', [id], (err, phoneNumbers) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la récupération des numéros' });
      }

      campaign.phone_numbers = phoneNumbers;
      res.json(campaign);
    });
  });
});

app.post('/api/campaigns/:id/send', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('UPDATE campaigns SET status = ? WHERE id = ? AND user_id = ?', 
    ['sending', id, req.user.id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de la campagne' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Campagne non trouvée' });
      }

      // Simuler l'envoi des messages
      setTimeout(() => {
        db.run('UPDATE campaigns SET status = ? WHERE id = ?', ['completed', id]);
        
        // Mettre à jour les statuts des numéros
        db.all('SELECT * FROM phone_numbers WHERE campaign_id = ?', [id], (err, phoneNumbers) => {
          if (!err && phoneNumbers) {
            phoneNumbers.forEach((phone, index) => {
              const status = Math.random() > 0.1 ? 'delivered' : 'failed';
              const sentAt = new Date().toISOString();
              
              db.run('UPDATE phone_numbers SET status = ?, sent_at = ? WHERE id = ?',
                [status, sentAt, phone.id]);
            });
          }
        });
      }, 5000);

      res.json({ message: 'Campagne en cours d\'envoi' });
    }
  );
});

// Routes des rapports
app.get('/api/reports', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      c.id,
      c.name,
      c.status,
      c.created_at,
      COUNT(pn.id) as total_numbers,
      SUM(CASE WHEN pn.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN pn.status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN pn.status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM campaigns c
    LEFT JOIN phone_numbers pn ON c.id = pn.campaign_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `, [req.user.id], (err, reports) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des rapports' });
    }
    res.json(reports);
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Tâche cron pour traiter les campagnes programmées
cron.schedule('* * * * *', () => {
  db.all('SELECT * FROM campaigns WHERE status = ? AND scheduled_time <= ?', 
    ['scheduled', new Date().toISOString()], 
    (err, campaigns) => {
      if (err) {
        console.error('Erreur lors de la récupération des campagnes programmées:', err);
        return;
      }

      campaigns.forEach(campaign => {
        // Traiter la campagne
        console.log(`Traitement de la campagne: ${campaign.name}`);
        // Ici, vous ajouteriez la logique d'envoi réelle
      });
    }
  );
});

// Démarrer le serveur
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
}

module.exports = app; 