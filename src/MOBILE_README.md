# 📱 FreeBike - Application Mobile

Guide complet de l'application mobile FreeBike pour les utilisateurs.

## 📋 Table des Matières

- [Présentation](#présentation)
- [Installation](#installation)
- [Premiers Pas](#premiers-pas)
- [Fonctionnalités](#fonctionnalités)
- [Guide d'Utilisation](#guide-dutilisation)
- [FAQ](#faq)

## 🎯 Présentation

**FreeBike** est l'application mobile de location de vélos électriques au Cameroun. Louez un vélo en quelques secondes, payez avec votre mobile money, et profitez de la ville autrement !

### Pourquoi FreeBike ?

- ✅ **Simple** : Trouvez et déverrouillez un vélo en 30 secondes
- 💰 **Abordable** : À partir de 25 FCFA/minute
- 🌍 **Écologique** : Zéro émission, 100% électrique
- 🔒 **Sécurisé** : Paiement sécurisé via My-CoolPay
- 📍 **Accessible** : Des vélos partout à Douala

## 📲 Installation

### Progressive Web App (PWA)

L'application FreeBike est une **PWA** - pas besoin de télécharger depuis un store !

#### Sur Android / Chrome

1. Ouvrir `https://app.freebike.cm` dans Chrome
2. Cliquer sur le menu (⋮) → "Ajouter à l'écran d'accueil"
3. Confirmer l'installation
4. L'icône FreeBike apparaît sur votre écran d'accueil

#### Sur iOS / Safari

1. Ouvrir `https://app.freebike.cm` dans Safari
2. Appuyer sur le bouton Partager (□↑)
3. Défiler et sélectionner "Sur l'écran d'accueil"
4. Confirmer

#### Avantages de la PWA

- ✅ Pas de téléchargement sur Play Store / App Store
- ✅ Mises à jour automatiques
- ✅ Fonctionne offline (carte en cache)
- ✅ Notifications push
- ✅ Légère (< 5 MB)

## 🚀 Premiers Pas

### 1. Créer un Compte

#### Étapes d'inscription

1. Ouvrir l'application
2. Cliquer sur **"S'inscrire"**
3. Remplir le formulaire :
   - 📧 **Email** : Pour les notifications
   - 📱 **Téléphone** : Pour les paiements (format : +237 6XX XX XX XX)
   - 👤 **Prénom / Nom**
   - 🔒 **Mot de passe** : Minimum 8 caractères
4. Accepter les conditions d'utilisation
5. Cliquer sur **"Créer mon compte"**

#### Vérification

- Un email de confirmation est envoyé
- Cliquer sur le lien pour activer votre compte
- Connexion automatique après vérification

### 2. Recharger son Portefeuille

Avant de louer un vélo, il faut recharger votre wallet.

#### Méthodes de paiement acceptées

- 🟠 **Orange Money**
- 🔵 **MTN Mobile Money**
- 💳 **Carte bancaire** (bientôt)

#### Procédure de recharge

1. Aller dans **Profil** → **Portefeuille**
2. Cliquer sur **"+ Recharger"**
3. Entrer le montant (minimum 500 FCFA)
4. Sélectionner la méthode de paiement
5. Suivre les instructions :
   - **Orange** : Saisir #150# et valider la transaction
   - **MTN** : Composer *126# et suivre les étapes
6. Le solde est crédité instantanément après confirmation

#### Frais de transaction

| Montant | Frais CoolPay (1.5%) | Frais Orange/MTN | Total Frais |
|---------|----------------------|------------------|-------------|
| 1000 FCFA | 15 FCFA | 100 FCFA | 115 FCFA |
| 5000 FCFA | 75 FCFA | 100 FCFA | 175 FCFA |
| 10000 FCFA | 150 FCFA | 100 FCFA | 250 FCFA |

### 3. Louer votre Premier Vélo

#### Trouver un vélo

**Option 1 : Via la carte**
1. Aller dans l'onglet **Carte** (🗺️)
2. Autoriser la géolocalisation
3. Les vélos disponibles apparaissent en vert
4. Cliquer sur un marqueur pour voir les détails
5. Cliquer sur **"Réserver"**

**Option 2 : Scanner le QR code**
1. Cliquer sur l'onglet **Scanner** (📸)
2. Autoriser l'accès à la caméra
3. Scanner le QR code sur le vélo
4. Les détails du vélo s'affichent
5. Cliquer sur **"Déverrouiller"**

#### Inspection avant trajet

Avant de démarrer, vous devez inspecter le vélo :

1. **Photos obligatoires** :
   - Photo de face
   - Photo du cadran (batterie)
   - Photo des freins
   - Photo des pneus

2. **Checklist** :
   - ✅ Freins fonctionnels
   - ✅ Klaxon/sonnette
   - ✅ Phare avant/arrière
   - ✅ Pneus gonflés
   - ✅ Selle ajustée

3. Confirmer que tout est OK

#### Démarrage du trajet

- Une fois l'inspection validée, le vélo se déverrouille automatiquement
- Le chrono démarre ⏱️
- Le compteur de distance s'incrémente 📍
- Le coût s'affiche en temps réel 💰

## 🌟 Fonctionnalités

### 🏠 Page d'Accueil

**Vue d'ensemble** :
- 💰 **Solde** : Affichage du solde wallet en haut
- 🚲 **Vélos à proximité** : Carte miniature
- 📊 **Statistiques** : Trajets, distance, économies CO2
- ⭐ **Offres spéciales** : Promotions en cours

**Actions rapides** :
- 📸 Scanner un QR code
- 🗺️ Voir la carte complète
- 💳 Recharger le wallet
- 🔔 Voir les notifications

### 🗺️ Carte Interactive

**Fonctionnalités** :
- 📍 **Géolocalisation** : Position en temps réel
- 🔍 **Recherche d'adresse** : Chercher une destination
- 🚲 **Vélos disponibles** : Marqueurs verts
- 🔋 **Batterie** : Niveau affiché sur chaque vélo
- 📏 **Distance** : Distance jusqu'au vélo
- 🧭 **Navigation** : Itinéraire vers le vélo

**Filtres** :
- **Distance maximale** : 0.5 km, 1 km, 2 km, 5 km
- **Batterie minimale** : 20%, 50%, 80%
- **Type de vélo** : Électrique, mécanique
- **Zone de recherche** : Ma position, Domicile, Travail, Adresse

**Actions** :
- Centrer sur ma position
- Voir les zones de stationnement
- Voir les zones interdites
- Signaler un vélo mal garé

### 📸 Scanner QR

**Utilisation** :
1. Ouvrir le scanner
2. Pointer la caméra vers le QR code sur le guidon
3. Détection automatique
4. Affichage des informations du vélo
5. Bouton "Déverrouiller"

**Saisie manuelle** :
Si le scanner ne fonctionne pas :
- Cliquer sur "Saisir le code manuellement"
- Entrer le code à 6 chiffres sous le QR code
- Valider

### 🚴 Trajet en Cours

**Écran de trajet** :
- ⏱️ **Chronomètre** : Temps écoulé
- 📍 **Distance** : Kilomètres parcourus
- 💰 **Coût** : Montant en temps réel
- 🔋 **Batterie** : Autonomie restante
- 🗺️ **Carte** : Trajet parcouru

**Actions** :
- 🎵 **Musique** : Contrôles (si Bluetooth)
- 📸 **Photo** : Prendre une photo de voyage
- ⚠️ **Signaler** : Problème avec le vélo
- 🛑 **Terminer** : Fin du trajet

**Alertes automatiques** :
- ⚠️ Batterie faible (< 20%) : Suggestion de retour
- 🗺️ Sortie de zone autorisée : Frais supplémentaires
- ⏰ Durée longue (> 2h) : Suggestion de forfait

### 🏁 Fin de Trajet

**Procédure** :
1. Cliquer sur **"Terminer le trajet"**
2. Confirmation : "Êtes-vous à un point de stationnement ?"
3. Prendre une photo du vélo stationné
4. Inspection après trajet :
   - Vélo intact ? ✅ / ❌
   - Photos des éventuels dégâts
5. Verrouillage automatique du vélo
6. Paiement via wallet

**Récapitulatif** :
- ⏱️ Durée totale
- 📍 Distance parcourue
- 💰 Coût détaillé :
  - Prix de base
  - Frais de déblocage
  - Promotions appliquées
  - Total payé
- ⭐ Noter le trajet (1-5 étoiles)

### 📜 Historique des Trajets

**Liste des trajets** :
- Date et heure
- Vélo utilisé
- Durée et distance
- Montant payé
- Statut (Terminé / En cours / Annulé)

**Détails d'un trajet** :
- Carte du trajet parcouru
- Vitesse moyenne
- Points de départ et d'arrivée
- Économie CO2
- Facture téléchargeable (PDF)

**Statistiques globales** :
- 🚴 Nombre total de trajets
- 📏 Distance totale parcourue
- ⏱️ Temps total de pédalage
- 💰 Total dépensé
- 🌱 CO2 économisé
- 🏆 Badges et réalisations

### 💰 Portefeuille

**Vue d'ensemble** :
- 💳 **Solde actuel** : Montant disponible
- 📊 **Graphique** : Dépenses du mois
- 📋 **Transactions récentes** : 10 dernières

**Actions** :
- **+ Recharger** : Ajouter de l'argent
- **💸 Retirer** : Retrait vers Mobile Money (bientôt)
- **📄 Historique complet** : Toutes les transactions
- **🧾 Télécharger factures** : Export PDF

**Types de transactions** :
- ➕ Recharge (Orange, MTN)
- ➖ Paiement trajet
- 💰 Remboursement
- 🎁 Bonus / Code promo
- 💸 Frais de retard

**Filtres** :
- Date : Aujourd'hui, Cette semaine, Ce mois
- Type : Toutes, Recharges, Paiements, Remboursements
- Montant : Croissant / Décroissant

### 👤 Profil

**Informations personnelles** :
- Photo de profil
- Nom complet
- Email
- Téléphone
- Date de naissance
- Adresse

**Actions** :
- ✏️ Modifier le profil
- 📸 Changer la photo
- 🔒 Changer le mot de passe
- 🌍 Changer la langue (FR / EN)
- 🔔 Paramètres de notification

**Adresses enregistrées** :
- 🏠 Domicile
- 💼 Travail
- ⭐ Favoris

**Moyens de paiement** :
- Orange Money : **** 1234
- MTN Mobile Money : **** 5678
- Ajouter / Modifier / Supprimer

### 🔔 Notifications

**Types de notifications** :
- 🚲 **Trajets** : Démarrage, fin, problème
- 💰 **Wallet** : Recharge, paiement, solde faible
- 🎁 **Promotions** : Codes promo, offres spéciales
- 📢 **Informations** : Maintenance, nouveaux vélos
- 💬 **Support** : Réponse du service client

**Actions** :
- Marquer comme lu
- Supprimer
- Tout marquer comme lu

**Paramètres** :
- Activer / Désactiver par type
- Notifications push
- Notifications email
- Son / Vibration

### 💬 Chat Support

**Contacter le support** :
1. Aller dans **Profil** → **Support**
2. Ou cliquer sur l'icône 💬 dans n'importe quel écran
3. Sélectionner le sujet :
   - Problème de paiement
   - Problème avec un vélo
   - Question sur un trajet
   - Autre
4. Écrire votre message
5. Ajouter des pièces jointes (photos, captures)
6. Envoyer

**Fonctionnalités** :
- Réponse en moins de 5 minutes (7h-22h)
- Historique des conversations
- Notifications de réponse
- Évaluation du support

### ⚙️ Paramètres

**Compte** :
- Informations personnelles
- Sécurité
- Confidentialité

**Application** :
- 🌍 Langue (Français / English)
- 🔔 Notifications
- 📍 Localisation (Activée / Désactivée)
- 📶 Mode économie de données

**Paiement** :
- Moyens de paiement
- Historique
- Remboursements

**Aide** :
- FAQ
- Tutoriels vidéo
- Conditions d'utilisation
- Politique de confidentialité
- Nous contacter

**À propos** :
- Version de l'application
- Licence
- Crédits

## 📖 Guide d'Utilisation Détaillé

### Scénario 1 : Premier Trajet

**Contexte** : Marie vient de s'inscrire et veut louer son premier vélo.

1. **Inscription et vérification** ✅
   - Marie s'inscrit avec son email
   - Elle vérifie son email
   - Compte activé

2. **Recharge du wallet** 💰
   - Marie va dans Portefeuille
   - Elle recharge 5000 FCFA via Orange Money
   - Frais : 175 FCFA
   - Nouveau solde : 5000 FCFA

3. **Recherche d'un vélo** 🔍
   - Marie active la géolocalisation
   - Elle voit 3 vélos à moins de 500m
   - Elle sélectionne le plus proche (200m)
   - Batterie : 85% - Autonomie : 40 km

4. **Réservation** 📱
   - Clic sur "Réserver"
   - Marie a 10 minutes pour arriver au vélo
   - Elle suit l'itinéraire dans l'app

5. **Inspection** ✅
   - Arrivée au vélo
   - Scan du QR code
   - Photos : Face, Freins, Batterie
   - Checklist complétée
   - Déverrouillage automatique

6. **Trajet** 🚴‍♀️
   - Marie roule pendant 25 minutes
   - Distance parcourue : 5 km
   - Coût : 625 FCFA (25 min × 25 FCFA)

7. **Fin du trajet** 🏁
   - Marie arrive à destination
   - Elle stationne dans une zone autorisée
   - Photo du vélo stationné
   - Verrouillage confirmé
   - Paiement automatique : 625 FCFA
   - Nouveau solde : 4375 FCFA
   - Marie note 5⭐

### Scénario 2 : Signaler un Problème

**Contexte** : Paul a un vélo avec un pneu crevé en plein trajet.

1. **Incident** ⚠️
   - Paul roule depuis 10 minutes
   - Il entend un bruit bizarre
   - Le pneu arrière est à plat

2. **Signalement immédiat** 📱
   - Paul clique sur "⚠️ Signaler un problème"
   - Il sélectionne "Problème technique"
   - Sous-catégorie : "Pneu crevé"
   - Il prend 2 photos du pneu
   - Description : "Pneu arrière crevé, impossible de continuer"

3. **Fin de trajet forcée** 🛑
   - L'app propose de terminer le trajet sans frais
   - Paul accepte
   - Photo du vélo stationné
   - Verrouillage

4. **Traitement par l'équipe** 👨‍🔧
   - Le signalement est reçu par le support
   - Un agent de maintenance est envoyé
   - Paul reçoit une notification : "Pris en charge"

5. **Remboursement** 💰
   - 30 minutes plus tard :
   - Notification : "Remboursement de 250 FCFA effectué"
   - Paul reçoit aussi un bon de 500 FCFA en geste commercial

### Scénario 3 : Utiliser un Code Promo

**Contexte** : Sophie a reçu un code promo WELCOME10 pour 10% de réduction.

1. **Application du code** 🎁
   - Sophie démarre un trajet normalement
   - Avant de terminer, elle va dans "Codes Promo"
   - Elle saisit "WELCOME10"
   - Message : "✅ Code appliqué : -10% sur ce trajet"

2. **Économie** 💰
   - Trajet de 40 minutes = 1000 FCFA
   - Réduction 10% = -100 FCFA
   - Total à payer : 900 FCFA

3. **Codes promo fréquents** 🎟️
   - WELCOME10 : 10% pour les nouveaux (1 utilisation)
   - WEEK20 : 20% tous les week-ends (illimité)
   - FRIEND500 : 500 FCFA pour parrainage

## ❓ FAQ

### 💳 Paiement & Wallet

**Q : Quel est le montant minimum de recharge ?**  
R : 500 FCFA.

**Q : Y a-t-il des frais de recharge ?**  
R : Oui, frais CoolPay (1.5%) + Frais opérateur (100 FCFA).

**Q : Puis-je retirer l'argent de mon wallet ?**  
R : Pas encore, mais la fonctionnalité arrive bientôt.

**Q : Que se passe-t-il si mon solde est insuffisant ?**  
R : Vous ne pouvez pas démarrer un nouveau trajet. Rechargez d'abord.

**Q : Puis-je payer directement par Mobile Money sans recharger ?**  
R : Non, il faut d'abord recharger le wallet pour des raisons de sécurité.

### 🚲 Location de Vélos

**Q : Comment réserver un vélo ?**  
R : Via la carte ou en scannant le QR code.

**Q : Combien de temps dure ma réservation ?**  
R : 10 minutes. Après ce délai, le vélo est libéré.

**Q : Puis-je réserver plusieurs vélos ?**  
R : Non, une seule réservation/trajet à la fois.

**Q : Que faire si le vélo ne se déverrouille pas ?**  
R : 1) Vérifier la connexion Internet 2) Rescanner le QR 3) Contacter le support.

**Q : Puis-je utiliser le vélo hors de Douala ?**  
R : Non, les vélos doivent rester dans les zones de service définies.

### ⏱️ Trajets

**Q : Comment est calculé le prix ?**  
R : 25 FCFA/minute + 100 FCFA de frais de déblocage.

**Q : Y a-t-il un forfait illimité ?**  
R : Oui : 1h = 1000 FCFA, Journée = 5000 FCFA, Semaine = 25000 FCFA.

**Q : Que faire si j'oublie de terminer le trajet ?**  
R : Le trajet se termine automatiquement après 4h ou si vous vous éloignez du vélo.

**Q : Puis-je mettre en pause mon trajet ?**  
R : Non, mais vous pouvez verrouiller temporairement le vélo (le compteur continue).

### 🔧 Problèmes Techniques

**Q : Le vélo a un problème, que faire ?**  
R : Cliquer sur "⚠️ Signaler" immédiatement. Le trajet sera interrompu sans frais.

**Q : J'ai eu un accident, que faire ?**  
R : 1) Assurer votre sécurité 2) Appeler le 112 si nécessaire 3) Contacter le support FreeBike.

**Q : Le vélo est volé, suis-je responsable ?**  
R : Non, si le vélo était correctement verrouillé et que vous avez terminé le trajet.

### 🗺️ Zones et Stationnement

**Q : Où puis-je stationner le vélo ?**  
R : Dans les zones de stationnement autorisées (points bleus sur la carte).

**Q : Que se passe-t-il si je stationne hors zone ?**  
R : Frais de 1000 FCFA + Pénalité.

**Q : Puis-je sortir de Douala avec le vélo ?**  
R : Non, alerte automatique + Frais hors zone.

### 🔔 Notifications

**Q : Pourquoi je ne reçois pas les notifications ?**  
R : Vérifier : 1) Paramètres app 2) Paramètres téléphone 3) Connexion Internet.

**Q : Comment désactiver certaines notifications ?**  
R : Profil → Paramètres → Notifications → Personnaliser.

### 🌍 Langue & Support

**Q : Comment changer la langue ?**  
R : TopBar → Icône 🌍 → Sélectionner FR ou EN.

**Q : Comment contacter le support ?**  
R : Icône 💬 en bas à droite, ou Profil → Support.

**Q : Quels sont les horaires du support ?**  
R : 7h - 22h, 7j/7. Réponse en moins de 5 minutes.

## 🏆 Astuces & Bonus

### Maximiser vos Économies

1. **Utilisez les codes promo** : Vérifiez régulièrement les offres
2. **Forfaits** : Si > 40 min, prenez le forfait 1h (1000 FCFA)
3. **Week-ends** : Code WEEK20 pour -20%
4. **Parrainage** : Invitez des amis → 500 FCFA par ami

### Gagner des Badges

- 🥉 **Premier Trajet** : Terminer votre 1er trajet
- 🥈 **Habitué** : 10 trajets
- 🥇 **Expert** : 50 trajets
- 🏆 **Champion** : 100 trajets
- 🌱 **Écolo** : Économiser 100 kg de CO2
- ⚡ **Rapide** : Trajet de 10 km en 30 min

### Bien Entretenir les Vélos

- Signalez tout problème immédiatement
- Garez toujours dans les zones autorisées
- Ne surchargez pas le panier (max 5 kg)
- Respectez le code de la route

## 📞 Contact & Support

### Support Utilisateur

- 💬 **Chat in-app** : 7h-22h, 7j/7
- 📧 **Email** : support@freebike.cm
- 📱 **WhatsApp** : +237 6XX XX XX XX

### Urgences

- 🚨 **Accident** : 112 (pompiers/police)
- ⚠️ **Vol** : Contacter immédiatement le support + police

### Réseaux Sociaux

- 📘 **Facebook** : /FreeBikeCameroun
- 📷 **Instagram** : @freebike_cm
- 🐦 **Twitter** : @FreeBikeCM

---

**Bonne route avec FreeBike ! 🚴🌍💚**

*Version 1.0 - Octobre 2025*
