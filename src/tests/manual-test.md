# Guide de Test Manuel - PushVoice Phase 2

## Vue d'ensemble
Ce guide fournit des instructions pour tester manuellement les fonctionnalités implémentées dans la Phase 2 de PushVoice.

## Prérequis
- Navigateur moderne avec support WebSocket et reconnaissance vocale
- Accès au microphone
- Instance n8n avec configuration WebSocket (voir n8n-configuration.md)

## Tests à effectuer

### 1. Test de l'interface utilisateur

#### 1.1 Démarrage de l'application
1. Lancez l'application avec `npm run dev`
2. Ouvrez l'application dans votre navigateur
3. Vérifiez que l'interface s'affiche correctement
4. Vérifiez que tous les composants sont présents :
   - En-tête PushVoice
   - Zone de conversation
   - Gestionnaire de session
   - Enregistreur vocal

#### 1.2 Vérification du support du navigateur
1. Si votre navigateur ne supporte pas les fonctionnalités requises, un message d'erreur devrait s'afficher
2. Testez avec différents navigateurs (Chrome, Firefox, Safari, Edge)

### 2. Test de gestion de session

#### 2.1 Démarrage et arrêt de session
1. Cliquez sur "Démarrer la Session"
2. Vérifiez que :
   - Le bouton change pour "Terminer la Session"
   - Le timer de session s'affiche (5:00)
   - L'indicateur de session devient vert
3. Attendez quelques secondes, puis cliquez sur "Terminer la Session"
4. Vérifiez que :
   - Le bouton redevient "Démarrer la Session"
   - Le timer de session disparaît
   - L'indicateur de session devient gris

#### 2.2 Timeout de session
1. Démarrez une session
2. Ne faites aucune interaction pendant 5 minutes
3. Vérifiez que la session se termine automatiquement
4. Vérifiez qu'un message d'erreur s'affiche indiquant que la session a expiré

### 3. Test d'enregistrement vocal

#### 3.1 Enregistrement de base
1. Démarrez une session
2. Cliquez sur le bouton d'enregistrement (cercle rouge)
3. Parlez dans votre microphone
4. Vérifiez que :
   - Le cercle devient animé (pulsation)
   - Le texte "Enregistrement en cours..." s'affiche
   - Votre voix est transcrite en temps réel
5. Arrêtez de parler et attendez 2 secondes
6. Vérifiez que :
   - L'enregistrement s'arrête automatiquement
   - Le message est envoyé et affiché dans la conversation
   - Une réponse simulée s'affiche

#### 3.2 Envoi manuel
1. Pendant l'enregistrement, cliquez sur le bouton "Envoyer"
2. Vérifiez que le message est envoyé immédiatement

### 4. Test de communication WebSocket

#### 4.1 Connexion WebSocket
1. Regardez l'indicateur de connexion en bas à gauche de l'écran
2. Il devrait être vert (Connecté) lorsque l'application est chargée
3. Si vous déconnectez votre réseau, il devrait devenir rouge (Déconnecté)
4. Lorsque vous reconnectez votre réseau, il devrait redevenir vert

#### 4.2 Communication bidirectionnelle
1. Démarrez une session
2. Enregistrez et envoyez un message
3. Vérifiez que le message est envoyé via WebSocket (vous pouvez voir les logs dans la console du navigateur)
4. Vérifiez que la réponse est reçue via WebSocket

### 5. Test de sécurité

#### 5.1 Validation JWT
1. Essayez d'envoyer un message sans démarrer de session
2. Vérifiez qu'une erreur "Session inactive" s'affiche
3. Démarrez une session, attendez qu'elle expire, puis essayez d'envoyer un message
4. Vérifiez qu'une erreur "Session expirée" s'affiche

#### 5.2 Session unique
1. Ouvrez l'application dans deux onglets différents
2. Démarrez une session dans le premier onglet
3. Essayez de démarrer une session dans le deuxième onglet
4. Vérifiez que la première session est terminée lorsque la deuxième commence

### 6. Test de performance

#### 6.1 Temps de réponse
1. Mesurez le temps entre l'envoi d'un message et la réception de la réponse
2. Il devrait être inférieur à 500ms

#### 6.2 Utilisation mémoire
1. Ouvrez les outils de développement de votre navigateur
2. Allez dans l'onglet Performance
3. Enregistrez une session d'utilisation de 5 minutes
4. Vérifiez que l'utilisation mémoire reste stable

### 7. Test de responsivité

#### 7.1 Mobile
1. Ouvrez les outils de développement et activez le mode mobile
2. Testez différentes tailles d'écran
3. Vérifiez que l'interface s'adapte correctement

#### 7.2 Bureau
1. Redimensionnez la fenêtre du navigateur
2. Vérifiez que l'interface s'adapte correctement

## Checklist de test

- [ ] L'application se charge correctement
- [ ] Le support du navigateur est vérifié
- [ ] Les sessions peuvent être démarrées et arrêtées
- [ ] Le timeout de session fonctionne après 5 minutes d'inactivité
- [ ] L'enregistrement vocal fonctionne
- [ ] La détection de silence fonctionne (2 secondes)
- [ ] Les messages sont affichés dans la conversation
- [ ] La connexion WebSocket est établie
- [ ] Les messages sont envoyés et reçus via WebSocket
- [ ] La validation JWT fonctionne
- [ ] Une seule session active par utilisateur est autorisée
- [ ] L'interface est responsive
- [ ] Les performances sont acceptables

## Prochaines étapes

Après avoir effectué ces tests manuels, vous pouvez :
1. Corriger les problèmes identifiés
2. Implémenter les tests automatisés avec Vitest
3. Optimiser les performances
4. Mettre à jour la documentation