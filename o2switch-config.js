// Configuration pour O2switch
module.exports = {
  // Configuration de la base de données
  database: {
    path: process.env.NODE_ENV === 'production' ? '/home/your-username/wcm.db' : './wcm.db'
  },
  
  // Configuration du serveur
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },
  
  // Configuration des uploads
  uploads: {
    path: process.env.NODE_ENV === 'production' ? '/home/your-username/uploads' : './uploads',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  
  // Configuration CORS
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://votre-domaine.com', 'https://www.votre-domaine.com']
      : ['http://localhost:3000'],
    credentials: true
  },
  
  // Configuration JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'wcm-secret-key-o2switch-2024',
    expiresIn: '24h'
  },
  
  // Configuration WhatsApp (à remplir plus tard)
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }
}; 