# Api-Cash 💰

API REST sécurisée pour la gestion de caisse. Backend complet avec authentification multi-mode, gestion des transactions et génération de rapports.

Développée pour servir les applications de gestion commerciale (POS, caisses enregistreuses, systèmes de vente) avec une architecture moderne et évolutive.

## 🚀 Démarrage rapide

```bash
# 1. Cloner le projet
git clone https://github.com/DevBeneymar/api-cash.git
cd api-cash

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Éditez le fichier .env avec vos paramètres

# 4. Initialiser la base de données
npx prisma migrate dev --name init

# 5. Démarrer le serveur
npm run dev