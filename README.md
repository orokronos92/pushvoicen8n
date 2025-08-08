# PushVoice - Phase 1 Implementation

## Overview

PushVoice est une application web qui permet aux utilisateurs de communiquer avec leur agent n8n via des commandes vocales. Cette implémentation couvre la Phase 1 du projet, qui se concentre sur l'envoi automatique des messages vocaux.

## Fonctionnalités Implémentées

### Phase 1: Envoi Automatique

✅ **Capture Vocale Automatisée**
- Activation/Désactivation par bouton
- Transcription en temps réel
- Détection de silence après 2 secondes
- Envoi automatique sans intervention manuelle
- Indicateurs visuels pendant l'enregistrement

✅ **Gestion des Sessions**
- Session de 5 minutes avec timeout
- Indicateur visuel du temps restant
- Démarrage/arrêt manuel de la session

✅ **Interface Conversationnelle**
- Affichage des messages utilisateur et n8n
- Distinction visuelle entre les expéditeurs
- Horodatage des messages
- Compteur de messages

✅ **Sécurité**
- Gestion JWT avec expiration de 5 minutes
- API endpoint pour la génération de tokens
- Validation des tokens côté client

✅ **Gestion des Erreurs**
- Messages d'erreur conviviaux
- Support multi-langues (français)
- Icônes contextuelles selon le type d'erreur
- Disparition automatique des erreurs

✅ **Design Responsive**
- Adaptation mobile et desktop
- Optimisation pour différentes tailles d'écran
- Réorganisation des composants sur mobile

## Structure du Projet

```
pushvoice/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── route.ts          # API endpoint pour l'authentification
│   │   ├── globals.css              # Styles globaux
│   │   ├── layout.tsx               # Layout principal
│   │   └── page.tsx                 # Page principale
│   ├── components/
│   │   ├── ConversationDisplay.tsx   # Affichage de la conversation
│   │   ├── ErrorDisplay.tsx         # Affichage des erreurs
│   │   ├── SessionManager.tsx       # Gestion des sessions
│   │   └── VoiceRecorder.tsx        # Enregistrement vocal
│   └── lib/
│       ├── auth.ts                  # Utilitaires JWT
│       ├── utils.ts                 # Utilitaires généraux
│       └── websocket.ts             # Client WebSocket
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Technologies Utilisées

- **Frontend**: Next.js 13+
- **Langage**: TypeScript
- **Styling**: Tailwind CSS
- **Reconnaissance Vocale**: react-speech-recognition
- **Authentification**: JWT (JSON Web Tokens)
- **Communication**: WebSocket (préparé pour Phase 2)

## Installation et Démarrage

### Prérequis

- Node.js 18+
- npm (ou yarn/pnpm)

### Installation

1. Cloner le dépôt
```bash
git clone <repository-url>
cd pushvoice
```

2. Installer les dépendances
```bash
npm install
```

3. Démarrer le serveur de développement
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Utilisation

1. **Démarrer une session**: Cliquez sur "Démarrer la Session"
2. **Enregistrer un message**: Cliquez sur le bouton du microphone et parlez
3. **Envoi automatique**: Le message sera envoyé automatiquement après 2 secondes de silence
4. **Voir les réponses**: Les réponses simulées apparaîtront dans la zone de conversation

## Variables d'Environnement

Créer un fichier `.env.local` à la racine du projet:

```env
JWT_SECRET=votre-clé-secrète-très-longue-et-complexe
NEXT_PUBLIC_WS_URL=ws://localhost:8080  # Pour Phase 2
```

## Prochaines Étapes (Phase 2)

- Intégration complète avec n8n via WebSocket
- Gestion avancée des sessions
- Validation JWT côté n8n
- Tests d'intégration

## Développement

### Scripts Disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm run start` - Démarrer le serveur de production
- `npm run lint` - Exécuter le linter

### Structure des Composants

- **VoiceRecorder**: Gère l'enregistrement vocal et la détection de silence
- **ConversationDisplay**: Affiche l'historique des messages
- **SessionManager**: Gère l'état et le timeout des sessions
- **ErrorDisplay**: Affiche les erreurs de manière conviviale

## Notes

- Cette implémentation simule les réponses de n8n pour la Phase 1
- La reconnaissance vocale nécessite une connexion HTTPS pour fonctionner sur la plupart des navigateurs
- L'application est optimisée pour les navigateurs modernes supportant la Web Speech API