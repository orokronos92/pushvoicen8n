#!/bin/bash

# Script de déploiement pour PushVoice sur VPS Hostinger

echo "🚀 Début du déploiement de PushVoice..."

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Installation en cours..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker a été installé. Veuillez vous déconnecter et vous reconnecter."
    exit 0
fi

# Vérifier si Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Installation en cours..."
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose a été installé."
fi

# Créer les répertoires nécessaires
echo "📁 Création des répertoires..."
mkdir -p ssl
mkdir -p logs

# Demander les informations de configuration
read -p "Entrez votre nom de domaine (ex: exemple.com): " DOMAIN
read -p "Entrez votre JWT secret (générez un secret aléatoire): " JWT_SECRET

# Mettre à jour les fichiers de configuration
echo "⚙️  Mise à jour des fichiers de configuration..."
sed -i "s/votre-domaine.com/$DOMAIN/g" docker-compose.yml
sed -i "s/votre-domaine.com/$DOMAIN/g" nginx.conf
sed -i "s/votre-jwt-secret-tres-securise/$JWT_SECRET/g" docker-compose.yml

# Vérifier si les certificats SSL existent
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "🔒 Génération des certificats SSL auto-signés (à remplacer par Let's Encrypt en production)..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -subj "/C=FR/ST=France/L=Paris/O=PushVoice/CN=$DOMAIN"
    echo "⚠️  Certificats SSL auto-signés générés. Pour la production, utilisez Let's Encrypt."
fi

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire et démarrer les conteneurs
echo "🏗️  Construction et démarrage des conteneurs..."
docker-compose up --build -d

# Vérifier le statut des conteneurs
echo "📊 Vérification du statut des conteneurs..."
docker-compose ps

# Afficher les logs
echo "📋 Affichage des logs..."
docker-compose logs --tail=20

echo "✅ Déploiement terminé !"
echo "🌐 Votre application est accessible à l'adresse: https://$DOMAIN"
echo "📊 Pour voir les logs en temps réel: docker-compose logs -f"
echo "🛑 Pour arrêter l'application: docker-compose down"
echo "🔄 Pour redémarrer l'application: docker-compose restart"