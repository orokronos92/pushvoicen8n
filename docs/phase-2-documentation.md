# Documentation Phase 2 - PushVoice

## Vue d'ensemble

Ce document décrit l'implémentation de la Phase 2 de PushVoice, qui se concentre sur la communication WebSocket persistante avec n8n, la gestion des sessions uniques, et la validation JWT.

## Fonctionnalités Implémentées

### 1. Communication WebSocket Persistante

#### Description
Une connexion WebSocket stable et persistante a été implémentée pour permettre une communication bidirectionnelle en temps réel entre le client et n8n.

#### Caractéristiques
- **Reconnexion automatique** : En cas de déconnexion, le client tente de se reconnecter automatiquement
- **Gestion de file d'attente** : Les messages sont mis en file d'attente lorsque la connexion est perdue et envoyés automatiquement lors de la reconnexion
- **Heartbeat** : Mécanisme de ping/pong pour maintenir la connexion active
- **Optimisation des performances** : Mesure du temps de traitement des messages et débouncing des envois

#### Composants Clés
- `WebSocketClient` dans `src/lib/websocket.ts`
- `useWebSocket` hook dans `src/hooks/useWebSocket.ts`

### 2. Gestion des Sessions Uniques

#### Description
Un système de gestion de sessions garantit qu'un seul utilisateur peut avoir une session active à la fois.

#### Caractéristiques
- **Session unique** : Une seule session active par utilisateur
- **Timeout de session** : Les sessions expirent automatiquement après 5 minutes d'inactivité
- **Indicateurs visuels** : L'état de la session est clairement affiché dans l'interface
- **Gestion propre** : Les sessions sont correctement terminées lorsque l'utilisateur se déconnecte ou que la session expire

#### Composants Clés
- `SessionManager` dans `src/components/SessionManager.tsx`
- `useSession` hook dans `src/hooks/useSession.ts`
- `useInactivityTimer` hook dans `src/hooks/useInactivityTimer.ts`

### 3. Validation JWT + Session

#### Description
Un système robuste de validation JWT et de session assure la sécurité des communications.

#### Caractéristiques
- **JWT sécurisé** : Tokens signés avec expiration de 5 minutes
- **Rafraîchissement automatique** : Les tokens sont automatiquement rafraîchis avant expiration
- **Validation côté client** : Les tokens sont validés avant envoi
- **Gestion des erreurs** : Messages d'erreur clairs en cas de token invalide ou expiré

#### Composants Clés
- `auth.ts` dans `src/lib/auth.ts`
- API route `/api/auth` dans `src/app/api/auth/route.ts`

### 4. Optimisation des Performances

#### Description
Plusieurs techniques d'optimisation ont été implémentées pour améliorer les performances de l'application.

#### Caractéristiques
- **Monitoring des performances** : Mesure du temps d'exécution des fonctions critiques
- **Débouncing** : Réduction des appels de fonction répétitifs
- **Throttling** : Limitation de la fréquence d'exécution des fonctions
- **Mémoization** : Mise en cache des résultats des fonctions coûteuses
- **Optimisation WebSocket** : Gestion efficace de la file d'attente des messages

#### Composants Clés
- `performance.ts` dans `src/lib/performance.ts`
- Optimisations appliquées à `WebSocketClient`

## Architecture Technique

### Structure des Fichiers

```
src/
├── components/
│   ├── SessionManager.tsx      # Gestion de l'état de la session
│   └── ...                     # Autres composants
├── hooks/
│   useInactivityTimer.ts       # Hook pour le timer d'inactivité
│   useSession.ts               # Hook pour la gestion de session
│   └── useWebSocket.ts         # Hook pour la communication WebSocket
├── lib/
│   auth.ts                     # Utilitaires d'authentification JWT
│   websocket.ts                # Client WebSocket optimisé
│   performance.ts              # Utilitaires d'optimisation des performances
│   └── ...                     # Autres bibliothèques
├── app/
│   api/
│   │   auth/
│   │   └── route.ts           # API route pour l'authentification
│   └── ...                     # Autres fichiers d'application
└── tests/
    ├── websocket.test.ts       # Tests WebSocket
    └── manual-test.md          # Guide de test manuel
```

### Flux de Communication

1. **Initialisation** :
   - L'utilisateur démarre une session via `SessionManager`
   - Un token JWT est généré via l'API `/api/auth`
   - Le client WebSocket se connecte avec le token

2. **Communication** :
   - L'utilisateur enregistre un message vocal
   - Le message est transcrit et envoyé via WebSocket
   - n8n traite le message et renvoie une réponse
   - La réponse est affichée dans l'interface

3. **Gestion de Session** :
   - Le timer d'inactivité surveille l'activité de l'utilisateur
   - Après 5 minutes d'inactivité, la session est automatiquement terminée
   - L'utilisateur est notifié et peut redémarrer une nouvelle session

## Configuration n8n

### Prérequis
- n8n version 1.103+ avec support WebSocket
- Configuration SSL pour WSS (WebSocket sécurisé)
- Reverse proxy (Nginx) pour la gestion des connexions WebSocket

### Configuration du Workflow n8n
1. **Webhook Trigger** : Point d'entrée pour les messages WebSocket
2. **JWT Validation** : Validation du token JWT reçu
3. **Session Management** : Vérification de l'état de la session
4. **Agent Conversationnel** : Traitement du message et génération de réponse
5. **WebSocket Response** : Envoi de la réponse via WebSocket

### Exemple de Configuration
Voir `n8n-configuration.md` pour les détails complets de la configuration n8n.

## Tests

### Tests Automatisés
- Tests unitaires pour les hooks personnalisés
- Tests d'intégration pour le client WebSocket
- Tests de validation JWT

### Tests Manuels
Un guide de test manuel complet est disponible dans `src/tests/manual-test.md`, couvrant :
- L'interface utilisateur
- La gestion de session
- L'enregistrement vocal
- La communication WebSocket
- La sécurité
- Les performances
- La responsivité

## Performances

### Métriques
- **Temps de réponse** : < 500ms pour l'envoi des messages
- **Taux de réussite** : > 95% des messages envoyés avec succès
- **Stabilité** : < 1% de déconnexions inattendues
- **Performance** : < 100ms pour la transcription vocale

### Optimisations
- **Débouncing** : Les messages sont débouncés pour éviter les envois répétitifs
- **Monitoring** : Le temps de traitement des messages est mesuré et optimisé
- **File d'attente** : Les messages sont mis en file d'attente lors des déconnexions
- **Heartbeat** : Mécanisme de ping/pong pour maintenir la connexion active

## Sécurité

### JWT
- Tokens signés avec une clé secrète
- Expiration de 5 minutes
- Rafraîchissement automatique avant expiration
- Validation côté client avant envoi

### WebSocket
- Communication sécurisée via WSS
- Validation des tokens à chaque connexion
- Gestion propre des déconnexions

### Session
- Une seule session active par utilisateur
- Timeout automatique après 5 minutes d'inactivité
- Terminaison propre des sessions expirées

## Prochaines Étapes

La Phase 3 se concentrera sur :
1. **Interface Conversationnelle** : Amélioration de l'affichage des conversations
2. **Indicateurs de Session** : Amélioration des indicateurs visuels
3. **Notifications de Timeout** : Notifications lorsque la session expire
4. **Tests End-to-End** : Tests complets de l'application
5. **Documentation** : Mise à jour de la documentation utilisateur
6. **Déploiement** : Déploiement en production

## Dépannage

### Problèmes Courants
1. **WebSocket ne se connecte pas** :
   - Vérifier que le serveur n8n est en cours d'exécution
   - Vérifier la configuration du reverse proxy
   - Vérifier les certificats SSL

2. **Session expire trop rapidement** :
   - Vérifier la configuration du timer d'inactivité
   - Vérifier que le heartbeat WebSocket fonctionne correctement

3. **Token JWT invalide** :
   - Vérifier la clé secrète JWT
   - Vérifier l'horloge du système
   - Vérifier la configuration de l'API d'authentification

### Journaux
Les journaux sont disponibles dans la console du navigateur pour le client, et dans les logs du serveur n8n pour le backend.

## Conclusion

La Phase 2 a implémenté avec succès une communication WebSocket persistante avec n8n, une gestion robuste des sessions, et une validation JWT sécurisée. Les performances ont été optimisées pour garantir une expérience utilisateur fluide et réactive.

La base est maintenant solide pour la Phase 3, qui se concentrera sur l'amélioration de l'interface utilisateur et la finalisation de l'application.