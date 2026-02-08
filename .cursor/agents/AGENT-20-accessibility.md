# AGENT-20: Accessibilite WCAG 2.1 AA

**Objectif**: Rendre l'application conforme aux standards d'accessibilite WCAG 2.1 niveau AA

**Priorité**: P2  
**Complexité**: 3/5  
**Estimation**: 5-8 jours  
**Dépendances**: AGENT-16 (Refactoring)

---

## 📋 SCOPE

### Zones Prioritaires

1. **Navigation principale** : menu, breadcrumbs, liens
2. **Formulaires** : login, register, checkout, settings
3. **Composants interactifs** : boutons, modals, dropdowns, tooltips
4. **Images et medias** : alt text, captions
5. **Tableaux de donnees** : ordres, produits, analytics

### Standards Vises

- WCAG 2.1 niveau AA
- Section 508 compliance
- Support lecteur d'ecran (NVDA, VoiceOver, JAWS)
- Navigation clavier complete

---

## ✅ TÂCHES

### Phase 1: Audit Accessibilite (1-2 jours)

- [ ] Scanner toutes les pages avec axe-core ou Lighthouse
- [ ] Lister tous les elements interactifs sans aria-labels
- [ ] Identifier les images sans alt text
- [ ] Verifier le contraste de couleurs (ratio minimum 4.5:1)
- [ ] Tester la navigation clavier sur les pages principales

### Phase 2: Navigation et Structure (1-2 jours)

- [ ] Ajouter skip links ("Skip to main content")
- [ ] Verifier que tous les `<h1>` - `<h6>` sont hierarchiquement corrects
- [ ] Ajouter `aria-current="page"` sur les liens de navigation actifs
- [ ] Verifier les landmarks ARIA (main, nav, aside, footer)
- [ ] Ajouter focus visible sur tous les elements interactifs

### Phase 3: Formulaires et Composants (2-3 jours)

- [ ] Ajouter `aria-label` ou `aria-labelledby` sur tous les champs de formulaire
- [ ] Ajouter `aria-describedby` pour les messages d'erreur
- [ ] Verifier que les modals trapent le focus
- [ ] Ajouter `role="alert"` sur les messages de notification
- [ ] Verifier que les dropdowns sont navigables au clavier
- [ ] Ajouter `aria-expanded` sur les elements expandables

### Phase 4: Images, Medias et Tableaux (1 jour)

- [ ] Ajouter alt text descriptif sur toutes les images non-decoratives
- [ ] Marquer les images decoratives avec `alt=""`
- [ ] Ajouter `caption` ou `aria-label` sur les tableaux de donnees
- [ ] Verifier que les graphiques ont des alternatives textuelles

### Phase 5: Tests et Validation (1 jour)

- [ ] Re-scanner avec axe-core : 0 violations critical/serious
- [ ] Tester avec VoiceOver (macOS) sur les 5 pages principales
- [ ] Tester navigation clavier complete (Tab, Shift+Tab, Enter, Escape, Arrow keys)
- [ ] Verifier score Lighthouse Accessibility > 90

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Pattern Composant Accessible

```typescript
// Bouton accessible
<Button
  aria-label="Supprimer le design"
  aria-describedby="delete-warning"
  onClick={handleDelete}
>
  <TrashIcon aria-hidden="true" />
  Supprimer
</Button>
<p id="delete-warning" className="sr-only">
  Cette action est irreversible
</p>
```

### Skip Link

```typescript
// layout.tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg">
  Aller au contenu principal
</a>
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### Focus Trap pour Modals

```typescript
// Utiliser @radix-ui/react-dialog (deja dans shadcn/ui)
// Verifier que <Dialog> a les props corrects :
<Dialog>
  <DialogContent
    aria-describedby="dialog-description"
    onEscapeKeyDown={onClose}
  >
    <DialogTitle>Titre</DialogTitle>
    <p id="dialog-description">Description pour lecteur d'ecran</p>
  </DialogContent>
</Dialog>
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **Score Lighthouse Accessibility** > 90 sur toutes les pages
- [ ] **0 violations** axe-core critical ou serious
- [ ] **100%** des images ont un alt text
- [ ] **100%** des formulaires ont des labels
- [ ] Navigation clavier fonctionnelle sur toutes les pages
- [ ] Skip links present sur toutes les pages

---

## 🔗 RESSOURCES

- Composants UI : `apps/frontend/src/components/ui/` (shadcn)
- Lib accessibilite : `apps/frontend/src/lib/accessibility/`
- Standards WCAG : https://www.w3.org/WAI/WCAG21/quickref/

---

## 📝 NOTES

- shadcn/ui est base sur Radix UI qui est deja accessible par defaut
- Verifier que les customisations n'ont pas casse l'accessibilite native
- Prioriser les pages les plus visitees : dashboard, login, checkout
- Les couleurs du theme doivent respecter le ratio de contraste minimum
