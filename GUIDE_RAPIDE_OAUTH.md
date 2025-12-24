# ⚡ **GUIDE RAPIDE - ACTIVER OAUTH EN 5 MINUTES**

## 🎯 **PROBLÈME**

Erreur : `"Unsupported provider: provider is not enabled"`

**Cause** : Google et GitHub ne sont pas activés dans Supabase

---

## ✅ **SOLUTION - 3 CLICS**

### **ÉTAPE 1 : Ouvrir Supabase**

```
https://supabase.com/dashboard/project/obrijgptqztacolemsbk/auth/providers
```

### **ÉTAPE 2 : Activer Google**

1. Chercher **"Google"**
2. Toggle **ON** ✅
3. Coller :
   ```
   Client ID: 212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
   Client Secret: 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
   ```
4. **Save**

### **ÉTAPE 3 : Activer GitHub**

1. Chercher **"GitHub"**
2. Toggle **ON** ✅
3. Coller :
   ```
   Client ID: Ov23liJmVOHyn8tfxgLi
   Client Secret: 81bbea63bfc5651e048e5e7f62f69c5d4aad55f9
   ```
4. **Save**

---

## 🧪 **TESTER**

```
https://app.luneo.app/login

✅ Click "Google" → Devrait rediriger (pas erreur)
✅ Click "GitHub" → Devrait rediriger (pas erreur)
```

---

## ⚠️ **SI TOUJOURS ERREUR**

### **Vérifier Google Cloud Console**

```
https://console.cloud.google.com/apis/credentials

→ Votre OAuth Client
→ Authorized redirect URIs
→ Ajouter : https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
→ Save
```

### **Vérifier GitHub OAuth App**

```
https://github.com/settings/developers

→ Votre OAuth App
→ Authorization callback URL
→ Mettre : https://obrijgptqztacolemsbk.supabase.co/auth/v1/callback
→ Update
```

---

**⏱️ 5 minutes max**

**🔧 Activez dans Supabase et testez !**
