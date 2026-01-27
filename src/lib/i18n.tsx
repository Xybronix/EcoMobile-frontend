import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'fr' | 'en';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
  };
}

const translations: Translations = {
  // Auth
  'auth.login': { fr: 'Connexion', en: 'Login' },
  'auth.email': { fr: 'Email', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },
  'auth.rememberMe': { fr: 'Se souvenir de moi', en: 'Remember me' },
  'auth.forgotPassword': { fr: 'Mot de passe oublié?', en: 'Forgot password?' },
  'auth.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'auth.logout': { fr: 'Déconnexion', en: 'Logout' },
  
  // Navigation
  'nav.dashboard': { fr: 'Tableau de bord', en: 'Dashboard' },
  'nav.bikes': { fr: 'Gestion Vélos', en: 'Bike Management' },
  'nav.bikeActions': { fr: 'Déverrouillage Vélos', en: 'Bike Unlock' },
  'nav.users': { fr: 'Utilisateurs', en: 'Users' },
  'nav.financial': { fr: 'Finances', en: 'Financial' },
  'nav.incidents': { fr: 'Signalements', en: 'Incidents' },
  'nav.pricing': { fr: 'Tarification', en: 'Pricing' },
  'nav.employees': { fr: 'Employés', en: 'Employees' },
  'nav.roles': { fr: 'Rôles & Permissions', en: 'Roles & Permissions' },
  'nav.logs': { fr: 'Logs d\'Activité', en: 'Activity Logs' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },
  
  // Dashboard
  'dashboard.title': { fr: 'Dashboard EcoMobile', en: 'EcoMobile Dashboard' },
  'dashboard.overview': { fr: 'Vue d\'ensemble de la flotte et des opérations', en: 'Fleet and operations overview' },
  'dashboard.availableBikes': { fr: 'Vélos Disponibles', en: 'Available Bikes' },
  'dashboard.activeUsers': { fr: 'Utilisateurs Actifs', en: 'Active Users' },
  'dashboard.todayRevenue': { fr: 'Revenus du Jour', en: 'Today\'s Revenue' },
  'dashboard.pendingIncidents': { fr: 'Signalements en Attente', en: 'Pending Incidents' },
  'dashboard.realtimeMap': { fr: 'Carte Temps Réel', en: 'Real-time Map' },
  'dashboard.activeTrips': { fr: 'Trajets en Cours', en: 'Active Trips' },
  'dashboard.recentIncidents': { fr: 'Signalements Récents', en: 'Recent Incidents' },
  
  // Bikes
  'bikes.management': { fr: 'Gestion de la Flotte', en: 'Fleet Management' },
  'bikes.monitoring': { fr: 'Monitoring et contrôle des vélos électriques', en: 'E-bike monitoring and control' },
  'bikes.total': { fr: 'Total Vélos', en: 'Total Bikes' },
  'bikes.available': { fr: 'Disponibles', en: 'Available' },
  'bikes.inUse': { fr: 'En Utilisation', en: 'In Use' },
  'bikes.maintenance': { fr: 'Maintenance', en: 'Maintenance' },
  'bikes.addNew': { fr: 'Nouveau Vélo', en: 'New Bike' },
  'bikes.details': { fr: 'Détails du Vélo', en: 'Bike Details' },
  'bikes.edit': { fr: 'Modifier', en: 'Edit' },
  'bikes.delete': { fr: 'Supprimer', en: 'Delete' },
  'bikes.battery': { fr: 'Batterie', en: 'Battery' },
  'bikes.gpsSignal': { fr: 'Signal GPS', en: 'GPS Signal' },
  'bikes.gsmSignal': { fr: 'Signal GSM', en: 'GSM Signal' },
  'bikes.zone': { fr: 'Zone', en: 'Zone' },
  'bikes.speed': { fr: 'Vitesse', en: 'Speed' },
  
  // Users
  'users.management': { fr: 'Gestion des Utilisateurs', en: 'User Management' },
  'users.overview': { fr: 'Vue d\'ensemble et modération des comptes clients', en: 'Client accounts overview and moderation' },
  'users.total': { fr: 'Total Utilisateurs', en: 'Total Users' },
  'users.balance': { fr: 'Solde', en: 'Balance' },
  'users.totalSpent': { fr: 'Total Dépensé', en: 'Total Spent' },
  'users.trips': { fr: 'Trajets', en: 'Trips' },
  'users.block': { fr: 'Bloquer', en: 'Block' },
  'users.unblock': { fr: 'Débloquer', en: 'Unblock' },
  'users.details': { fr: 'Détails', en: 'Details' },
  
  // Financial
  'financial.dashboard': { fr: 'Tableau de Bord Financier', en: 'Financial Dashboard' },
  'financial.analysis': { fr: 'Analyses des revenus et performances financières', en: 'Revenue analysis and financial performance' },
  'financial.todayRevenue': { fr: 'Revenus du Jour', en: 'Today\'s Revenue' },
  'financial.weekRevenue': { fr: 'Revenus de la Semaine', en: 'Week\'s Revenue' },
  'financial.monthRevenue': { fr: 'Revenus du Mois', en: 'Month\'s Revenue' },
  'financial.filter': { fr: 'Filtrer', en: 'Filter' },
  'financial.last7days': { fr: '7 derniers jours', en: 'Last 7 days' },
  'financial.last30days': { fr: '30 derniers jours', en: 'Last 30 days' },
  'financial.last90days': { fr: '90 derniers jours', en: 'Last 90 days' },
  'financial.allTime': { fr: 'Tout', en: 'All time' },
  'financial.custom': { fr: 'Personnalisé', en: 'Custom' },
  'financial.customFilters': { fr: 'Filtres Personnalisés', en: 'Custom Filters' },
  'financial.dataType': { fr: 'Type de Données', en: 'Data Type' },
  'financial.revenueAndExpenses': { fr: 'Revenus et Dépenses', en: 'Revenue and Expenses' },
  'financial.revenueOnly': { fr: 'Revenus Uniquement', en: 'Revenue Only' },
  'financial.expensesOnly': { fr: 'Dépenses Uniquement', en: 'Expenses Only' },
  'financial.startDate': { fr: 'Date de Début', en: 'Start Date' },
  'financial.endDate': { fr: 'Date de Fin', en: 'End Date' },
  'financial.apply': { fr: 'Appliquer', en: 'Apply' },
  'financial.activeFilters': { fr: 'Filtres actifs', en: 'Active filters' },
  'financial.both': { fr: 'Revenus et Dépenses', en: 'Revenue and Expenses' },
  'financial.revenue': { fr: 'Revenus', en: 'Revenue' },
  'financial.expenses': { fr: 'Dépenses', en: 'Expenses' },
  'financial.endDateFuture': { fr: 'La date de fin ne peut pas être dans le futur', en: 'End date cannot be in the future' },
  'financial.invalidDateRange': { fr: 'La date de début doit être avant la date de fin', en: 'Start date must be before end date' },
  'financial.filtersApplied': { fr: 'Filtres appliqués avec succès', en: 'Filters applied successfully' },
  'financial.filtersReset': { fr: 'Filtres réinitialisés', en: 'Filters reset' },
  'financial.weeklyData': { fr: 'Données Hebdomadaires', en: 'Weekly Data' },
  'financial.monthlyTrend': { fr: 'Évolution Mensuelle', en: 'Monthly Trend' },
  'financial.transactionSummary': { fr: 'Résumé des Transactions', en: 'Transaction Summary' },
  'financial.totalTopUps': { fr: 'Total Rechargements', en: 'Total Top-ups' },
  'financial.totalPayments': { fr: 'Total Paiements', en: 'Total Payments' },
  'financial.maintenance': { fr: 'Maintenance', en: 'Maintenance' },
  'financial.refunds': { fr: 'Remboursements', en: 'Refunds' },
  'financial.userBalances': { fr: 'Soldes Utilisateurs', en: 'User Balances' },
  'financial.availableCredits': { fr: 'Crédits disponibles', en: 'Available credits' },
  
  // Incidents
  'incidents.management': { fr: 'Gestion des Signalements', en: 'Incident Management' },
  'incidents.processing': { fr: 'Traitement des incidents et remboursements', en: 'Incident processing and refunds' },
  'incidents.pending': { fr: 'En Attente', en: 'Pending' },
  'incidents.inProgress': { fr: 'En Traitement', en: 'In Progress' },
  'incidents.resolved': { fr: 'Résolu', en: 'Resolved' },
  'incidents.rejected': { fr: 'Rejeté', en: 'Rejected' },
  'incidents.approve': { fr: 'Approuver', en: 'Approve' },
  'incidents.reject': { fr: 'Rejeter', en: 'Reject' },
  'incidents.refunds': { fr: 'Remboursements', en: 'Refunds' },
  'incidents.details': { fr: 'Détails du Signalement', en: 'Incident Details' },
  'incidents.process': { fr: 'Traiter', en: 'Process' },
  'incidents.type': { fr: 'Type', en: 'Type' },
  'incidents.user': { fr: 'Utilisateur', en: 'User' },
  'incidents.bike': { fr: 'Vélo', en: 'Bike' },
  'incidents.refundAmount': { fr: 'Montant du Remboursement', en: 'Refund Amount' },
  'incidents.adminNote': { fr: 'Note Admin', en: 'Admin Note' },
  
  // Pricing
  'pricing.config': { fr: 'Configuration Tarifaire', en: 'Pricing Configuration' },
  'pricing.management': { fr: 'Gestion des forfaits et tarifs dynamiques', en: 'Pricing plans and dynamic rates management' },
  'pricing.addPlan': { fr: 'Nouveau Forfait', en: 'New Plan' },
  'pricing.hourlyRate': { fr: 'Tarif Horaire', en: 'Hourly Rate' },
  'pricing.dailyRate': { fr: 'Tarif Journalier', en: 'Daily Rate' },
  'pricing.weeklyRate': { fr: 'Tarif Hebdomadaire', en: 'Weekly Rate' },
  'pricing.monthlyRate': { fr: 'Tarif Mensuel', en: 'Monthly Rate' },
  'pricing.activePlans': { fr: 'Forfaits Actifs', en: 'Active Plans' },
  'pricing.available': { fr: 'Forfaits Disponibles', en: 'Available Plans' },
  'pricing.baseRate': { fr: 'Tarif de Base', en: 'Base Rate' },
  'pricing.peakRate': { fr: 'Tarif Heures Pointe', en: 'Peak Hours Rate' },
  'pricing.maxDiscount': { fr: 'Réduction Max', en: 'Max Discount' },
  'pricing.planName': { fr: 'Nom du Forfait', en: 'Plan Name' },
  'pricing.conditions': { fr: 'Conditions', en: 'Conditions' },
  'pricing.dynamicRules': { fr: 'Règles de Tarification Dynamique', en: 'Dynamic Pricing Rules' },
  'pricing.simulator': { fr: 'Simulateur de Prix', en: 'Price Simulator' },
  'pricing.estimatedPrice': { fr: 'Prix Estimé', en: 'Estimated Price' },
  
  // Employees
  'employees.management': { fr: 'Gestion des Employés', en: 'Employee Management' },
  'employees.overview': { fr: 'Gestion des administrateurs et employés', en: 'Administrators and employees management' },
  'employees.total': { fr: 'Total Employés', en: 'Total Employees' },
  'employees.addNew': { fr: 'Nouvel Employé', en: 'New Employee' },
  'employees.role': { fr: 'Rôle', en: 'Role' },
  'employees.permissions': { fr: 'Permissions', en: 'Permissions' },
  'employees.status': { fr: 'Statut', en: 'Status' },
  'employees.details': { fr: 'Détails de l\'Employé', en: 'Employee Details' },
  'employees.hireDate': { fr: 'Date d\'embauche', en: 'Hire Date' },
  'employees.roles': { fr: 'Rôles', en: 'Roles' },
  'employees.viewDetails': { fr: 'Détails de l\'Employé', en: 'Employee Details' },
  'employees.deleteConfirm': { fr: 'Êtes-vous sûr de vouloir supprimer l\'employé', en: 'Are you sure you want to delete the employee' },
  'employees.deleteWarning': { fr: 'Cette action est irréversible.', en: 'This action is irreversible.' },
  'employees.selectRole': { fr: 'Sélectionner un rôle', en: 'Select a role' },
  'employees.createSuccess': { fr: 'Employé créé avec succès', en: 'Employee created successfully' },
  'employees.updateSuccess': { fr: 'Employé modifié avec succès', en: 'Employee updated successfully' },
  'employees.deleteSuccess': { fr: 'Employé supprimé avec succès', en: 'Employee deleted successfully' },
  'employees.blockSuccess': { fr: 'Employé bloqué avec succès', en: 'Employee blocked successfully' },
  'employees.unblockSuccess': { fr: 'Employé débloqué avec succès', en: 'Employee unblocked successfully' },
  
  // Roles
  'roles.management': { fr: 'Gestion des Rôles', en: 'Roles Management' },
  'roles.overview': { fr: 'Configuration des rôles et permissions', en: 'Roles and permissions configuration' },
  'roles.addNew': { fr: 'Nouveau Rôle', en: 'New Role' },
  'roles.assignEmployees': { fr: 'Assigner des Employés', en: 'Assign Employees' },
  'roles.allPermissions': { fr: 'Toutes les Permissions', en: 'All Permissions' },
  'roles.roleName': { fr: 'Nom du Rôle', en: 'Role Name' },
  'roles.employeeCount': { fr: 'Nombre d\'Employés', en: 'Employee Count' },
  'roles.selectEmployees': { fr: 'Sélectionnez les employés à assigner à ce rôle', en: 'Select employees to assign to this role' },
  'roles.deleteConfirm': { fr: 'Êtes-vous sûr de vouloir supprimer le rôle', en: 'Are you sure you want to delete the role' },
  'roles.deleteWarning': { fr: 'employé(s) possède(nt) ce rôle.', en: 'employee(s) have this role.' },
  'roles.createSuccess': { fr: 'Rôle créé avec succès', en: 'Role created successfully' },
  'roles.updateSuccess': { fr: 'Rôle modifié avec succès', en: 'Role updated successfully' },
  'roles.deleteSuccess': { fr: 'Rôle supprimé avec succès', en: 'Role deleted successfully' },
  'roles.assignSuccess': { fr: 'Employés assignés avec succès', en: 'Employees assigned successfully' },
  'roles.permissionRequired': { fr: 'Veuillez sélectionner au moins une permission', en: 'Please select at least one permission' },
  'roles.permissionsSelected': { fr: 'permission(s) sélectionnée(s)', en: 'permission(s) selected' },
  'roles.employeesSelected': { fr: 'employé(s) sélectionné(s)', en: 'employee(s) selected' },
  
  // Logs
  'logs.activity': { fr: 'Logs d\'Activité', en: 'Activity Logs' },
  'logs.overview': { fr: 'Historique des actions des employés', en: 'Employee actions history' },
  'logs.filterByDate': { fr: 'Filtrer par date', en: 'Filter by date' },
  'logs.filterByEmployee': { fr: 'Filtrer par employé', en: 'Filter by employee' },
  'logs.filterByRole': { fr: 'Filtrer par rôle', en: 'Filter by role' },
  'logs.totalActions': { fr: 'Total Actions', en: 'Total Actions' },
  'logs.today': { fr: 'Aujourd\'hui', en: 'Today' },
  'logs.thisWeek': { fr: 'Cette Semaine', en: 'This Week' },
  'logs.thisMonth': { fr: 'Ce Mois', en: 'This Month' },
  'logs.dateTime': { fr: 'Date & Heure', en: 'Date & Time' },
  'logs.employee': { fr: 'Employé', en: 'Employee' },
  'logs.action': { fr: 'Action', en: 'Action' },
  'logs.category': { fr: 'Catégorie', en: 'Category' },
  'logs.allEmployees': { fr: 'Tous les employés', en: 'All employees' },
  'logs.allRoles': { fr: 'Tous les rôles', en: 'All roles' },
  
  // Settings
  'settings.company': { fr: 'Paramètres de l\'Entreprise', en: 'Company Settings' },
  'settings.companyInfo': { fr: 'Informations de l\'entreprise', en: 'Company information' },
  'settings.contactInfo': { fr: 'Informations de Contact', en: 'Contact Information' },
  'settings.paymentInfo': { fr: 'Informations de Paiement', en: 'Payment Information' },
  'settings.socialMedia': { fr: 'Réseaux Sociaux', en: 'Social Media' },
  
  // Bikes - Additional
  'bikes.maintenanceReason': { fr: 'Raison de la maintenance', en: 'Maintenance Reason' },
  'bikes.maintenanceDetails': { fr: 'Détails supplémentaires', en: 'Additional Details' },
  'bikes.selectReason': { fr: 'Sélectionner une raison', en: 'Select a reason' },
  'bikes.detailsVisible': { fr: 'Ces informations seront visibles par tous les employés', en: 'This information will be visible to all employees' },
  
  // Common
  'common.search': { fr: 'Rechercher', en: 'Search' },
  'common.filter': { fr: 'Filtrer', en: 'Filter' },
  'common.add': { fr: 'Ajouter', en: 'Add' },
  'common.edit': { fr: 'Modifier', en: 'Edit' },
  'common.delete': { fr: 'Supprimer', en: 'Delete' },
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.close': { fr: 'Fermer', en: 'Close' },
  'common.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'common.status': { fr: 'Statut', en: 'Status' },
  'common.active': { fr: 'Actif', en: 'Active' },
  'common.inactive': { fr: 'Inactif', en: 'Inactive' },
  'common.blocked': { fr: 'Bloqué', en: 'Blocked' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.noData': { fr: 'Aucune donnée', en: 'No data' },
  'common.actions': { fr: 'Actions', en: 'Actions' },
  'common.view': { fr: 'Voir', en: 'View' },
  'common.name': { fr: 'Nom', en: 'Name' },
  'common.email': { fr: 'Email', en: 'Email' },
  'common.phone': { fr: 'Téléphone', en: 'Phone' },
  'common.address': { fr: 'Adresse', en: 'Address' },
  'common.date': { fr: 'Date', en: 'Date' },
  'common.description': { fr: 'Description', en: 'Description' },
  'common.success': { fr: 'Succès', en: 'Success' },
  'common.error': { fr: 'Erreur', en: 'Error' },
  'common.language': { fr: 'Langue', en: 'Language' },
  'common.myProfile': { fr: 'Mon Profil', en: 'My Profile' },
  'common.settings': { fr: 'Paramètres', en: 'Settings' },
  'common.back': { fr: 'Retour', en: 'Back' },
  'common.next': { fr: 'Suivant', en: 'Next' },
  'common.previous': { fr: 'Précédent', en: 'Previous' },
  'common.page': { fr: 'Page', en: 'Page' },
  'common.of': { fr: 'sur', en: 'of' },
  'common.showing': { fr: 'Affichage de', en: 'Showing' },
  'common.to': { fr: 'à', en: 'to' },
  'common.entries': { fr: 'entrées', en: 'entries' },
  'common.viewDetails': { fr: 'Voir Détails', en: 'View Details' },
  'common.block': { fr: 'Bloquer', en: 'Block' },
  'common.unblock': { fr: 'Débloquer', en: 'Unblock' },
  'common.assign': { fr: 'Assigner', en: 'Assign' },
  'common.modify': { fr: 'Modifier', en: 'Modify' },
  'common.required': { fr: 'Ce champ est requis', en: 'This field is required' },
  'common.invalidEmail': { fr: 'Email invalide', en: 'Invalid email' },
  'common.invalidPhone': { fr: 'Numéro de téléphone invalide', en: 'Invalid phone number' },
  'common.confirmDelete': { fr: 'Confirmer la suppression', en: 'Confirm deletion' },
  'common.deleteConfirmMessage': { fr: 'Êtes-vous sûr de vouloir supprimer cet élément ?', en: 'Are you sure you want to delete this item?' },
  'common.confirmAction': { fr: 'Confirmer l\'action', en: 'Confirm action' },
  'common.yes': { fr: 'Oui', en: 'Yes' },
  'common.no': { fr: 'Non', en: 'No' },
  'common.created': { fr: 'créé avec succès', en: 'created successfully' },
  'common.updated': { fr: 'modifié avec succès', en: 'updated successfully' },
  'common.deleted': { fr: 'supprimé avec succès', en: 'deleted successfully' },
  'common.blocked.action': { fr: 'bloqué avec succès', en: 'blocked successfully' },
  'common.unblocked': { fr: 'débloqué avec succès', en: 'unblocked successfully' },
  'common.assigned': { fr: 'assigné avec succès', en: 'assigned successfully' },
  'common.reset': { fr: 'Réinitialiser', en: 'Reset' },
  
  // Export
  'common.export': { fr: 'Exporter', en: 'Export' },
  'export.pdfGenerating': { fr: 'Génération du PDF en cours...', en: 'Generating PDF...' },
  'export.pdfSuccess': { fr: 'PDF exporté avec succès', en: 'PDF exported successfully' },
  'export.excelGenerating': { fr: 'Génération de l\'Excel en cours...', en: 'Generating Excel...' },
  'export.excelSuccess': { fr: 'Excel exporté avec succès', en: 'Excel exported successfully' },
  'export.csvSuccess': { fr: 'CSV exporté avec succès', en: 'CSV exported successfully' },
  'export.error': { fr: 'Erreur lors de l\'export', en: 'Error during export' },
  
  // Landing Page Navigation
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.features': { fr: 'Fonctionnalités', en: 'Features' },
  'nav.howItWorks': { fr: 'Comment ça marche', en: 'How it Works' },
  'nav.testimonials': { fr: 'Témoignages', en: 'Testimonials' },
  'nav.download': { fr: 'Télécharger', en: 'Download' },
  'nav.admin': { fr: 'Admin', en: 'Admin' },
  'nav.downloadApp': { fr: 'Télécharger l\'App', en: 'Download App' },
  'nav.backToSite': { fr: 'Retour au site', en: 'Back to site' },
  
  // Hero Section
  'hero.title': { fr: 'Déplacez-vous librement avec EcoMobile', en: 'Move freely with EcoMobile' },
  'hero.subtitle': { fr: 'Location de vélos électriques à Douala - Simple, rapide et écologique', en: 'Electric bike rental in Douala - Simple, fast and eco-friendly' },
  'hero.downloadNow': { fr: 'Télécharger maintenant', en: 'Download now' },
  'hero.learnMore': { fr: 'En savoir plus', en: 'Learn more' },
  'hero.stats.bikes': { fr: 'Vélos disponibles', en: 'Bikes available' },
  'hero.stats.users': { fr: 'Utilisateurs actifs', en: 'Active users' },
  'hero.stats.available': { fr: 'Disponible', en: 'Available' },
  
  // Features Section
  'features.title': { fr: 'Pourquoi choisir EcoMobile ?', en: 'Why choose EcoMobile?' },
  'features.subtitle': { fr: 'Une solution de mobilité moderne adaptée à vos besoins quotidiens', en: 'A modern mobility solution adapted to your daily needs' },
  'features.gps.title': { fr: 'Géolocalisation GPS', en: 'GPS Tracking' },
  'features.gps.description': { fr: 'Trouvez et localisez les vélos disponibles en temps réel sur la carte', en: 'Find and locate available bikes in real-time on the map' },
  'features.mobile.title': { fr: 'Application Mobile', en: 'Mobile App' },
  'features.mobile.description': { fr: 'Réservez, déverrouillez et payez directement depuis votre smartphone', en: 'Book, unlock and pay directly from your smartphone' },
  'features.payment.title': { fr: 'Paiement Mobile', en: 'Mobile Payment' },
  'features.payment.description': { fr: 'Orange Money et Mobile Money acceptés pour plus de simplicité', en: 'Orange Money and Mobile Money accepted for more convenience' },
  'features.security.title': { fr: 'Sécurité Garantie', en: 'Guaranteed Security' },
  'features.security.description': { fr: 'Vos données et paiements sont protégés avec un chiffrement avancé', en: 'Your data and payments are protected with advanced encryption' },
  'features.availability.title': { fr: 'Disponible 24/7', en: 'Available 24/7' },
  'features.availability.description': { fr: 'Louez un vélo à tout moment, de jour comme de nuit', en: 'Rent a bike anytime, day or night' },
  'features.electric.title': { fr: 'Vélos Électriques', en: 'Electric Bikes' },
  'features.electric.description': { fr: 'Profitez d\'une assistance électrique pour des trajets sans effort', en: 'Enjoy electric assistance for effortless rides' },
  
  // How It Works Section
  'howItWorks.title': { fr: 'Comment ça marche ?', en: 'How does it work?' },
  'howItWorks.subtitle': { fr: 'Commencez à rouler en 4 étapes simples', en: 'Start riding in 4 simple steps' },
  'howItWorks.step1.title': { fr: 'Téléchargez l\'app', en: 'Download the app' },
  'howItWorks.step1.description': { fr: 'Installez EcoMobile depuis l\'App Store ou Google Play', en: 'Install EcoMobile from the App Store or Google Play' },
  'howItWorks.step2.title': { fr: 'Trouvez un vélo', en: 'Find a bike' },
  'howItWorks.step2.description': { fr: 'Localisez le vélo le plus proche sur la carte', en: 'Locate the nearest bike on the map' },
  'howItWorks.step3.title': { fr: 'Scannez le QR code', en: 'Scan the QR code' },
  'howItWorks.step3.description': { fr: 'Déverrouillez le vélo en scannant le code', en: 'Unlock the bike by scanning the code' },
  'howItWorks.step4.title': { fr: 'Profitez du trajet', en: 'Enjoy the ride' },
  'howItWorks.step4.description': { fr: 'Roulez et payez uniquement le temps utilisé', en: 'Ride and pay only for the time used' },
  
  // Pricing Section
  'pricing.title': { fr: 'Tarifs simples et transparents', en: 'Simple and transparent pricing' },
  'pricing.subtitle': { fr: 'Choisissez le forfait qui vous convient le mieux', en: 'Choose the plan that suits you best' },
  'pricing.popular': { fr: 'Populaire', en: 'Popular' },
  'pricing.selectPlan': { fr: 'Choisir ce forfait', en: 'Select this plan' },
  'pricing.note': { fr: 'Tarifs spéciaux disponibles pour les heures de pointe et événements', en: 'Special rates available for peak hours and events' },
  'pricing.perMinute.name': { fr: 'À la Minute', en: 'Per Minute' },
  'pricing.perMinute.unit': { fr: 'par minute', en: 'per minute' },
  'pricing.perMinute.description': { fr: 'Parfait pour les courts trajets', en: 'Perfect for short trips' },
  'pricing.perMinute.features.0': { fr: 'Aucun engagement', en: 'No commitment' },
  'pricing.perMinute.features.1': { fr: 'Payez uniquement ce que vous utilisez', en: 'Pay only what you use' },
  'pricing.perMinute.features.2': { fr: 'Déverrouillage gratuit', en: 'Free unlocking' },
  'pricing.perMinute.features.3': { fr: 'Support client 24/7', en: '24/7 customer support' },
  'pricing.hourly.name': { fr: 'À l\'Heure', en: 'Hourly' },
  'pricing.hourly.unit': { fr: 'par heure', en: 'per hour' },
  'pricing.hourly.description': { fr: 'Idéal pour explorer la ville', en: 'Ideal for exploring the city' },
  'pricing.hourly.features.0': { fr: 'Économisez 20%', en: 'Save 20%' },
  'pricing.hourly.features.1': { fr: 'Temps illimité dans l\'heure', en: 'Unlimited time within the hour' },
  'pricing.hourly.features.2': { fr: 'Changement de vélo gratuit', en: 'Free bike change' },
  'pricing.hourly.features.3': { fr: 'Assurance incluse', en: 'Insurance included' },
  'pricing.hourly.features.4': { fr: 'Support prioritaire', en: 'Priority support' },
  'pricing.daily.name': { fr: 'À la Journée', en: 'Daily' },
  'pricing.daily.unit': { fr: 'par jour', en: 'per day' },
  'pricing.daily.description': { fr: 'Meilleure valeur pour une journée entière', en: 'Best value for a full day' },
  'pricing.daily.features.0': { fr: 'Économisez 40%', en: 'Save 40%' },
  'pricing.daily.features.1': { fr: 'Utilisation illimitée 24h', en: 'Unlimited 24h usage' },
  'pricing.daily.features.2': { fr: 'Vélos premium disponibles', en: 'Premium bikes available' },
  'pricing.daily.features.3': { fr: 'Assurance premium', en: 'Premium insurance' },
  'pricing.daily.features.4': { fr: 'Casque gratuit', en: 'Free helmet' },
  
  // Testimonials Section
  'testimonials.title': { fr: 'Ce que disent nos utilisateurs', en: 'What our users say' },
  'testimonials.subtitle': { fr: 'Des milliers de personnes utilisent déjà EcoMobile au quotidien', en: 'Thousands of people already use EcoMobile daily' },
  'testimonials.users.0.role': { fr: 'Étudiante', en: 'Student' },
  'testimonials.users.0.content': { fr: 'EcoMobile a transformé mes déplacements quotidiens. C\'est rapide, économique et écologique. Je recommande vivement !', en: 'EcoMobile has transformed my daily commute. It\'s fast, economical and eco-friendly. I highly recommend it!' },
  'testimonials.users.1.role': { fr: 'Entrepreneur', en: 'Entrepreneur' },
  'testimonials.users.1.content': { fr: 'Plus besoin de chercher un parking ou de rester coincé dans les embouteillages. EcoMobile est la solution parfaite pour se déplacer à Douala.', en: 'No more searching for parking or being stuck in traffic. EcoMobile is the perfect solution to get around Douala.' },
  'testimonials.users.2.role': { fr: 'Professionnelle', en: 'Professional' },
  'testimonials.users.2.content': { fr: 'L\'application est très intuitive et le paiement mobile est super pratique. Je l\'utilise tous les jours pour aller au travail.', en: 'The app is very intuitive and mobile payment is super convenient. I use it every day to go to work.' },
  
  // Download Section
  'download.title': { fr: 'Téléchargez l\'app maintenant', en: 'Download the app now' },
  'download.subtitle': { fr: 'Disponible gratuitement sur iOS et Android. Commencez votre premier trajet dès aujourd\'hui.', en: 'Available for free on iOS and Android. Start your first ride today.' },
  'download.features.0': { fr: 'Interface simple et intuitive', en: 'Simple and intuitive interface' },
  'download.features.1': { fr: 'Réservation instantanée par QR code', en: 'Instant booking via QR code' },
  'download.features.2': { fr: 'Paiement sécurisé Mobile Money', en: 'Secure Mobile Money payment' },
  'download.availableOn': { fr: 'Disponible sur', en: 'Available on' },
  'download.qrInfo': { fr: 'Scannez un vélo EcoMobile pour télécharger l\'application automatiquement', en: 'Scan a EcoMobile bike to download the app automatically' },
  'download.badge': { fr: 'Nouveau !', en: 'New!' },
  
  // Footer
  'footer.tagline': { fr: 'La mobilité urbaine réinventée pour Douala et bientôt dans toute l\'Afrique.', en: 'Urban mobility reinvented for Douala and soon across Africa.' },
  'footer.company.title': { fr: 'Entreprise', en: 'Company' },
  'footer.company.about': { fr: 'À propos', en: 'About' },
  'footer.company.careers': { fr: 'Carrières', en: 'Careers' },
  'footer.company.press': { fr: 'Presse', en: 'Press' },
  'footer.company.blog': { fr: 'Blog', en: 'Blog' },
  'footer.support.title': { fr: 'Support', en: 'Support' },
  'footer.support.help': { fr: 'Centre d\'aide', en: 'Help Center' },
  'footer.support.safety': { fr: 'Sécurité', en: 'Safety' },
  'footer.support.terms': { fr: 'Conditions d\'utilisation', en: 'Terms of Service' },
  'footer.support.privacy': { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
  'footer.contact.title': { fr: 'Contact', en: 'Contact' },
  'footer.rights': { fr: 'Tous droits réservés.', en: 'All rights reserved.' },
  'footer.legal.privacy': { fr: 'Confidentialité', en: 'Privacy' },
  'footer.legal.terms': { fr: 'Conditions', en: 'Terms' },
  'footer.legal.cookies': { fr: 'Cookies', en: 'Cookies' },
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('freebike_language');
    return (saved as Language) || 'fr';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('freebike_language', lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}

// Alias for consistency
export const useI18n = useTranslation;
