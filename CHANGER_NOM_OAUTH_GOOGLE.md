# 🎨 **CHANGER LE NOM AFFICHÉ DANS GOOGLE OAUTH**

**Problème** : Google affiche "obrijgptqztacolemsbk.supabase.co" au lieu de "Luneo Platform"  
**Solution** : Configurer l'écran de consentement OAuth dans Google Cloud Console  
**Temps** : 5 minutes

---

## 📋 **ÉTAPES EXACTES**

### **ÉTAPE 1 : Ouvrir OAuth Consent Screen**

```
https://console.cloud.google.com/apis/credentials/consent
```

**Ou** :
1. https://console.cloud.google.com
2. Sélectionner votre projet
3. Menu ☰ → **APIs & Services** → **OAuth consent screen**

---

### **ÉTAPE 2 : Configurer l'Écran de Consentement**

#### **Section "App Information"**

**Champs à remplir** :

1. **App name** (Nom de l'application) :
   ```
   Luneo Platform
   ```
   ✨ **C'est ce nom qui s'affichera** au lieu de "obrijgptqztacolemsbk.supabase.co"

2. **User support email** :
   ```
   emmanuel.abougadous@gmail.com
   ```
   (ou service.luneo@gmail.com)

3. **App logo** (Optionnel mais recommandé) :
   - Upload un logo carré (120x120 px minimum)
   - Format PNG ou JPG
   - Votre logo Luneo

4. **Application home page** :
   ```
   https://app.luneo.app
   ```

5. **Application privacy policy link** :
   ```
   https://app.luneo.app/legal/privacy
   ```

6. **Application terms of service link** :
   ```
   https://app.luneo.app/legal/terms
   ```

---

#### **Section "Authorized domains"**

**Ajouter** :
```
app.luneo.app
supabase.co
```

---

#### **Section "Developer contact information"**

**Email addresses** :
```
emmanuel.abougadous@gmail.com
```

---

### **ÉTAPE 3 : Scopes (Permissions)**

**Scopes requis pour OAuth** :
```
.../auth/userinfo.email
.../auth/userinfo.profile
openid
```

Ces scopes permettent de récupérer l'email et le nom de l'utilisateur.

---

### **ÉTAPE 4 : Save**

1. Cliquer **"SAVE AND CONTINUE"** en bas de chaque section
2. Vérifier le résumé
3. **Publier l'application** (passer en "Production" ou rester en "Testing")

---

## 🧪 **RÉSULTAT APRÈS CONFIGURATION**

### **Avant** :
```
Sélectionner un compte
pour accéder à l'application
obrijgptqztacolemsbk.supabase.co ❌
```

### **Après** :
```
Sélectionner un compte
pour accéder à l'application
Luneo Platform ✅

[Logo Luneo affiché]
```

**Beaucoup plus professionnel !** 🎨

---

## 🎯 **CONFIGURATION PROFESSIONNELLE COMPLÈTE**

### **Informations Recommandées**

**App Information** :
```
App name: Luneo Platform
User support email: service.luneo@gmail.com
Logo: [Votre logo carré]
Home page: https://app.luneo.app
Privacy policy: https://app.luneo.app/legal/privacy
Terms of service: https://app.luneo.app/legal/terms
```

**Scopes** :
```
✅ .../auth/userinfo.email
✅ .../auth/userinfo.profile
✅ openid
```

**Type d'application** :
```
Externe (External)
```

**État de publication** :
```
Testing (pour commencer)
→ Production (quand prêt à lancer)
```

---

## 📊 **ÉTAPES DÉTAILLÉES AVEC SCREENSHOTS**

### **1. OAuth Consent Screen**

**Navigation** :
```
Google Cloud Console
→ APIs & Services
→ OAuth consent screen
→ EDIT APP
```

**Configuration** :
```
User Type: External
App name: Luneo Platform ✅
Support email: service.luneo@gmail.com
Logo: [Upload logo]
```

### **2. Scopes**

**Add or Remove Scopes** :
```
✅ .../auth/userinfo.email (View your email address)
✅ .../auth/userinfo.profile (View your basic profile info)
✅ openid
```

### **3. Test Users** (Si en mode Testing)

**Ajouter vos emails de test** :
```
emmanuel.abougadous@gmail.com
service.luneo@gmail.com
```

---

## 🎨 **BONUS : LOGO PROFESSIONNEL**

### **Spécifications Logo**

**Dimensions** :
- Minimum : 120x120 px
- Recommandé : 512x512 px
- Format : PNG (transparent) ou JPG
- Ratio : 1:1 (carré)

**Design** :
- Fond transparent ou blanc
- Logo centré
- Couleurs : Bleu/Violet (votre charte)
- Simple et reconnaissable

---

## ⚡ **CHANGEMENT IMMÉDIAT VS PROGRESSIF**

### **Changement Nom** (Immédiat)
- ✅ Modifier "App name" → Effet immédiat
- ✅ Prochaine connexion OAuth → Nouveau nom affiché

### **Changement Logo** (Quelques heures)
- ⏳ Upload logo → Validation Google
- ⏳ Peut prendre 1-24h pour propagation
- ✅ Ensuite visible sur tous les écrans OAuth

---

## 🔍 **VÉRIFICATION FINALE**

### **Après Configuration**

**Test** :
1. Se déconnecter de app.luneo.app
2. Retourner sur https://app.luneo.app/login
3. Cliquer "Google"
4. **Vérifier** : Devrait afficher "Luneo Platform" au lieu de "obrijgptqztacolemsbk.supabase.co"

---

## 📝 **CHECKLIST COMPLÈTE**

- [ ] Ouvrir Google Cloud Console
- [ ] Aller dans OAuth consent screen
- [ ] Modifier "App name" → "Luneo Platform"
- [ ] Ajouter support email
- [ ] Ajouter home page URL
- [ ] Ajouter privacy policy URL
- [ ] Upload logo (optionnel)
- [ ] Configurer scopes
- [ ] Save and Continue
- [ ] Tester OAuth → Nouveau nom visible

---

## 🎉 **RÉSULTAT FINAL**

**Écran OAuth Google montrera** :
```
┌─────────────────────────────────────┐
│  G Se connecter avec Google         │
├─────────────────────────────────────┤
│                                     │
│  [Logo Luneo]                       │
│                                     │
│  Luneo Platform souhaite accéder    │
│  à votre compte Google              │
│                                     │
│  Cela permettra à Luneo Platform de:│
│  • Consulter votre adresse email    │
│  • Consulter vos infos de profil    │
│                                     │
│  [Emmanuel.AbouGadous@gmail.com]    │
│                                     │
│  [Annuler]  [Autoriser] ────────────│
└─────────────────────────────────────┘
```

**Beaucoup plus professionnel !** ✨

---

## 💬 **APRÈS CONFIGURATION**

**Confirmez-moi** :
- ✅ "Nom changé, OAuth affiche 'Luneo Platform' !"
- ⏳ "En cours de configuration..."
- ❌ "Besoin d'aide sur [étape]"

---

**🎨 Configurez le nom et le logo pour un OAuth professionnel !**

**⏱️ 5 minutes pour un résultat parfait !**
