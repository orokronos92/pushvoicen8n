# Configuration n8n pour PushVoice - Phase 2

## Vue d'ensemble

Ce document décrit la configuration nécessaire pour n8n afin de supporter la communication WebSocket avec l'application PushVoice.

## Prérequis

- n8n version 1.103+ (support WebSocket natif)
- Accès administrateur à l'instance n8n
- Certificat SSL pour WSS (WebSocket sécurisé)

## Configuration du serveur n8n

### 1. Activer le support WebSocket

Dans votre fichier de configuration n8n (`.env` ou variables d'environnement) :

```bash
# Activer le support WebSocket
N8N_WEBHOOK_URL=https://votre-domaine.com
N8N_PROTOCOL=https

# Configuration WebSocket
WEBSOCKET_SERVER_ENABLED=true
WEBSOCKET_SERVER_PORT=8080
WEBSOCKET_SERVER_PATH=/ws
```

### 2. Configuration du reverse proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Configuration pour l'interface n8n
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Configuration WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout configuration
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## Workflow n8n pour PushVoice

### 1. Workflow Principal

```
[WebSocket Trigger] → [JWT Validation] → [Session Manager] → [Agent Conversationnel] → [WebSocket Response]
```

### 2. Détails des nœuds

#### a. WebSocket Trigger

- **Type**: WebSocket
- **Path**: `/ws`
- **Configuration**:
  - Activer la persistance de connexion: Oui
  - Timeout de session: 300 secondes (5 minutes)
  - Messages supportés:
    - `auth` (authentification)
    - `message` (messages utilisateur)
    - `session_start` (début de session)
    - `session_end` (fin de session)
    - `session_heartbeat` (heartbeat de session)

#### b. JWT Validation

- **Type**: Function (Code)
- **Fonction**: Valider le token JWT et extraire les informations de session

```javascript
// Code pour la validation JWT
const jwt = require('jsonwebtoken');

// Récupérer le secret depuis les variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Fonction de validation
function validateToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, payload: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Traiter le message entrant
if ($json.message.type === 'auth') {
  const token = $json.message.payload.token;
  const validation = validateToken(token);
  
  if (validation.valid) {
    // Stocker les informations de session
    $session.sessionId = validation.payload.sessionId;
    $session.userId = validation.payload.userId;
    
    return {
      type: 'auth',
      payload: { success: true },
      timestamp: new Date()
    };
  } else {
    return {
      type: 'auth',
      payload: { success: false, error: validation.error },
      timestamp: new Date()
    };
  }
}

// Pour les autres types de messages, vérifier si la session est valide
if (!$session.sessionId) {
  return {
    type: 'error',
    payload: { message: 'Session non authentifiée' },
    timestamp: new Date()
  };
}

// Continuer avec le traitement...
return $json;
```

#### c. Session Manager

- **Type**: Function (Code)
- **Fonction**: Gérer le cycle de vie des sessions

```javascript
// Gestion des sessions
const sessions = new Map();

// Démarrer une session
if ($json.message.type === 'session_start') {
  const sessionId = $json.message.payload.sessionId;
  
  sessions.set(sessionId, {
    userId: $session.userId,
    startTime: new Date(),
    lastActivity: new Date(),
    messages: []
  });
  
  return {
    type: 'session_start',
    payload: { success: true, sessionId },
    timestamp: new Date()
  };
}

// Mettre fin à une session
if ($json.message.type === 'session_end') {
  const sessionId = $json.message.payload.sessionId;
  
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    
    return {
      type: 'session_end',
      payload: { success: true, sessionId },
      timestamp: new Date()
    };
  }
  
  return {
    type: 'session_end',
    payload: { success: false, error: 'Session not found' },
    timestamp: new Date()
  };
}

// Heartbeat de session
if ($json.message.type === 'session_heartbeat') {
  const sessionId = $json.message.payload.sessionId;
  
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    session.lastActivity = new Date();
    
    return {
      type: 'session_heartbeat',
      payload: { success: true },
      timestamp: new Date()
    };
  }
  
  return {
    type: 'session_heartbeat',
    payload: { success: false, error: 'Session not found' },
    timestamp: new Date()
  };
}

// Mettre à jour la dernière activité pour les messages
if ($json.message.type === 'message' && $session.sessionId) {
  const session = sessions.get($session.sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

return $json;
```

#### d. Agent Conversationnel

- **Type**: Votre logique métier n8n existante
- **Fonction**: Traiter les messages de l'utilisateur et générer des réponses

```javascript
// Exemple de traitement de message
if ($json.message.type === 'message') {
  const userMessage = $json.message.payload.text;
  const sessionId = $session.sessionId;
  
  // Récupérer l'historique de la session
  const session = sessions.get(sessionId);
  if (session) {
    session.messages.push({
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });
  }
  
  // Traiter le message avec votre logique métier
  // Ceci est un exemple - remplacez avec votre logique réelle
  
  // Simuler une réponse
  const responseText = `J'ai reçu votre message: "${userMessage}"`;
  
  // Ajouter la réponse à l'historique
  if (session) {
    session.messages.push({
      text: responseText,
      sender: 'n8n',
      timestamp: new Date()
    });
  }
  
  return {
    type: 'message',
    payload: {
      text: responseText,
      sessionId: sessionId
    },
    timestamp: new Date()
  };
}

return $json;
```

#### e. WebSocket Response

- **Type**: WebSocket
- **Configuration**: Renvoyer la réponse au client via la connexion WebSocket persistante

## Variables d'environnement nécessaires

```bash
# JWT Configuration
JWT_SECRET=votre-clé-secrète-très-longue-et-complexe

# WebSocket Configuration
WEBSOCKET_SERVER_ENABLED=true
WEBSOCKET_SERVER_PORT=8080
WEBSOCKET_SERVER_PATH=/ws

# Session Configuration
SESSION_TIMEOUT=300000  # 5 minutes en millisecondes
HEARTBEAT_INTERVAL=60000  # 1 minute en millisecondes
```

## Sécurité

1. **Toujours utiliser WSS** (WebSocket sécurisé) en production
2. **Valider tous les tokens JWT** côté serveur
3. **Implémenter la gestion des sessions uniques** (une seule session active par utilisateur)
4. **Utiliser des secrets forts** pour la signature JWT
5. **Configurer des timeouts appropriés** pour les connexions WebSocket

## Monitoring

- Surveiller le nombre de connexions WebSocket actives
- Surveiller les taux d'erreur d'authentification
- Surveiller la durée moyenne des sessions
- Surveiller les temps de réponse des messages

## Dépannage

### Problèmes courants

1. **Connexions WebSocket qui se ferment**
   - Vérifier la configuration du reverse proxy
   - Vérifier les timeouts
   - Vérifier les certificats SSL

2. **Erreurs d'authentification JWT**
   - Vérifier que le secret est identique côté client et serveur
   - Vérifier l'expiration des tokens
   - Vérifier le format des tokens

3. **Sessions qui ne persistent pas**
   - Vérifier la configuration du timeout de session
   - Vérifier que le heartbeat est correctement implémenté
   - Vérifier la gestion des sessions côté serveur

## Prochaines étapes

1. Déployer cette configuration sur votre instance n8n
2. Tester la connexion WebSocket avec l'application PushVoice
3. Implémenter la validation JWT + session
4. Effectuer les tests bidirectionnels
5. Optimiser les performances