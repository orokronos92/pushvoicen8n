# Étape 1 : Construction de l'application
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Étape 2 : Exécution de l'application
FROM node:18-alpine AS runner

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de construction
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Définir les variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Exposer le port
EXPOSE 3000

# Créer le répertoire pour les logs avec les permissions appropriées
RUN mkdir -p /app/logs && chown -R nextjs:nodejs /app/logs

# Démarrer l'application
USER nextjs
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]