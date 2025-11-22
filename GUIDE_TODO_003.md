# 📋 GUIDE TODO-003: Vérifier NEXT_PUBLIC_APP_URL dans Vercel

**Action manuelle requise**

## Étapes

1. Aller sur https://vercel.com/dashboard
2. Sélectionner le projet `luneo-platform` (ou nom du projet)
3. Aller dans **Settings** → **Environment Variables**
4. Chercher la variable `NEXT_PUBLIC_APP_URL`
5. Vérifier que la valeur est: `https://app.luneo.app`
6. Si la valeur est différente ou absente:
   - Cliquer sur **Edit** ou **Add**
   - Mettre la valeur: `https://app.luneo.app`
   - Sélectionner tous les environnements (Production, Preview, Development)
   - Cliquer sur **Save**

## Vérification

Après modification, redéployer le projet pour que les changements prennent effet.

---

**Une fois fait, marquer TODO-003 comme complété**

