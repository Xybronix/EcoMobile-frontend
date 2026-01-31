# 💼 FreeBike - Interface d'Administration

Guide complet de l'interface web d'administration FreeBike.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Accès et Authentification](#accès-et-authentification)
- [Navigation](#navigation)
- [Fonctionnalités](#fonctionnalités)
- [Guide d'utilisation](#guide-dutilisation)

## 🎯 Vue d'ensemble

L'interface d'administration FreeBike est une application web React qui permet aux administrateurs et employés de gérer l'ensemble de l'écosystème FreeBike :

- 🚲 Gestion de la flotte de vélos
- 👥 Gestion des utilisateurs
- 💰 Suivi financier et analytics
- 🔧 Maintenance et incidents
- 👨‍💼 Gestion des employés et rôles
- 💬 Support client
- ⚙️ Configuration de l'entreprise

## 🔐 Accès et Authentification

### Connexion

1. Accéder à l'URL : `http://localhost:5173` (dev) ou `https://admin.freebike.cm` (prod)
2. Cliquer sur "Admin Login" dans le header
3. Entrer vos identifiants :
   - **Email** : admin@freebike.cm
   - **Mot de passe** : (fourni par le super admin)

### Comptes par défaut (développement)

```
Super Admin:
- Email: admin@freebike.cm
- Password: admin123

Manager:
- Email: manager@freebike.cm
- Password: manager123

Support:
- Email: support@freebike.cm
- Password: support123
```

### Rôles et Permissions

| Rôle | Permissions |
|------|-------------|
| **Super Admin** | Accès total, gestion des employés et rôles |
| **Manager** | Gestion vélos, utilisateurs, finances, statistiques |
| **Maintenance** | Gestion vélos, incidents, maintenance uniquement |
| **Support** | Chat, tickets, utilisateurs (lecture seule) |
| **Finance** | Finances, transactions, remboursements |

## 🧭 Navigation

### Sidebar (Barre latérale)

La sidebar contient toutes les sections principales :

```
📊 Dashboard          - Vue d'ensemble
🚲 Gestion Vélos      - Flotte et maintenance
👥 Utilisateurs       - Gestion utilisateurs
💰 Finances           - Revenus et transactions
🎫 Signalements       - Incidents et problèmes
👨‍💼 Employés          - Gestion équipe
🔐 Rôles              - Permissions
💬 Chat               - Support client
⚙️ Paramètres         - Configuration
📝 Logs               - Activités
🔔 Notifications      - Alertes
👤 Profil             - Mon profil
```

**Astuce** : La sidebar est collapsible. Cliquer sur l'icône ☰ pour la réduire et gagner de l'espace.

### Top Bar (Barre supérieure)

- 🔔 **Notifications** : Alertes en temps réel
- 🌍 **Langue** : Basculer FR ⇄ EN
- 👤 **Profil** : Avatar + menu déroulant
  - Mon profil
  - Paramètres
  - Déconnexion

## ✨ Fonctionnalités

### 📊 Dashboard

Le tableau de bord offre une vue d'ensemble complète :

#### Statistiques Clés
- 🚲 **Vélos Disponibles** : X/Y vélos disponibles
- 👥 **Utilisateurs Actifs** : Nombre d'utilisateurs connectés
- 💰 **Revenus du Jour** : Revenus en FCFA
- ⚠️ **Signalements** : Incidents en attente

#### Carte Temps Réel
- Visualisation de tous les vélos sur une carte interactive
- Filtres : disponibles, en cours, en maintenance
- Clustering pour les zones denses
- Clic sur un marker → détails du vélo

#### Trajets en Cours
- Liste des trajets actifs
- Utilisateur, vélo, durée, distance
- Suivi en temps réel

#### Signalements Récents
- 3 derniers incidents
- Type, statut, montant remboursement
- Actions rapides

#### Stats Rapides
- Trajets complétés aujourd'hui
- Distance totale parcourue
- Taux d'occupation de la flotte
- Durée moyenne des trajets

### 🚲 Gestion des Vélos

#### Liste des Vélos

**Fonctionnalités** :
- 📋 Tableau paginé (10, 25, 50, 100 items/page)
- 🔍 Recherche par nom, ID, code QR
- 🏷️ Filtres : statut, emplacement, batterie
- 📊 Tri par colonne (nom, statut, batterie, localisation)
- 📤 Export : CSV, Excel, PDF

**Colonnes** :
- ID vélo
- Nom
- Statut (Disponible / En cours / Maintenance / Hors service)
- Batterie (% avec icône)
- Localisation
- Dernier trajet
- Actions (Voir / Modifier / Supprimer)

#### Ajouter un Vélo

Cliquer sur **"+ Ajouter un Vélo"**

**Informations requises** :
1. **Général**
   - Nom du vélo
   - Code QR (généré automatiquement)
   - Type (Électrique / Mécanique)
   - Modèle / Marque

2. **Localisation**
   - Latitude / Longitude (ou cliquer sur carte)
   - Adresse
   - Zone de service

3. **Caractéristiques**
   - Batterie (%)
   - Autonomie (km)
   - Vitesse max (km/h)
   - Équipements (casque, antivol, panier, etc.)

4. **Tarification**
   - Tarif/heure ou forfait

**Validation** : Tous les champs requis doivent être remplis.

#### Modifier un Vélo

Cliquer sur l'icône ✏️ dans la colonne Actions.

**Modifications possibles** :
- Changer le statut (disponible, maintenance, hors service)
- Mettre à jour la batterie
- Changer la localisation
- Modifier les tarifs
- Ajouter des notes de maintenance

#### Voir les Détails

Cliquer sur l'icône 👁️ pour voir :
- Informations complètes
- Historique des trajets
- Historique de maintenance
- Localisation sur carte
- Photos du vélo
- QR code imprimable

### 👥 Gestion des Utilisateurs

#### Liste des Utilisateurs

**Fonctionnalités** :
- 📋 Tableau paginé avec recherche
- 🔍 Filtres : statut, date d'inscription, solde
- 📊 Tri multi-colonnes
- 📤 Export CSV/Excel

**Colonnes** :
- Photo de profil
- Nom complet
- Email / Téléphone
- Statut (Actif / Bloqué / Suspendu)
- Solde wallet
- Date d'inscription
- Nombre de trajets
- Actions

#### Voir un Utilisateur

Cliquer sur un utilisateur pour voir :

1. **Profil**
   - Informations personnelles
   - Photo, email, téléphone
   - Date d'inscription
   - Statut du compte

2. **Wallet**
   - Solde actuel
   - Historique des transactions
   - Recharges et paiements

3. **Trajets**
   - Historique complet
   - Durée, distance, coût
   - Évaluations

4. **Signalements**
   - Incidents déclarés
   - Statut des remboursements

5. **Actions**
   - ✉️ Envoyer un email
   - 🚫 Bloquer le compte
   - ✅ Débloquer le compte
   - 💰 Ajuster le solde
   - 🗑️ Supprimer le compte

#### Bloquer un Utilisateur

1. Aller dans les détails de l'utilisateur
2. Cliquer sur "Bloquer le compte"
3. Sélectionner une raison :
   - Comportement inapproprié
   - Fraude / Paiement
   - Vélo non retourné
   - Autre (spécifier)
4. Confirmer

L'utilisateur ne pourra plus se connecter ni louer de vélos.

### 💰 Finances

#### Dashboard Financier

**Vue d'ensemble** :
- 💵 Revenus totaux (jour / semaine / mois / année)
- 📈 Graphiques de tendance
- 💳 Transactions par méthode de paiement
- 🎟️ Codes promo utilisés
- 💸 Remboursements effectués

**Graphiques disponibles** :
- Revenus par jour (ligne)
- Revenus par heure (bar)
- Distribution par méthode de paiement (donut)
- Top utilisateurs par dépenses (bar)

#### Transactions

**Filtres** :
- Date (aujourd'hui, cette semaine, ce mois, personnalisé)
- Type (recharge, paiement, remboursement)
- Méthode (Orange Money, MTN, carte bancaire)
- Montant (min/max)
- Statut (réussi, en attente, échoué)

**Actions** :
- 📥 Télécharger les factures
- 💸 Initier un remboursement
- 📧 Envoyer un reçu par email

#### Codes Promo

**Créer un code promo** :
1. Cliquer sur "+ Nouveau Code Promo"
2. Remplir :
   - **Code** : ex. WELCOME10
   - **Type** : Pourcentage ou Montant fixe
   - **Valeur** : ex. 10% ou 500 FCFA
   - **Utilisations max** : ex. 100
   - **Date d'expiration**
   - **Conditions** : montant min, nouveaux utilisateurs uniquement, etc.
3. Enregistrer

**Gestion** :
- Activer / Désactiver
- Voir les statistiques d'utilisation
- Modifier les paramètres
- Supprimer

#### Remboursements

**Créer un remboursement** :
1. Aller dans Finances → Remboursements
2. Cliquer sur "+ Nouveau Remboursement"
3. Sélectionner :
   - Utilisateur
   - Trajet concerné (optionnel)
   - Montant
   - Raison (vélo défectueux, surfacturation, geste commercial, etc.)
4. Confirmer

**Statuts** :
- ⏳ En attente - En cours de traitement
- ✅ Approuvé - Remboursement effectué
- ❌ Refusé - Demande rejetée

### 🎫 Gestion des Signalements

#### Types de Signalements

- 🔧 **Problème technique** : Vélo défectueux, batterie vide, etc.
- 💰 **Problème de paiement** : Surfacturation, erreur de transaction
- 🚨 **Incident de trajet** : Accident, vol, vandalisme
- 🗺️ **Mauvaise localisation** : Vélo mal garé, zone interdite
- 💬 **Autre** : Autres problèmes

#### Traiter un Signalement

1. Cliquer sur le signalement dans la liste
2. Lire la description et voir les photos
3. Choisir une action :
   - **Approuver** → Change le statut en "En traitement"
   - **Résoudre** → Marquer comme résolu
   - **Rembourser** → Créer un remboursement automatique
   - **Assigner** → Assigner à un employé (maintenance, support)
   - **Rejeter** → Refuser le signalement (avec raison)
4. Ajouter des notes internes

**Notifications** :
- L'utilisateur reçoit une notification à chaque changement de statut
- Email automatique en cas de remboursement

### 👨‍💼 Gestion des Employés

#### Ajouter un Employé

1. Cliquer sur "+ Nouvel Employé"
2. Remplir :
   - **Informations** : Nom, email, téléphone
   - **Rôle** : Super Admin, Manager, Maintenance, Support, Finance
   - **Département** : Opérations, Technique, Service Client, etc.
   - **Statut** : Actif / Inactif
3. L'employé reçoit un email avec ses identifiants

#### Permissions par Rôle

**Super Admin** :
- ✅ Gestion complète des vélos
- ✅ Gestion des utilisateurs
- ✅ Gestion des finances
- ✅ Gestion des employés et rôles
- ✅ Paramètres de l'entreprise
- ✅ Logs et audit

**Manager** :
- ✅ Gestion des vélos
- ✅ Gestion des utilisateurs
- ✅ Vue finances (lecture seule)
- ✅ Signalements
- ❌ Employés / Rôles

**Maintenance** :
- ✅ Gestion vélos (statut, maintenance)
- ✅ Signalements techniques
- ❌ Utilisateurs, Finances, Employés

**Support** :
- ✅ Chat client
- ✅ Tickets support
- ✅ Vue utilisateurs (lecture seule)
- ❌ Vélos, Finances, Employés

**Finance** :
- ✅ Dashboard financier
- ✅ Transactions
- ✅ Remboursements
- ✅ Codes promo
- ❌ Vélos, Employés

### 🔐 Gestion des Rôles

#### Créer un Rôle Personnalisé

1. Aller dans Rôles → "+ Nouveau Rôle"
2. Nommer le rôle : ex. "Superviseur de Zone"
3. Sélectionner les permissions :
   - **Vélos** : Créer, Lire, Modifier, Supprimer
   - **Utilisateurs** : Créer, Lire, Modifier, Supprimer, Bloquer
   - **Trajets** : Lire, Modifier
   - **Finances** : Lire, Modifier, Remboursements
   - **Signalements** : Lire, Traiter
   - **Employés** : Lire, Créer, Modifier
   - **Rôles** : Lire
   - **Paramètres** : Lire, Modifier
   - **Logs** : Lire
4. Enregistrer

Le rôle apparaîtra dans la liste déroulante lors de la création d'employés.

### 💬 Chat Support

#### Interface de Chat

**Sections** :
- **Conversations actives** : Chats en cours avec utilisateurs
- **En attente** : Nouveaux messages non assignés
- **Résolus** : Conversations fermées

#### Gérer une Conversation

1. Cliquer sur une conversation dans la liste
2. Voir l'historique complet
3. Répondre au message
4. Actions disponibles :
   - 📌 Épingler la conversation
   - 👤 Assigner à un agent
   - ✅ Marquer comme résolu
   - 🗑️ Supprimer la conversation

**Réponses rapides** :
- Créer des modèles de réponses fréquentes
- Raccourcis clavier : `/reponse-1`, `/reponse-2`, etc.

**Pièces jointes** :
- Images, PDF jusqu'à 5 MB
- Partage de localisation
- Liens vers trajets/vélos

### ⚙️ Paramètres de l'Entreprise

#### Informations Générales

- **Nom de l'entreprise** : FreeBike Cameroun
- **Email** : contact@freebike.cm
- **Téléphone** : +237 6XX XX XX XX
- **Adresse** : Douala, Cameroun
- **Logo** : Upload du logo (PNG, JPG)

#### Configuration des Tarifs

**Tarifs de base** :
- Prix par minute : 25 FCFA
- Prix par heure : 1000 FCFA
- Forfait journalier : 5000 FCFA
- Forfait hebdomadaire : 25000 FCFA

**Frais supplémentaires** :
- Frais de déblocage : 100 FCFA
- Frais de retard (par 30 min) : 500 FCFA
- Frais hors zone : 1000 FCFA

**Frais de paiement** :
- Frais CoolPay : 1.5%
- Frais Orange Money : 100 FCFA fixe
- Frais MTN Mobile Money : 100 FCFA fixe

#### Zones de Service

**Gérer les zones** :
1. Cliquer sur "Zones de Service"
2. Dessiner sur la carte :
   - **Zones autorisées** (vert) : Location possible
   - **Zones interdites** (rouge) : Blocage GPS
   - **Zones de stationnement** (bleu) : Parking obligatoire
3. Nommer et enregistrer la zone

**Alertes géofencing** :
- Notification si un vélo sort de la zone autorisée
- Facturation automatique de frais hors zone

#### Notifications Push

**Configurer les notifications** :
- ✅ Trajet commencé / terminé
- ✅ Batterie faible (< 20%)
- ✅ Promotion disponible
- ✅ Nouveau message du support
- ✅ Maintenance programmée
- ✅ Rappel de paiement

### 📝 Logs d'Activité

#### Consultation des Logs

**Filtres disponibles** :
- **Date** : Aujourd'hui, 7 derniers jours, 30 derniers jours, personnalisé
- **Action** : Connexion, Modification vélo, Blocage utilisateur, etc.
- **Employé** : Filtrer par agent
- **Rôle** : Filtrer par rôle

**Informations enregistrées** :
- Action effectuée
- Employé responsable
- Date et heure exacte
- Adresse IP
- User Agent (navigateur)
- Métadonnées (avant/après modifications)

**Export** :
- Télécharger en CSV pour audit comptable
- Génération de rapports mensuels

### 🔔 Notifications

#### Types de Notifications

**Système** :
- ⚠️ Alertes critiques (vélo volé, panne serveur)
- 🔧 Maintenance programmée
- 💰 Seuil de revenus atteint

**Utilisateurs** :
- 👤 Nouvel utilisateur inscrit
- 💬 Nouveau message support
- 🎫 Nouveau signalement

**Opérationnel** :
- 🚲 Vélo à faible batterie (< 10%)
- 🗺️ Vélo hors zone autorisée
- ⏰ Vélo non utilisé depuis 7 jours

#### Paramètres de Notification

**Canaux** :
- ✅ Notifications web (dans l'app)
- ✅ Email
- ✅ SMS (optionnel)

**Fréquence** :
- Instantané
- Résumé horaire
- Résumé quotidien

## 🎨 Personnalisation

### Thèmes

L'interface supporte 2 thèmes :
- ☀️ **Clair** (par défaut)
- 🌙 **Sombre** (en développement)

### Langue

Basculer entre **Français** et **Anglais** via l'icône 🌍 dans la TopBar.

Toutes les interfaces, emails et notifications s'adaptent automatiquement.

## 🔧 Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Recherche globale |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + N` | Nouvelle notification |
| `Ctrl + /` | Aide |
| `Esc` | Fermer les modals |

## 📱 Responsive Design

L'interface s'adapte à toutes les tailles d'écran :
- 💻 **Desktop** : Layout complet avec sidebar
- 📱 **Tablet** : Sidebar collapsible
- 📱 **Mobile** : Bottom navigation

## ⚠️ Bonnes Pratiques

### Sécurité

- 🔐 Ne jamais partager vos identifiants
- 🔄 Changer votre mot de passe régulièrement
- 🚪 Toujours se déconnecter après utilisation
- 👀 Vérifier les logs d'activité régulièrement

### Gestion des Vélos

- ✅ Mettre à jour le statut immédiatement après maintenance
- 📸 Prendre des photos avant/après réparation
- 🔋 Vérifier la batterie quotidiennement
- 📍 S'assurer que la localisation est à jour

### Support Client

- ⏱️ Répondre aux messages en moins de 5 minutes
- 💬 Utiliser un ton professionnel et courtois
- ✅ Toujours clore les conversations une fois résolues
- 📝 Documenter les problèmes récurrents

## 🆘 Dépannage

### Problèmes Courants

**Je ne peux pas me connecter**
- Vérifier email/mot de passe
- Vider le cache du navigateur
- Contacter le super admin

**La carte ne s'affiche pas**
- Vérifier la connexion Internet
- Autoriser la géolocalisation dans le navigateur
- Rafraîchir la page (F5)

**Les données ne se chargent pas**
- Vérifier que le backend est démarré
- Ouvrir la console (F12) et vérifier les erreurs
- Contacter le support technique

## 📞 Support Technique

En cas de problème :
- 📧 Email : tech@freebike.cm
- 📱 WhatsApp : +237 6XX XX XX XX
- 🌐 Documentation : https://docs.freebike.cm

---

**Dernière mise à jour** : Octobre 2025
