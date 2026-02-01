# 💼 FreeBike Frontend - Interface d'Administration et Site Vitrine

Application web React avec Vite pour l'administration d'FreeBike et le site vitrine public.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Technologies](#technologies)
- [Installation](#installation)
- [Structure](#structure)
- [Fonctionnalités](#fonctionnalités)
- [Déploiement](#déploiement)
- [Configuration](#configuration)

## 🎯 Vue d'ensemble

Le frontend FreeBike est une application React moderne qui combine :
- **Interface d'Administration** : Dashboard complet pour gérer la flotte, les utilisateurs, les finances, etc.
- **Site Vitrine** : Page d'accueil publique avec présentation du service
- **Page d'Avis** : Formulaire public pour soumettre des témoignages

## 🛠️ Technologies

- **React 19.2+** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite 6.4+** - Build tool ultra-rapide
- **Tailwind CSS** - Styling utility-first
- **Radix UI** - Composants accessibles et personnalisables
- **Recharts** - Graphiques et visualisations
- **Lucide React** - Icons modernes
- **React Hook Form** - Gestion des formulaires
- **Sonner** - Système de notifications/toasts
- **React Router 7.9+** - Navigation
- **Leaflet** - Cartes interactives
- **Axios** - Client HTTP
- **i18next** - Internationalisation (FR/EN)

## 🚀 Installation

### Prérequis

- Node.js 20+
- npm ou yarn

### Installation

```bash
cd frontend
npm install
```

### Configuration

Créer un fichier `.env` :

```env
VITE_API_URL=http://localhost:10000/api/v1
VITE_APP_DOWNLOAD_URL=https://expo.dev/artifacts/...
VITE_APP_NAME=FreeBike
```

### Démarrage

```bash
# Développement
npm run dev

# Production (build)
npm run build
npm start
```

L'application démarre sur `http://localhost:3000`

## 📁 Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/              # Interface d'administration
│   │   │   ├── Dashboard/      # Tableau de bord
│   │   │   ├── Bikes/          # Gestion des vélos
│   │   │   ├── Users/          # Gestion des utilisateurs
│   │   │   ├── Financial/      # Dashboard financier
│   │   │   ├── Incidents/      # Gestion des signalements
│   │   │   ├── Employees/      # Gestion des employés
│   │   │   ├── Settings/       # Paramètres (Pricing, Company)
│   │   │   ├── Wallet/         # Gestion des portefeuilles
│   │   │   ├── Reservations/   # Gestion des réservations
│   │   │   ├── Review/         # Gestion des avis
│   │   │   ├── Logs/           # Logs d'activité
│   │   │   ├── Profile/        # Profil admin, notifications, chat
│   │   │   └── Security/       # Monitoring de sécurité
│   │   ├── landing/            # Site vitrine
│   │   │   ├── Header.tsx      # Header avec navigation
│   │   │   ├── Hero.tsx        # Section héro
│   │   │   ├── Features.tsx    # Fonctionnalités
│   │   │   ├── HowItWorks.tsx  # Comment ça marche
│   │   │   ├── Pricing.tsx     # Tarifs dynamiques
│   │   │   ├── Testimonials.tsx # Témoignages
│   │   │   ├── DownloadApp.tsx # Section téléchargement
│   │   │   └── Footer.tsx       # Footer
│   │   ├── auth/               # Authentification
│   │   │   ├── Login.tsx
│   │   │   └── VerifyEmail.tsx
│   │   ├── layout/             # Layouts
│   │   │   ├── AdminLayout.tsx # Layout admin avec sidebar
│   │   │   ├── Sidebar.tsx     # Navigation latérale
│   │   │   └── AdminTopBar.tsx # Barre supérieure
│   │   ├── ui/                 # Composants UI (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ... (autres composants)
│   │   └── shared/             # Composants partagés
│   ├── services/               # Services API
│   │   ├── api/
│   │   │   ├── client.ts       # Client API de base
│   │   │   ├── admin.service.ts
│   │   │   ├── bike.service.ts
│   │   │   ├── company.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── review.service.ts
│   │   │   └── ... (21 services)
│   ├── hooks/                  # Hooks React
│   │   ├── useAuth.tsx         # Authentification
│   │   ├── useCompanyInfo.ts  # Informations entreprise
│   │   └── ...
│   ├── lib/                    # Utilitaires
│   │   ├── i18n.tsx           # Internationalisation
│   │   └── ...
│   ├── contexts/               # Contextes React
│   ├── types/                  # Types TypeScript
│   ├── utils/                  # Fonctions utilitaires
│   ├── styles/                 # Styles globaux
│   ├── App.tsx                 # Point d'entrée React
│   └── main.tsx                # Bootstrap
├── public/                     # Fichiers statiques
├── vite.config.ts              # Configuration Vite
└── package.json
```

## ✨ Fonctionnalités

### Interface d'Administration

#### Dashboard
- 📊 Vue d'ensemble temps réel
- 🗺️ Carte interactive de la flotte
- 📈 Statistiques clés (revenus, utilisateurs, trajets)
- ⚠️ Alertes et incidents en attente
- 📊 Graphiques de performance

#### Gestion des Vélos
- ➕ Ajout/modification/suppression de vélos
- 🔋 Suivi de la batterie et de l'état
- 🛠️ Historique de maintenance
- 📍 Tracking GPS en temps réel
- 🔓 Gestion des déverrouillages
- 📊 Historique des trajets par vélo
- 🗺️ Visualisation sur carte

#### Gestion des Utilisateurs
- 👥 Liste paginée avec recherche avancée
- 🔍 Détails complets (trajets, wallet, incidents)
- 🚫 Blocage/déblocage de comptes
- 📧 Envoi d'emails personnalisés
- 💰 Gestion des soldes
- 📊 Statistiques par utilisateur

#### Finances
- 💰 Dashboard financier avec graphiques
- 📈 Revenus journaliers/mensuels/annuels
- 💸 Gestion des remboursements
- 🎟️ Codes promo et promotions
- 📊 Analytics avancées
- 📥 Export CSV/Excel/PDF

#### Gestion des Signalements
- 🎫 Liste des incidents
- ✅ Traitement et résolution
- 💰 Remboursements associés
- 📸 Visualisation des photos
- 📝 Notes internes

#### Avis & Témoignages
- ⭐ Modération des avis
- ✅ Publication/Rejet
- 📊 Statistiques de satisfaction

#### Employés & Rôles
- 👨‍💼 Gestion des employés
- 🔐 Système de rôles et permissions granulaire
- 📝 Logs d'activité (audit trail)

#### Support
- 💬 Chat avec les utilisateurs
- 📧 Emails en masse
- 🔔 Gestion des notifications

#### Paramètres
- ⚙️ Configuration de l'entreprise
- 💰 Configuration tarifaire (plans, règles, promotions)
- 🌍 Paramètres multilingues

### Site Vitrine

#### Page d'Accueil
- 🏠 Hero section avec CTA
- ✨ Présentation des fonctionnalités
- 💰 Affichage des tarifs dynamiques (depuis l'API)
- 📱 Section téléchargement de l'app
- ⭐ Témoignages utilisateurs
- 📝 Formulaire de soumission d'avis
- 🌍 Support multilingue (FR/EN)

#### Navigation
- Menu responsive (desktop/mobile)
- Sélecteur de langue
- Bouton "Donner un avis"
- Liens vers sections (scroll smooth)

### Page d'Avis Publique

- 📝 Formulaire de soumission d'avis
- 📸 Upload de photo (optionnel)
- ⭐ Système de notation (1-5 étoiles)
- 🌍 Support multilingue
- ✅ Pré-remplissage si utilisateur connecté

## 🔐 Authentification

### Connexion Admin

1. Accéder à `/login`
2. Entrer email et mot de passe
3. Redirection automatique vers `/admin/dashboard`

### Protection des Routes

Les routes admin sont protégées par :
- Authentification JWT
- Vérification des rôles
- Vérification des permissions

### Rôles Disponibles

- **SUPER_ADMIN** : Accès total
- **ADMIN** : Gestion complète (sauf employés/rôles)
- **EMPLOYEE** : Accès limité (vélos, incidents, maintenance)

## 🌍 Internationalisation

Le frontend supporte **français** et **anglais**.

### Utilisation

```typescript
import { useI18n } from '../lib/i18n';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
```

### Ajouter une traduction

Modifier `src/lib/i18n.tsx` :

```typescript
const translations: Translations = {
  'ma.cle': { fr: 'Texte français', en: 'English text' },
  // ...
};
```

## 📊 Scripts npm

```json
{
  "dev": "Démarrage en développement (Vite)",
  "build": "Build de production",
  "prestart": "Build avant de servir",
  "start": "Serveur de production (serve -s build)",
  "predeploy": "Build avant déploiement",
  "deploy": "Déploiement manuel sur GitHub Pages"
}
```

## 🚀 Déploiement

### Développement

```bash
npm run dev
```

### Production (Build)

```bash
npm run build
npm start
```

Les fichiers de build sont dans `build/`.

### Déploiement Automatique sur GitHub Pages

Un workflow GitHub Actions est configuré pour déployer automatiquement lors d'un push sur `main` qui modifie `frontend/**`.

**Configuration requise** :
1. Activer GitHub Pages dans les paramètres du dépôt
2. Configurer les secrets GitHub si nécessaire :
   - `VITE_API_URL`
   - `VITE_APP_DOWNLOAD_URL`
   - `VITE_APP_NAME`

Voir [.github/DEPLOY_FRONTEND.md](../.github/DEPLOY_FRONTEND.md) pour plus de détails.

## ⚙️ Configuration

### Variables d'Environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:10000/api/v1` |
| `VITE_APP_DOWNLOAD_URL` | URL de téléchargement de l'app | - |
| `VITE_APP_NAME` | Nom de l'application | `FreeBike` |

### Configuration Vite

Le fichier `vite.config.ts` contient :
- Configuration des plugins (React SWC)
- Alias de chemins
- Configuration de build
- Optimisations

## 🎨 Personnalisation

### Thèmes

Le frontend utilise Tailwind CSS avec un système de thème personnalisable.

### Composants UI

Les composants UI sont basés sur shadcn/ui et peuvent être personnalisés dans `src/components/ui/`.

## 🔧 Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Recherche globale (si implémenté) |
| `Esc` | Fermer les modals |

## 📱 Responsive Design

L'interface s'adapte à toutes les tailles d'écran :
- 💻 **Desktop** : Layout complet avec sidebar
- 📱 **Tablet** : Sidebar collapsible
- 📱 **Mobile** : Navigation optimisée

## 🐛 Dépannage

### L'application ne se connecte pas à l'API

1. Vérifier que le backend est démarré
2. Vérifier `VITE_API_URL` dans `.env`
3. Redémarrer le serveur de développement après modification de `.env`

### Les traductions ne s'affichent pas

1. Vérifier que `useI18n` est utilisé correctement
2. Vérifier que la clé existe dans `src/lib/i18n.tsx`
3. Vérifier que le provider `I18nProvider` entoure l'application

### Erreur de build

1. Vérifier que toutes les dépendances sont installées
2. Vérifier la version de Node.js (20+)
3. Supprimer `node_modules` et `package-lock.json`, puis réinstaller

## 📚 Ressources

- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation Tailwind CSS](https://tailwindcss.com/)
- [Documentation Radix UI](https://www.radix-ui.com/)

## 📞 Support

- 📧 Email : wekobrayan163@gmail.com
- 📱 WhatsApp : +237 690 37 44 20
- 🌐 Documentation complète : [README principal](../README.md)

## 📝 Licence

Copyright © 2025 FreeBike Cameroun. Tous droits réservés.