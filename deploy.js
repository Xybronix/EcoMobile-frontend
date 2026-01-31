#!/usr/bin/env node

/**
 * Script de déploiement sécurisé pour GitHub Pages
 * Déploie uniquement le contenu du dossier build
 * sans affecter les autres dossiers
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const frontendDir = __dirname;
const buildDir = path.join(frontendDir, 'build');

console.log('🚀 Démarrage du déploiement sécurisé...');

// Vérifier que le dossier build existe
if (!fs.existsSync(buildDir)) {
  console.error('❌ Erreur: Le dossier build n\'existe pas.');
  console.error('📋 Exécutez d\'abord: npm run build');
  process.exit(1);
}

// Vérifier que le dossier build contient des fichiers
const buildFiles = fs.readdirSync(buildDir);
if (buildFiles.length === 0) {
  console.error('❌ Erreur: Le dossier build est vide.');
  console.error('📋 Exécutez d\'abord: npm run build');
  process.exit(1);
}

console.log('✅ Dossier build trouvé et contient des fichiers');

try {
  console.log('📦 Préparation du déploiement...');
  
  // Méthode 1: Utiliser git worktree (plus propre)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-'));
  console.log(`📁 Répertoire temporaire: ${tempDir}`);
  
  try {
    // Cloner seulement la branche gh-pages dans un répertoire temporaire
    execSync(
      `git clone --branch gh-pages --single-branch https://github.com/Xybronix/EcoMobile.git "${tempDir}"`,
      { stdio: 'pipe' }
    );
    
    // Vider le répertoire cloné sauf le .git
    const tempFiles = fs.readdirSync(tempDir);
    tempFiles.forEach(file => {
      if (file !== '.git') {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    });
    
    // Copier le contenu de build dans le répertoire temporaire
    console.log('📤 Copie des fichiers de build...');
    execSync(`xcopy "${buildDir}\\*" "${tempDir}\\" /E /I /Y`, { stdio: 'pipe' });
    
    // Ajouter, committer et pousser
    process.chdir(tempDir);
    execSync('git add .', { stdio: 'pipe' });
    
    const hasChanges = execSync('git status --porcelain').toString().trim();
    if (hasChanges) {
      execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'pipe' });
      execSync('git push origin gh-pages', { stdio: 'inherit' });
      console.log('✅ Déploiement réussi !');
    } else {
      console.log('ℹ️  Aucun changement à déployer.');
    }
    
    // Revenir au répertoire original
    process.chdir(frontendDir);
    
  } finally {
    // Nettoyer le répertoire temporaire
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('⚠️  Impossible de nettoyer le répertoire temporaire:', cleanupError.message);
    }
  }
  
} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  
  // Méthode de secours plus simple
  console.log('🔄 Tentative avec méthode alternative...');
  try {
    // Utiliser gh-pages mais sans options problématiques
    execSync(
      `gh-pages --dist build --repo https://github.com/Xybronix/EcoMobile.git --message "Deploy to GitHub Pages"`,
      {
        cwd: frontendDir,
        stdio: 'inherit'
      }
    );
    console.log('✅ Déploiement réussi avec gh-pages !');
  } catch (ghPagesError) {
    console.error('❌ Échec complet du déploiement:', ghPagesError.message);
    process.exit(1);
  }
}