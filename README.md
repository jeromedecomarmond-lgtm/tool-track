# Tool Track — Guide de déploiement

## Structure du projet
```
tooltrack/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
├── public/
│   ├── manifest.json
│   └── icon.svg
└── src/
    ├── main.jsx
    └── App.jsx
```

## Étapes pour mettre en ligne

### 1. Télécharger ce dossier
Téléchargez le fichier ZIP et décompressez-le sur votre ordinateur.

### 2. Mettre sur GitHub
1. Allez sur github.com → cliquez "New repository"
2. Nommez-le "tool-track", laissez tout par défaut → "Create repository"
3. Sur la page suivante, cliquez "uploading an existing file"
4. Glissez-déposez TOUS les fichiers du dossier tooltrack
5. Cliquez "Commit changes"

### 3. Déployer sur Vercel
1. Allez sur vercel.com → "Add New Project"
2. Connectez votre GitHub → sélectionnez "tool-track"
3. Laissez tous les paramètres par défaut
4. Cliquez "Deploy"
5. En 2 minutes votre app est en ligne avec une URL du type : https://tool-track-xxx.vercel.app

### 4. Installer sur téléphone (PWA)
**Android (Chrome) :**
- Ouvrez l'URL dans Chrome
- Menu (3 points) → "Ajouter à l'écran d'accueil"

**iPhone (Safari) :**
- Ouvrez l'URL dans Safari
- Bouton Partager → "Sur l'écran d'accueil"

L'app apparaît comme une vraie application avec l'icône 🔧 !
