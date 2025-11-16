# Microcopy Improvements for Luneo Widget

**Date:** November 16, 2025  
**Purpose:** User-friendly, conversion-optimized copy for prompts and error messages

---

## 1. Prompt Input Microcopy

### Current vs Improved

#### Placeholder Text
**Current:** `Décrivez votre {productName} idéal...`  
**Improved:** `Ex: "Un t-shirt bleu avec un logo minimaliste"`  
**Rationale:** Shows example format, reduces blank page anxiety

**Alternative (Product-specific):**
- T-shirts: `Ex: "T-shirt blanc avec un design floral coloré"`
- Mugs: `Ex: "Mug avec une citation inspirante en typographie moderne"`
- Posters: `Ex: "Affiche événement avec style rétro et couleurs vives"`

#### Helper Text (Below Input)
**Current:** `Powered by Luneo AI`  
**Improved:** `💡 Astuce: Plus de détails = meilleur résultat`  
**Rationale:** Actionable guidance instead of branding

#### Character Counter
**Current:** `{value.length}/{maxLength}`  
**Improved:** 
- 0-80%: Hide counter (reduce anxiety)
- 80-95%: Show `{remaining} caractères restants`
- 95-100%: Show `{remaining} caractères restants` (warning style)
- 100%: Show `Limite atteinte` (error style)

#### Quick Suggestions
**Current:** Generic suggestions ("Logo moderne", "Poster événement")  
**Improved:** Product-specific, action-oriented suggestions

**Examples by Product Type:**
- T-shirts: `"Design minimaliste", "Style vintage", "Motif géométrique", "Texte personnalisé"`
- Mugs: `"Citation du jour", "Design humoristique", "Logo entreprise", "Motif floral"`
- Posters: `"Affiche événement", "Art mural", "Design moderne", "Style rétro"`

**Implementation:** Use `config.productName` and `config.productCategory` to generate contextual suggestions

---

## 2. Button Labels

### Generate Button
**Current:** `Générer avec l'IA`  
**Improved:** `Créer mon design` (shorter, action-focused)  
**Alternative:** `Générer maintenant` (adds urgency)

### Loading State
**Current:** `Génération en cours...`  
**Improved:** `Création en cours... (~15 secondes)`  
**Rationale:** Adds time expectation, reduces anxiety

**Progressive Messages:**
1. `Analyse de votre demande...` (0-3s)
2. `Création de votre design...` (3-10s)
3. `Finalisation...` (~15s)

### Regenerate Button
**Current:** `Régénérer` (icon only)  
**Improved:** `Créer une autre version` (with icon)  
**Rationale:** More descriptive, explains action

### Download Buttons
**Current:** `Télécharger PNG`, `Télécharger JPG`  
**Improved:** `Télécharger PNG` (keep as is, but add icon)  
**Alternative:** `Télécharger` (format in tooltip)

### Share Button
**Current:** `Partager` (icon only)  
**Improved:** `Partager` (with icon, tooltip: "Partager ce design")

### AR Button
**Current:** `Réalité Augmentée` (tab label)  
**Improved:** `Essayer en AR` (more action-oriented)  
**Tooltip:** `Voir ce design dans votre espace`

---

## 3. Error Messages

### Error Message Structure
All error messages should follow this pattern:
1. **Clear problem statement** (what went wrong)
2. **User-friendly language** (no technical jargon)
3. **Actionable solution** (what user can do)
4. **Optional:** Recovery action button

### Specific Error Messages

#### Empty Prompt
**Current:** `Le prompt est vide après sanitation.`  
**Improved:** `Veuillez décrire votre design pour continuer.`  
**Action:** Auto-focus on input field

#### Rate Limit Reached
**Current:** `Limite de génération atteinte. Veuillez patienter quelques instants.`  
**Improved:** `Vous avez atteint la limite de générations gratuites. Réessayez dans quelques minutes ou passez à la version premium.`  
**Action:** Show upgrade CTA button

#### Network Error
**Current:** `Échec de la génération (${response.status})`  
**Improved:** 
- 400: `Votre demande n'a pas pu être traitée. Veuillez reformuler votre description.`
- 401: `Session expirée. Veuillez rafraîchir la page.`
- 403: `Accès refusé. Vérifiez vos permissions.`
- 404: `Service temporairement indisponible. Réessayez dans quelques instants.`
- 429: `Trop de demandes. Veuillez patienter quelques instants.`
- 500: `Une erreur est survenue. Notre équipe a été notifiée. Réessayez dans quelques instants.`
- Network: `Problème de connexion. Vérifiez votre internet et réessayez.`

**Action:** Always show retry button

#### Invalid Response
**Current:** `Réponse invalide du service de génération.`  
**Improved:** `Le design n'a pas pu être généré. Réessayez avec une description différente.`  
**Action:** Show retry button + clear prompt option

#### Origin Not Allowed
**Current:** `Origine non autorisée pour le widget.`  
**Improved:** `Configuration invalide. Contactez le support si le problème persiste.`  
**Action:** Show support link

#### AR Errors

**Camera Not Available:**
**Current:** `Prévisualisation AR indisponible`  
**Improved:** `Votre appareil ne supporte pas la réalité augmentée. Essayez sur un smartphone ou une tablette.`

**Camera Permission Denied:**
**Current:** Generic error  
**Improved:** `Accès à la caméra refusé. Activez les permissions dans les paramètres de votre navigateur pour utiliser la réalité augmentée.`  
**Action:** Show "Comment activer" link

**AR Model Not Generated:**
**Current:** `Aucun modèle AR généré`  
**Improved:** `La version AR n'est pas disponible pour ce design. Essayez de régénérer avec une description plus détaillée.`

---

## 4. Success Messages

### Design Generated
**Current:** No message (design just appears)  
**Improved:** Toast notification: `✨ Design créé avec succès!`  
**Duration:** 3 seconds

### Download Success
**Current:** Native browser download (no feedback)  
**Improved:** Toast notification: `📥 Téléchargement démarré`  
**Duration:** 2 seconds

### Share Success
**Current:** `Lien copié dans le presse-papiers.` (alert)  
**Improved:** Toast notification: `🔗 Lien copié! Partagez-le avec vos amis.`  
**Duration:** 3 seconds

---

## 5. Empty States

### No Design Yet
**Current:** `Aucun design pour le moment`  
**Improved:** `Créez votre premier design en quelques secondes`  
**Subtext:** `Décrivez votre idée ci-dessus et laissez l'IA faire la magie ✨`

### No AR Available
**Current:** `Prévisualisation AR indisponible`  
**Improved:** `Activez la réalité augmentée pour voir votre design dans votre espace`  
**Subtext:** `Générez un design d'abord, puis essayez-le en AR`

---

## 6. Security & Trust Messages

### Rate Limit Badge
**Current:** `{remaining} génération{remaining > 1 ? 's' : ''} disponibles`  
**Improved:** 
- High (>5): `{remaining} designs gratuits restants`
- Medium (2-5): `{remaining} designs restants`
- Low (1): `Dernier design gratuit!`
- Zero: `Limite atteinte - Passez premium`

**Rationale:** More user-friendly, less technical

### Security Badge (Header)
**Current:** `ShieldCheck icon + rate limit`  
**Improved:** Remove or replace with: `🔒 Sécurisé` (trust signal, not technical detail)

---

## 7. Tab Labels

### Current
- `Prévisualisation`
- `Réalité Augmentée`

### Improved
- `Aperçu` (shorter, clearer)
- `Essayer en AR` (action-oriented, more discoverable)

**Alternative:**
- `Vue 2D`
- `Vue AR`

---

## 8. Tooltips & Help Text

### Prompt Input Tooltip
**Text:** `Décrivez votre design en détail pour obtenir le meilleur résultat. Exemples: couleurs, style, texte, motifs.`

### AR Tab Tooltip
**Text:** `Voir votre design dans votre espace réel avec la réalité augmentée`

### Regenerate Tooltip
**Text:** `Créer une nouvelle version avec la même description`

### Share Tooltip
**Text:** `Partager ce design avec vos amis`

### Download Tooltip
**Text:** `Télécharger ce design en haute qualité`

---

## 9. Loading Messages (Progressive)

### Step 1: Analysis (0-3s)
`Analyse de votre demande...`  
**Subtext:** `L'IA comprend votre vision`

### Step 2: Generation (3-10s)
`Création de votre design...`  
**Subtext:** `Génération en cours (~{estimated}s)`

### Step 3: Finalization (10-15s)
`Finalisation...`  
**Subtext:** `Presque terminé!`

**Rationale:** Reduces perceived wait time, keeps user engaged

---

## 10. Implementation Priority

### Phase 1 (Immediate):
1. ✅ Error messages (all error types)
2. ✅ Button labels (Generate, Loading states)
3. ✅ Placeholder text (with examples)
4. ✅ Success toasts

### Phase 2 (Next Sprint):
1. ✅ Progressive loading messages
2. ✅ Tooltips
3. ✅ Empty states
4. ✅ Rate limit messages

### Phase 3 (Future):
1. ✅ Product-specific suggestions
2. ✅ Advanced help text
3. ✅ Contextual tips

---

## 11. Copy Guidelines

### Tone:
- **Friendly but professional**
- **Action-oriented**
- **Clear and concise**
- **Empowering** (not condescending)

### Language:
- **French (primary)** - current language
- **Avoid technical jargon**
- **Use active voice**
- **Short sentences** (< 20 words)

### Formatting:
- **Use emojis sparingly** (for success states, not errors)
- **Bold for emphasis** (key actions)
- **Consistent terminology** (always "design", not "création" or "œuvre")

---

## 12. A/B Test Copy Variations

### Generate Button:
- **A:** `Créer mon design`
- **B:** `Générer maintenant`
- **C:** `Lancer la création`

### Loading Message:
- **A:** `Création en cours... (~15 secondes)`
- **B:** `Génération en cours...`
- **C:** `Votre design arrive...`

### AR Tab:
- **A:** `Essayer en AR`
- **B:** `Voir en AR`
- **C:** `Réalité Augmentée`

Test these variations to find highest conversion rates.
