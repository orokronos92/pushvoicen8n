# Guide de Déploiement de PushVoice avec Traefik sur VPS Hostinger

## Prérequis

1. **VPS Hostinger** avec accès SSH
2. **Traefik déjà installé et configuré** sur votre VPS
3. **Nom de domaine** pointant vers votre VPS
4. **Accès root** ou sudo sur le VPS

## Étape 1: Connexion au VPS

```bash
ssh root@votre-ip-vps
```

## Étape 2: Mise à jour du système

```bash
apt update && apt upgrade -y
```

## Étape 3: Installation de Docker et Docker Compose

```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installation de Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Ajouter l'utilisateur au groupe docker
usermod -aG docker $USER
```

**Note:** Après cette étape, déconnectez-vous et reconnectez-vous pour que les changements prennent effet.

## Étape 4: Téléchargement du projet

```bash
# Cloner le dépôt
git clone https://github.com/orokronos92/pushvoicen8n.git
cd pushvoicen8n

# Ou si vous préférez télécharger les fichiers directement
# Transférez les fichiers du projet sur votre VPS via SCP ou SFTP
```

## Étape 5: Configuration

### Configuration des variables d'environnement

1. **Modifier docker-compose.yml**
```bash
# Remplacer les valeurs par défaut
sed -i 's/pushvoice.srv801583.hstgr.cloud/votre-domaine.com/g' docker-compose.yml
sed -i 's/pushvoice-secret-key-very-long-and-complex-2025/votre-jwt-secret-tres-securise/g' docker-compose.yml
sed -i 's/https:\/\/n8n.srv801583.hstgr.cloud\/webhook-test\/8d3b3e9f-2c90-4fc4-b1f5-33653ae0b17c/votre-url-n8n-webhook/g' docker-compose.yml
sed -i 's/lamangueverteestmure/votre-cle-api-n8n/g' docker-compose.yml
```

2. **Générer un JWT secret sécurisé**
```bash
# Générer un secret aléatoire
openssl rand -base64 32
```

### Configuration du réseau Traefik

Assurez-vous que le réseau `root_default` existe sur votre VPS :
```bash
# Vérifier les réseaux existants
docker network ls

# Si le réseau n'existe pas, le créer
docker network create root_default
```

## Étape 6: Déploiement

```bash
# Construire et démarrer les conteneurs
docker-compose up --build -d

# Vérifier le statut
docker-compose ps

# Voir les logs
docker-compose logs -f
```

## Étape 7: Vérification du déploiement

1. **Vérifier que l'application est accessible**
   - Ouvrez https://votre-domaine.com dans votre navigateur
   - L'application PushVoice devrait s'afficher

2. **Tester les fonctionnalités**
   - Démarrer une session
   - Tester l'enregistrement vocal
   - Vérifier les messages dans la conversation

3. **Vérifier les logs**
```bash
docker-compose logs -f pushvoice-app
```

## Configuration Traefik

Le docker-compose.yml inclut déjà les labels nécessaires pour Traefik :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.pushvoice.rule=Host(`votre-domaine.com`)"
  - "traefik.http.routers.pushvoice.entrypoints=websecure"
  - "traefik.http.routers.pushvoice.tls.certresolver=mytlschallenge"
  - "traefik.http.services.pushvoice.loadbalancer.server.port=3000"
```

Assurez-vous que :
- Traefik est configuré pour utiliser le certresolver `mytlschallenge`
- L'entrypoint `websecure` existe dans votre configuration Traefik
- Le réseau `root_default` est utilisé par Traefik

## Commandes utiles

### Gestion des conteneurs
```bash
# Démarrer les conteneurs
docker-compose up -d

# Arrêter les conteneurs
docker-compose down

# Redémarrer les conteneurs
docker-compose restart

# Voir le statut
docker-compose ps

# Voir les logs
docker-compose logs -f pushvoice-app
```

### Mise à jour de l'application
```bash
# Récupérer les dernières modifications
git pull origin master

# Reconstruire et redémarrer
docker-compose up --build -d
```

### Sauvegarde
```bash
# Sauvegarder les données
docker-compose down
tar -czf pushvoice-backup-$(date +%Y%m%d).tar.gz .
docker-compose up -d
```

## Dépannage

### Problèmes courants

1. **L'application ne démarre pas**
```bash
# Vérifier les logs
docker-compose logs pushvoice-app

# Vérifier les erreurs de construction
docker-compose build --no-cache pushvoice-app
```

2. **Problèmes de réseau avec Traefik**
```bash
# Vérifier que le réseau existe
docker network ls

# Vérifier la connectivité
docker network inspect root_default
```

3. **Problèmes de WebSocket**
```bash
# Vérifier la configuration WebSocket
# Tester la connexion WebSocket
wscat -c wss://votre-domaine.com/ws
```

4. **Mémoire insuffisante**
```bash
# Vérifier l'utilisation de la mémoire
free -h

# Nettoyer les images Docker inutilisées
docker system prune -a
```

### Ports utilisés
- **3001** : Application interne (mappé vers 3000 dans le conteneur)
- **443** : HTTPS (géré par Traefik)

### Variables d'environnement importantes
- `JWT_SECRET`: Secret pour la signature des tokens JWT
- `NEXT_PUBLIC_WS_URL`: URL du WebSocket pour le client
- `N8N_WEBHOOK_URL`: URL du webhook n8n
- `N8N_API_KEY`: Clé API pour n8n
- `NODE_ENV`: Environnement (production)

## Sécurité

1. **Changer le JWT secret** par défaut
2. **Utiliser des certificats SSL valides** (gérés par Traefik)
3. **Mettre à jour régulièrement** le système et les dépendances
4. **Limiter l'accès SSH** (utiliser des clés SSH plutôt que des mots de passe)
5. **Configurer un firewall** (UFW)
```bash
apt install ufw -y
ufw allow ssh
ufw allow 443
ufw enable
```

## Monitoring

### Surveillance des ressources
```bash
# Utilisation du CPU et de la mémoire
htop

# Espace disque
df -h

# Utilisation du disque par conteneur
docker system df
```

### Logs
```bash
# Logs de l'application
docker-compose logs -f pushvoice-app

# Logs Traefik
docker logs -f traefik

# Logs système
journalctl -f
```

## Intégration avec n8n

Pour que la communication avec n8n fonctionne correctement :

1. **Configurer n8n pour accepter les WebSockets**
   - Assurez-vous que n8n est accessible via HTTPS
   - Configurez les endpoints WebSocket dans n8n

2. **Configurer le webhook n8n**
   - Créez un webhook dans n8n pour recevoir les messages
   - Configurez le webhook pour renvoyer les réponses

3. **Tester la communication**
   - Envoyez un message vocal depuis l'interface
   - Vérifiez que le message est reçu par n8n
   - Vérifiez que la réponse est affichée dans l'interface

## Support

En cas de problème, vérifiez :
1. Les logs des conteneurs
2. La configuration réseau
3. La configuration Traefik
4. Les variables d'environnement

Pour une assistance supplémentaire, consultez la documentation du projet ou ouvrez une issue sur GitHub.