# Guide de Déploiement de PushVoice sur VPS Hostinger

## Prérequis

1. **VPS Hostinger** avec accès SSH
2. **Nom de domaine** pointant vers votre VPS
3. **Accès root** ou sudo sur le VPS

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

### Option A: Utilisation du script automatisé (recommandé)

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script vous demandera:
- Votre nom de domaine
- Un JWT secret (générez-le avec: `openssl rand -base64 32`)

### Option B: Configuration manuelle

1. **Créer les répertoires nécessaires**
```bash
mkdir -p ssl logs
```

2. **Générer les certificats SSL**
```bash
# Pour la production, utilisez Let's Encrypt
# Pour les tests, utilisez des certificats auto-signés:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -subj "/C=FR/ST=France/L=Paris/O=PushVoice/CN=votre-domaine.com"
```

3. **Configurer les variables d'environnement**
```bash
# Modifier docker-compose.yml
sed -i 's/votre-domaine.com/votre-domaine.com/g' docker-compose.yml
sed -i 's/votre-jwt-secret-tres-securise/votre-jwt-secret/g' docker-compose.yml

# Modifier nginx.conf
sed -i 's/votre-domaine.com/votre-domaine.com/g' nginx.conf
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

## Étape 7: Configuration de Let's Encrypt (SSL gratuit)

Pour un certificat SSL valide en production:

1. **Arrêter Nginx**
```bash
docker-compose stop nginx
```

2. **Installer Certbot**
```bash
apt install certbot -y
```

3. **Générer le certificat**
```bash
certbot certonly --standalone -d votre-domaine.com -d www.votre-domaine.com
```

4. **Copier les certificats**
```bash
cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem ssl/key.pem
```

5. **Redémarrer Nginx**
```bash
docker-compose restart nginx
```

6. **Configurer le renouvellement automatique**
```bash
# Créer un cron job pour le renouvellement
crontab -e
```

Ajouter cette ligne:
```
0 12 * * * /usr/bin/certbot renew --quiet && cp /etc/letsencrypt/live/votre-domaine.com/fullchain.pem /root/pushvoicen8n/ssl/cert.pem && cp /etc/letsencrypt/live/votre-domaine.com/privkey.pem /root/pushvoicen8n/ssl/key.pem && cd /root/pushvoicen8n && docker-compose restart nginx
```

## Étape 8: Vérification du déploiement

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
docker-compose logs -f nginx
```

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
docker-compose logs -f [nom-du-service]
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

2. **Problèmes de SSL**
```bash
# Vérifier la configuration SSL
docker exec pushvoice-nginx nginx -t

# Vérifier les certificats
ls -la ssl/
```

3. **Problèmes de WebSocket**
```bash
# Vérifier la configuration WebSocket
docker exec pushvoice-nginx nginx -T

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
- **80**: HTTP (redirection vers HTTPS)
- **443**: HTTPS
- **3000**: Application interne (non exposé publiquement)

### Variables d'environnement importantes
- `JWT_SECRET`: Secret pour la signature des tokens JWT
- `NEXT_PUBLIC_WS_URL`: URL du WebSocket pour le client
- `NODE_ENV`: Environnement (production)

## Sécurité

1. **Changer le JWT secret** par défaut
2. **Utiliser des certificats SSL valides** (Let's Encrypt)
3. **Mettre à jour régulièrement** le système et les dépendances
4. **Limiter l'accès SSH** (utiliser des clés SSH plutôt que des mots de passe)
5. **Configurer un firewall** (UFW)
```bash
apt install ufw -y
ufw allow ssh
ufw allow 80
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

# Logs de Nginx
docker-compose logs -f nginx

# Logs système
journalctl -f
```

## Support

En cas de problème, vérifiez:
1. Les logs des conteneurs
2. La configuration réseau
3. Les certificats SSL
4. Les variables d'environnement

Pour une assistance supplémentaire, consultez la documentation du projet ou ouvrez une issue sur GitHub.