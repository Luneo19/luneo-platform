# Test du Widget

## Lancer le test

1. Build le widget :
```bash
cd packages/widget
pnpm build
```

2. Servir la page de test :
```bash
# Option 1: Avec un serveur HTTP simple
npx serve test

# Option 2: Avec Python
python3 -m http.server 8000

# Option 3: Avec Node.js http-server
npx http-server test -p 8000
```

3. Ouvrir dans le navigateur :
```
http://localhost:8000/index.html
```

## Tests à effectuer

- [ ] Widget s'initialise correctement
- [ ] Canvas s'affiche
- [ ] Outils fonctionnent (Text, Image, Shape)
- [ ] Panneau des calques s'affiche
- [ ] Ajout de calques fonctionne
- [ ] Undo/Redo fonctionne
- [ ] Sauvegarde fonctionne
- [ ] Export fonctionne






