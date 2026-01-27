#!/usr/bin/env node

/**
 * Script de déploiement sécurisé pour GitHub Pages
 * Ce script s'assure que seul le dossier build est déployé
 * sans affecter les autres dossiers du projet
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = __dirname;
const buildDir = path.join(frontendDir, 'build');

console.log('🚀 Démarrage du déploiement sécurisé...');

// Vérifier que nous sommes dans le bon répertoire
if (!fs.existsSync(buildDir)) {
  console.error('❌ Erreur: Le dossier build n\'existe pas. Exécutez "npm run build" d\'abord.');
  process.exit(1);
}

// Vérifier que le dossier build contient des fichiers
const buildFiles = fs.readdirSync(buildDir);
if (buildFiles.length === 0) {
  console.error('❌ Erreur: Le dossier build est vide. Exécutez "npm run build" d\'abord.');
  process.exit(1);
}

console.log('✅ Dossier build trouvé et contient des fichiers');

// Déployer uniquement le dossier build
try {
  console.log('📦 Déploiement vers GitHub Pages...');
  execSync(
    `gh-pages --dist build --repo https://github.com/Xybronix/EcoMobile.git --dotfiles --no-history`,
    {
      cwd: frontendDir,
      stdio: 'inherit'
    }
  );
  console.log('✅ Déploiement réussi !');
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  process.exit(1);
}
