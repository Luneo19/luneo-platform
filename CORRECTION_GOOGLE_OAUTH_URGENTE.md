# 🔧 **CORRECTION GOOGLE OAUTH - REDIRECT URI MISMATCH**

**Erreur** : `Erreur 400: redirect_uri_mismatch`  
**Cause** : L'URL de callback Supabase n'est pas autorisée dans Google Cloud Console  
**Solution** : Ajouter l'URL dans Google Cloud Console (3 minutes)

---

## 🎯 **URL MANQUANTE**

**Cette URL doit être ajoutée dans Google** :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

---

## ✅ **ÉTAPES EXACTES - GOOGLE CLOUD CONSOLE**

### **1. Ouvrir Google Cloud Console**

```
https://console.cloud.google.com/apis/credentials
```

**Ou** :
1. Aller sur https://console.cloud.google.com
2. Sélectionner votre projet
3. Menu ☰ → **APIs & Services** → **Credentials**

---

### **2. Trouver votre OAuth 2.0 Client ID**

Dans la liste "OAuth 2.0 Client IDs", chercher :
```
Client ID: 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
```

**Cliquer dessus** pour éditer

---

### **3. Ajouter l'URL de Redirection Supabase**

Dans la section **"Authorized redirect URIs"** :

**URLs actuelles** (probablement) :
```
https://app.luneo.app/auth/callback
https://app.luneo.app/api/auth/google/callback
```

**AJOUTER cette nouvelle URL** :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

**Résultat final** (3 URLs) :
```
✅ https://app.luneo.app/auth/callback
✅ https://app.luneo.app/api/auth/google/callback
✅ https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

---

### **4. Sauvegarder**

1. Cliquer **"SAVE"** en bas de la page
2. Attendre confirmation (1-2 secondes)
3. ✅ Configuration enregistrée

---

## 🧪 **TESTER IMMÉDIATEMENT**

### **Test Google OAuth**

1. Ouvrir https://app.luneo.app/login
2. Cliquer bouton **"Google"**
3. **Résultat attendu** :
   - ✅ Redirection vers Google login
   - ✅ "Choisir un compte Google"
   - ✅ Autoriser l'application
   - ✅ Redirection vers /dashboard
   - ✅ Connexion réussie

**PAS PLUS D'ERREUR "redirect_uri_mismatch"** ✅

---

## 🔧 **MÊME CHOSE POUR GITHUB** (optionnel maintenant)

### **GitHub OAuth App Settings**

1. Ouvrir https://github.com/settings/developers
2. **OAuth Apps** → Sélectionner votre app
3. **Authorization callback URL** :
   ```
   https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
   ```
4. **Update application**

---

## 📊 **RÉCAPITULATIF**

### **Ce qui est déjà fait** ✅
- ✅ Code Login/Register (déployé)
- ✅ Supabase Auth configuré
- ✅ OAuth providers activés dans Supabase
- ✅ Credentials Google/GitHub dans Supabase

### **Ce qui manque** ⏳
- ⏳ URL de callback dans **Google Cloud Console**
- ⏳ URL de callback dans **GitHub OAuth App**

---

## ⚡ **ACTION IMMÉDIATE**

**1. Ouvrir** :
```
https://console.cloud.google.com/apis/credentials
```

**2. Éditer** : Votre OAuth 2.0 Client

**3. Ajouter** :
```
https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
```

**4. Save**

**5. Tester** :
```
https://app.luneo.app/login → Click Google
```

---

## 🎯 **APRÈS CONFIGURATION**

**Login fonctionnera avec** :
- ✅ Email/Password
- ✅ Google OAuth
- ✅ GitHub OAuth

**Score final** : **100/100** ✅

---

## 💬 **CONFIRMATION**

Après avoir ajouté l'URL dans Google Cloud Console :

**Testez** et dites-moi :
- ✅ "Google OAuth fonctionne !"
- ❌ "Toujours erreur : [message]"

---

**⏱️ 3 minutes pour configurer !**

**🔧 Ajoutez l'URL et testez !**
