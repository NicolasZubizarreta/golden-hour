# 🌅 Golden Hour — Notre Aventure

Golden Hour est une application web full-stack d'organisation de voyages et de sorties, pensée pour les couples et les groupes d'amis. Elle permet de créer des espaces privés modulables (via un système de widgets) pour planifier, budgétiser et garder une trace de vos meilleurs moments.

## 🚀 Fonctionnalités Principales (Core Engine)
- **Multi-Instances :** Créez des groupes dédiés à un voyage spécifique ou à votre couple.
- **Rejoindre par code :** Rejoignez facilement un groupe existant via un code unique (ex: `#422871`).
- **Gestion des Rôles (RBAC) :** Système de permissions strict (Admin, Éditeur, Membre).
- **Architecture Modulaire :** Le créateur du groupe peut activer/désactiver des widgets selon les besoins.

## 🧩 Widgets (En cours de développement)
- **Carte (Map) :** Ajoutez vos destinations prévues ou visitées (Leaflet).
- **Notes :** Post-its collaboratifs en temps réel.
- **YouTube Music & Deezer :** Lecteur musical intégré et playlists partagées du groupe.
- **Budget & Countdown :** Suivi des dépenses et compte à rebours avant le départ.

## 🛠️ Stack Technique
- **Front-end :** React.js (Vite), Zustand (State), Tailwind CSS v4.
- **Back-end :** Node.js, Express.js.
- **Base de données :** MySQL 8.
- **ORM :** Prisma (v6).
- **Sécurité :** JWT (JSON Web Tokens) & Bcryptjs.

## 👥 L'Équipe (Team Golden Hour)
- **Nicolas :** Chef de Projet & Lead Tech (Architecture globale et BDD)
- **Gabriel :** Développeur Back-end (API, Auth & Logique métier)
- **Bjorn :** UI/UX Designer & Développeur Front-end
- **Daran :** UI/UX Designer & Développeur Front-end

---

## 💻 Installation en local (Pour les développeurs)

### 1. Prérequis
- [Node.js](https://nodejs.org/) installé sur votre machine.
- Un serveur MySQL actif (via WAMP, XAMPP, Docker ou en local).

### 2. Cloner le projet
git clone [https://github.com/VotreOrganisation/golden-hour.git](https://github.com/VotreOrganisation/golden-hour.git)
cd golden-hour

### 3. Configuration du Back-end
cd backend
npm install

Créer un fichier .env dans le dossier backend en se basant sur le fichier .env.example :
# Renseignez vos propres accès MySQL
DATABASE_URL="mysql://root:password@localhost:3306/golden_hour"
JWT_SECRET="votre_cle_secrete"
PORT=5000

Générer la base de données avec Prisma :
npx prisma db push

Lancer le serveur :
npm run dev
# Le serveur tournera sur http://localhost:5000

### 4. Configuration du Front-end
Ouvrir un nouveau terminal :
cd frontend
npm install

npm run dev

### 📧 Tests d'envoi d'emails (Mot de passe oublié)

Pour tester l'envoi d'emails en local sans spammer de vraies adresses, nous utilisons **Mailtrap**.
1. Créez un compte gratuit sur [Mailtrap](https://mailtrap.io/).
2. Allez dans `Sandboxes` > `My Sandbox`.
3. Récupérez vos identifiants SMTP et ajoutez-les dans votre fichier `.env` (voir `.env.example`).
4. Les emails envoyés par l'API (ex: `POST /api/auth/forgot-password`) apparaîtront directement dans votre interface Mailtrap !
