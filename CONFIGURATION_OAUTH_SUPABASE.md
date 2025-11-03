# 🔧 **CONFIGURATION OAUTH SUPABASE - ÉTAPES EXACTES**

**Problème** : `"Unsupported provider: provider is not enabled"`  
**Cause** : Google et GitHub OAuth ne sont pas activés dans Supabase  
**Solution** : 5 minutes de configuration manuelle

---

## 📋 **ÉTAPE 1 : ACTIVER GOOGLE OAUTH** (3 min)

### **1.1 - Ouvrir Supabase Dashboard**

```
https://supabase.com/dashboard/project/obrijgptqztacolemsbk
```

### **1.2 - Aller dans Authentication**

1. Sidebar gauche → Cliquer sur **"Authentication"**
2. Sous-menu → Cliquer sur **"Providers"**

### **1.3 - Activer Google**

1. Chercher **"Google"** dans la liste
2. Cliquer sur **"Google"**
3. **Activer le toggle** "Enable Sign in with Google"
4. Entrer les credentials :

```
Client ID:
212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com

Client Secret:
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
```

5. **Redirect URL** (déjà rempli automatiquement) :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

6. Cliquer **"Save"**

---

## 📋 **ÉTAPE 2 : ACTIVER GITHUB OAUTH** (3 min)

### **2.1 - Toujours dans Providers**

1. Chercher **"GitHub"** dans la liste
2. Cliquer sur **"GitHub"**
3. **Activer le toggle** "Enable Sign in with GitHub"
4. Entrer les credentials :

```
Client ID:
Ov23liJmVOHyn8tfxgLi

Client Secret:
81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
```

5. **Redirect URL** (déjà rempli automatiquement) :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

6. Cliquer **"Save"**

---

## 📋 **ÉTAPE 3 : VÉRIFIER GOOGLE CLOUD CONSOLE** (2 min)

### **3.1 - Ajouter Redirect URI dans Google**

1. Ouvrir https://console.cloud.google.com
2. Sélectionner votre projet
3. **APIs & Services** → **Credentials**
4. Cliquer sur votre OAuth 2.0 Client ID
5. Dans **"Authorized redirect URIs"**, ajouter :

```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

6. Cliquer **"Save"**

---

## 📋 **ÉTAPE 4 : VÉRIFIER GITHUB OAUTH APP** (2 min)

### **4.1 - Ajouter Callback URL dans GitHub**

1. Ouvrir https://github.com/settings/developers
2. Cliquer sur **"OAuth Apps"**
3. Sélectionner votre application
4. Dans **"Authorization callback URL"**, mettre :

```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

5. Cliquer **"Update application"**

---

## 🧪 **ÉTAPE 5 : TESTER** (1 min)

### **5.1 - Tester Google OAuth**

1. Ouvrir https://app.luneo.app/login
2. Cliquer sur le bouton **"Google"**
3. **Vérifier** : Redirection vers Google (et non plus erreur)
4. Se connecter avec Google
5. **Vérifier** : Redirection vers /dashboard

### **5.2 - Tester GitHub OAuth**

1. Ouvrir https://app.luneo.app/login
2. Cliquer sur le bouton **"GitHub"**
3. **Vérifier** : Redirection vers GitHub (et non plus erreur)
4. Se connecter avec GitHub
5. **Vérifier** : Redirection vers /dashboard

---

## 📸 **CAPTURES D'ÉCRAN - OÙ CLIQUER**

### **Supabase Dashboard - Providers**

```
https://supabase.com/dashboard/project/obrijgptqztacolemsbk/auth/providers
```

**Vue attendue** :
```
Authentication Providers

☐ Apple (désactivé)
☑ Google (activé) ✅ ← ACTIVER ICI
☑ GitHub (activé) ✅ ← ACTIVER ICI
☐ Facebook (désactivé)
...
```

---

## ⚠️ **ERREURS POSSIBLES**

### **Erreur 1 : "Invalid Client ID"**

**Solution** : Vérifier que les credentials sont correctes :
```
Google Client ID : 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
Google Secret : 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

GitHub Client ID : Ov23liJmVOHyn8tfxgLi
GitHub Secret : 81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
```

### **Erreur 2 : "Redirect URI mismatch"**

**Solution** : Vérifier que la callback URL est exactement :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

Dans :
- Supabase (auto-généré)
- Google Cloud Console
- GitHub OAuth App

---

## ✅ **VÉRIFICATION FINALE**

Après configuration, testez :

```bash
# Test 1 : Google OAuth
curl "https://obrijgptqztacolemsbk.supabase.co/auth/v1/authorize?provider=google&redirect_to=https://app.luneo.app/auth/callback"

# Résultat attendu : Redirection 302 vers Google (pas erreur 400)
```

---

## 📝 **CHECKLIST COMPLÈTE**

- [ ] Supabase → Providers → Google → Activé
- [ ] Supabase → Providers → GitHub → Activé
- [ ] Google Cloud Console → Redirect URI ajouté
- [ ] GitHub OAuth App → Callback URL ajouté
- [ ] Test Login Google → ✅ Fonctionne
- [ ] Test Login GitHub → ✅ Fonctionne

---

## 🎯 **APRÈS CONFIGURATION**

Une fois les providers activés dans Supabase :

1. ✅ Pas besoin de redéployer (config côté Supabase)
2. ✅ Ouvrir https://app.luneo.app/login
3. ✅ Cliquer "Google" ou "GitHub"
4. ✅ Devrait rediriger vers OAuth (pas erreur)

---

## 💡 **RÉSUMÉ - 3 ACTIONS**

### **ACTION 1** : Supabase Dashboard
```
https://supabase.com/dashboard/project/obrijgptqztacolemsbk/auth/providers

✅ Activer Google
✅ Activer GitHub
✅ Entrer credentials
✅ Save
```

### **ACTION 2** : Google Cloud Console  
```
https://console.cloud.google.com

✅ Ajouter redirect URI Supabase
✅ Save
```

### **ACTION 3** : GitHub Settings
```
https://github.com/settings/developers

✅ Ajouter callback URL Supabase
✅ Update
```

---

**⏱️ Temps total : 8 minutes**

**🔧 Faites ces 3 actions et OAuth fonctionnera !**
