# Guide de Communication entre PushVoice et n8n

## Vue d'ensemble

L'application PushVoice communique avec n8n via **WebSocket** et non via des webhooks HTTP classiques. Cette approche permet une communication bidirectionnelle en temps réel, essentielle pour une expérience conversationnelle fluide.

## Architecture de Communication

```
PushVoice (Client) ←→ WebSocket (WSS) ←→ n8n (Serveur)
```

## Configuration Côté PushVoice

### 1. URL WebSocket

Dans votre fichier [`docker-compose.yml`](docker-compose.yml:14), configurez l'URL WebSocket :

```yaml
environment:
  - NEXT_PUBLIC_WS_URL=wss://pushvoice.srv801583.hstgr.cloud/ws
```

### 2. Variables d'environnement

```yaml
environment:
  - NEXT_PUBLIC_WS_URL=wss://votre-domaine.com/ws
  - JWT_SECRET=votre-jwt-secret-très-sécurisé
  - N8N_WEBHOOK_URL=https://n8n.votre-domaine.com/webhook-test/8d3b3e9f-2c90-4fc4-b1f5-33653ae0b17c
  - N8N_API_KEY=votre-clé-api-n8n
```

## Configuration Côté n8n

### 1. Activer le support WebSocket

Dans votre configuration n8n (fichier `.env`) :

```bash
# Activer le support WebSocket
WEBSOCKET_SERVER_ENABLED=true
WEBSOCKET_SERVER_PORT=8080
WEBSOCKET_SERVER_PATH=/ws

# Configuration JWT
JWT_SECRET=votre-jwt-secret-très-sécurisé  # DOIT ÊTRE IDENTIQUE à PushVoice
```

### 2. Configuration du Reverse Proxy (Nginx/Traefik)

#### Pour Traefik (recommandé) :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.n8n.rule=Host(`n8n.votre-domaine.com`)"
  - "traefik.http.routers.n8n.entrypoints=websecure"
  - "traefik.http.routers.n8n.tls.certresolver=mytlschallenge"
  - "traefik.http.services.n8n.loadbalancer.server.port=5678"
  
  # Configuration WebSocket
  - "traefik.http.routers.n8n-ws.rule=Host(`n8n.votre-domaine.com`) && PathPrefix(`/ws`)"
  - "traefik.http.routers.n8n-ws.entrypoints=websecure"
  - "traefik.http.routers.n8n-ws.tls.certresolver=mytlschallenge"
  - "traefik.http.routers.n8n-ws.service=n8n-ws"
  - "traefik.http.services.n8n-ws.loadbalancer.server.port=8080"
```

#### Pour Nginx :

```nginx
server {
    listen 443 ssl http2;
    server_name n8n.votre-domaine.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Interface n8n
    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## Flux de Communication

### 1. Initialisation de la connexion

```
PushVoice → n8n : { type: "auth", payload: { token: "JWT_TOKEN" } }
n8n → PushVoice : { type: "auth", payload: { success: true } }
```

### 2. Démarrage de session

```
PushVoice → n8n : { type: "session_start", payload: { sessionId: "SESSION_ID" } }
n8n → PushVoice : { type: "session_start", payload: { success: true } }
```

### 3. Envoi de message vocal

```
PushVoice → n8n : { 
  type: "message", 
  payload: { 
    text: "Bonjour, comment ça va ?", 
    sessionId: "SESSION_ID" 
  } 
}
n8n → PushVoice : { 
  type: "message", 
  payload: { 
    text: "Je vais bien, merci !", 
    sessionId: "SESSION_ID" 
  } 
}
```

### 4. Heartbeat de session

```
PushVoice → n8n : { type: "session_heartbeat", payload: { sessionId: "SESSION_ID" } }
n8n → PushVoice : { type: "session_heartbeat", payload: { success: true } }
```

### 5. Fin de session

```
PushVoice → n8n : { type: "session_end", payload: { sessionId: "SESSION_ID" } }
n8n → PushVoice : { type: "session_end", payload: { success: true } }
```

## Workflow n8n Recommandé

### Structure du workflow

```
[WebSocket Trigger] → [JWT Validation] → [Session Manager] → [Votre Logique Métier] → [WebSocket Response]
```

### 1. WebSocket Trigger

- **Type**: WebSocket
- **Path**: `/ws`
- **Configuration**:
  - Activer la persistance: Oui
  - Timeout: 300 secondes (5 minutes)

### 2. JWT Validation

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Valider le token JWT
if ($json.message.type === 'auth') {
  try {
    const decoded = jwt.verify($json.message.payload.token, JWT_SECRET);
    $session.sessionId = decoded.sessionId;
    $session.userId = decoded.userId;
    
    return {
      type: 'auth',
      payload: { success: true },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      type: 'auth',
      payload: { success: false, error: 'Invalid token' },
      timestamp: new Date()
    };
  }
}

// Vérifier l'authentification pour les autres messages
if (!$session.sessionId) {
  return {
    type: 'error',
    payload: { message: 'Non authentifié' },
    timestamp: new Date()
  };
}

return $json;
```

### 3. Session Manager

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

// Gérer les messages
if ($json.message.type === 'message') {
  const session = sessions.get($session.sessionId);
  if (session) {
    session.lastActivity = new Date();
    session.messages.push({
      text: $json.message.payload.text,
      sender: 'user',
      timestamp: new Date()
    });
  }
}

return $json;
```

### 4. Votre Logique Métier

```javascript
// Traitement des messages
if ($json.message.type === 'message') {
  const userMessage = $json.message.payload.text;
  
  // VOTRE LOGIQUE MÉTIER ICI
  // Exemple: Appeler une API, traiter avec un LLM, etc.
  
  const responseText = `J'ai compris: "${userMessage}"`;
  
  return {
    type: 'message',
    payload: {
      text: responseText,
      sessionId: $session.sessionId
    },
    timestamp: new Date()
  };
}

return $json;
```

## Configuration des Variables d'vironnement

### Côté PushVoice (docker-compose.yml)

```yaml
environment:
  - NEXT_PUBLIC_WS_URL=wss://n8n.votre-domaine.com/ws
  - JWT_SECRET=secret-identique-à-n8n
  - N8N_API_KEY=votre-clé-api
```

### Côté n8n (.env)

```bash
# WebSocket
WEBSOCKET_SERVER_ENABLED=true
WEBSOCKET_SERVER_PORT=8080
WEBSOCKET_SERVER_PATH=/ws

# JWT (DOIT ÊTRE IDENTIQUE à PushVoice)
JWT_SECRET=secret-identique-à-pushvoice

# Session
SESSION_TIMEOUT=300000
HEARTBEAT_INTERVAL=60000
```

## Test de la Communication

### 1. Tester la connexion WebSocket

```bash
# Utiliser wscat pour tester
npm install -g wscat
wscat -c wss://n8n.votre-domaine.com/ws
```

### 2. Envoyer un message test

```json
{
  "type": "auth",
  "payload": {
    "token": "votre-jwt-token"
  },
  "timestamp": "2025-08-05T12:00:00.000Z"
}
```

### 3. Vérifier les logs n8n

```bash
# Logs n8n
docker logs -f n8n-container

# Logs WebSocket
docker logs -f n8n-container | grep websocket
```

## Dépannage

### Problèmes courants

1. **Connexion WebSocket échoue**
   - Vérifier que le port 8080 est ouvert
   - Vérifier la configuration du reverse proxy
   - Vérifier les certificats SSL

2. **Authentification JWT échoue**
   - Vérifier que le secret est identique des deux côtés
   - Vérifier le format du token JWT
   - Vérifier l'expiration du token

3. **Messages non reçus**
   - Vérifier que le workflow n8n est actif
   - Vérifier les logs d'erreurs n8n
   - Vérifier la configuration du WebSocket Trigger

### Outils de débogage

1. **WebSocket Client**: `wscat` ou extension navigateur
2. **JWT Debugger**: jwt.io
3. **Logs**: `docker logs` et console navigateur
4. **Network Tab**: Outils de développement navigateur

## Sécurité

1. **Toujours utiliser WSS** (WebSocket sécurisé)
2. **Secrets JWT forts et identiques** des deux côtés
3. **Validation stricte** des tokens et sessions
4. **Timeouts appropriés** pour les connexions
5. **Monitoring** des connexions actives

## Résumé

Pour faire communiquer PushVoice avec n8n :

1. **Configurez l'URL WebSocket** dans PushVoice : `wss://n8n.votre-domaine.com/ws`
2. **Configurez le serveur WebSocket** dans n8n (port 8080, path `/ws`)
3. **Configurez le reverse proxy** pour gérer les connexions WebSocket
4. **Créez le workflow n8n** avec les nœuds WebSocket, JWT Validation et votre logique métier
5. **Assurez-vous que les secrets JWT sont identiques** des deux côtés
6. **Testez la communication** avec des outils comme wscat

Cette configuration permet une communication bidirectionnelle en temps réel entre PushVoice et n8n, essentielle pour une expérience conversationnelle fluide.