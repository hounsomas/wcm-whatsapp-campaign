const express = require('express');
const cors = require('cors');
const multer = require('multer');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Configuration de multer pour les uploads
const storage = multer.memoryStorage(); // Utiliser le stockage en mémoire pour Vercel

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

// Base de données SQLite (en mémoire pour Vercel)
const db = new sqlite3.Database(':memory:');

// Initialisation de la base de données
db.serialize(() => {
  // Table des campagnes
  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    message TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT,
    scheduled_time DATETIME,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table des numéros de téléphone
  db.run(`CREATE TABLE IF NOT EXISTS phone_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT,
    phone_number TEXT NOT NULL,
    country_code TEXT DEFAULT '+33',
    status TEXT DEFAULT 'pending',
    sent_at DATETIME,
    delivered_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
  )`);

  // Table des rapports
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT,
    total_sent INTEGER DEFAULT 0,
    delivered INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id)
  )`);

  // Table des utilisateurs
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'wcm-secret-key-2024';

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Nom d\'utilisateur ou email déjà utilisé' });
          }
          return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
        }
        
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: this.lastID, username, email } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  });
});

// Routes des campagnes
app.post('/api/campaigns', authenticateToken, upload.single('media'), (req, res) => {
  try {
    const { name, description, message, scheduled_time, phone_numbers } = req.body;
    const campaignId = uuidv4();
    const mediaUrl = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;
    const mediaType = req.file ? req.file.mimetype : null;
    
    db.run(
      'INSERT INTO campaigns (id, name, description, message, media_url, media_type, scheduled_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [campaignId, name, description, message, mediaUrl, mediaType, scheduled_time, 'draft'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Erreur lors de la création de la campagne' });
        }
        
        // Ajouter les numéros de téléphone
        if (phone_numbers && phone_numbers.length > 0) {
          const numbers = JSON.parse(phone_numbers);
          const stmt = db.prepare('INSERT INTO phone_numbers (campaign_id, phone_number) VALUES (?, ?)');
          
          numbers.forEach(number => {
            stmt.run([campaignId, number]);
          });
          stmt.finalize();
        }
        
        res.json({ 
          id: campaignId, 
          message: 'Campagne créée avec succès',
          media_url: mediaUrl 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/campaigns', authenticateToken, (req, res) => {
  db.all('SELECT * FROM campaigns ORDER BY created_at DESC', (err, campaigns) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la récupération des campagnes' });
    }
    res.json(campaigns);
  });
});

app.get('/api/campaigns/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, campaign) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    // Récupérer les numéros de téléphone
    db.all('SELECT * FROM phone_numbers WHERE campaign_id = ?', [id], (err, numbers) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      campaign.phone_numbers = numbers;
      res.json(campaign);
    });
  });
});

app.put('/api/campaigns/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run('UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
    [status, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Erreur lors de la mise à jour' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Campagne non trouvée' });
      }
      
      res.json({ message: 'Statut mis à jour avec succès' });
    }
  );
});

// Route pour envoyer une campagne
app.post('/api/campaigns/:id/send', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  // Simuler l'envoi WhatsApp (remplacer par l'API WhatsApp Business réelle)
  db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    db.all('SELECT * FROM phone_numbers WHERE campaign_id = ?', [id], (err, numbers) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      // Simuler l'envoi à chaque numéro
      numbers.forEach((number, index) => {
        setTimeout(() => {
          const status = Math.random() > 0.1 ? 'delivered' : 'failed';
          const errorMessage = status === 'failed' ? 'Numéro invalide' : null;
          
          db.run(
            'UPDATE phone_numbers SET status = ?, sent_at = CURRENT_TIMESTAMP, delivered_at = ?, error_message = ? WHERE id = ?',
            [status, status === 'delivered' ? new Date().toISOString() : null, errorMessage, number.id]
          );
        }, index * 100); // Délai entre chaque envoi
      });
      
      // Mettre à jour le statut de la campagne
      db.run('UPDATE campaigns SET status = ? WHERE id = ?', ['sending', id]);
      
      res.json({ message: 'Campagne en cours d\'envoi', total_numbers: numbers.length });
    });
  });
});

// Route pour les rapports
app.get('/api/campaigns/:id/report', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM campaigns WHERE id = ?', [id], (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ error: 'Campagne non trouvée' });
    }
    
    db.all(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM phone_numbers 
      WHERE campaign_id = ?
    `, [id], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur serveur' });
      }
      
      const report = {
        campaign_id: id,
        campaign_name: campaign.name,
        total_sent: stats[0].total,
        delivered: stats[0].delivered,
        failed: stats[0].failed,
        pending: stats[0].pending,
        success_rate: ((stats[0].delivered / stats[0].total) * 100).toFixed(2) + '%'
      };
      
      res.json(report);
    });
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Export pour Vercel
module.exports = app; 