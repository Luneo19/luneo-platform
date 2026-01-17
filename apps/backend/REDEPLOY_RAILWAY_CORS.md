# 🔄 Redéploiement Railway - Correction CORS

## Problème
Le header `Access-Control-Allow-Origin` contenait plusieurs valeurs : `'https://www.luneo.app,https://luneo.app'`
Cela causait l'erreur : "The 'Access-Control-Allow-Origin' header contains multiple values"

## Solution appliquée
✅ Utilisation d'une fonction callback pour sélectionner dynamiquement l'origine
✅ Le code parse maintenant correctement les origines multiples

## Redéploiement nécessaire

### Option 1 : Via Railway CLI
\`\`\`bash
cd apps/backend
railway up
\`\`\`

### Option 2 : Via Git Push
\`\`\`bash
git add apps/backend/src/main.ts apps/backend/src/serverless.ts
git commit -m "fix: CORS - utiliser callback pour origines multiples"
git push origin main
\`\`\`

### Option 3 : Via Railway Dashboard
1. Aller sur https://railway.app
2. Sélectionner le service backend
3. Cliquer sur "Deploy" → "Redeploy"

## Vérification après déploiement
\`\`\`bash
curl -H "Origin: https://luneo.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.luneo.app/api/v1/auth/me \
     -v 2>&1 | grep -i "access-control-allow-origin"
\`\`\`

Le header devrait contenir UNE SEULE valeur : `https://luneo.app`

