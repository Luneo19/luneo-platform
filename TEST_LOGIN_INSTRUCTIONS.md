# 🧪 TEST MANUEL - INSTRUCTIONS

**Objectif:** Tester la connexion et identifier le problème exact

---

## 📋 ÉTAPE PAR ÉTAPE

### 1. Ouvrir la Page Login

```
https://app.luneo.app/login
```

### 2. Ouvrir la Console du Navigateur

- **Chrome/Firefox:** F12 (ou Cmd+Option+I sur Mac)
- Cliquer sur l'onglet **"Console"**

### 3. Tenter de se Connecter

- Entrer votre email (emmanuel.abougadous@gmail.com)
- Entrer un mot de passe (même incorrect pour tester)

### 4. Observer les Erreurs

Dans la console, vous devriez voir:

**Si "Invalid API key":**
```
→ La clé Supabase dans Vercel est incorrecte
→ Solution: Mettre à jour avec la bonne clé
```

**Si "relation does not exist":**
```
→ Les tables Supabase ne sont pas créées
→ Solution: Exécuter les migrations SQL
```

**Si "User not found":**
```
→ Le compte existe pas en base
→ Solution: Créer un compte d'abord
```

**Si "Network Error":**
```
→ Problème de connexion
→ Solution: Vérifier le projet Supabase
```

---

## 📊 CE QUI SE PASSE MAINTENANT

**Ce qui fonctionne:**
- ✅ Application déployée
- ✅ Pages accessibles
- ✅ Login page affiche le formulaire
- ✅ Frontend fonctionne

**Ce qui ne fonctionne pas:**
- ⚠️ Connexion à Supabase échoue
- ⚠️ Health check retourne "unhealthy"
- ⚠️ Authentification bloquée

---

## 🎯 QUESTION POUR VOUS

**Pouvez-vous:**
1. Aller sur https://app.luneo.app/login
2. Ouvrir la console (F12)
3. Tenter de vous connecter
4. Me dire quelle erreur exacte apparaît dans la console?

**Ou me dire:** Sur Supabase Dashboard, voyez-vous encore les 184 issues? Et si oui, qu'est-ce que c'est?

---

**Avec cette info, je pourrai corriger le problème exact!** 🔧

