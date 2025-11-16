# Rotation & Gouvernance des Secrets

## 1. Clés API & Access Tokens

- **OpenAI / Replicate / Stripe / Supabase** : rotation ≤ 90 jours.  
- Secrets stockés dans Vault ou AWS SSM Parameter Store (chiffrés).  
- GitHub Actions reçoit uniquement les alias `*_CURRENT`, mise à jour via workflow manuel.

### Processus de rotation

1. Générer la nouvelle clé sur le provider.  
2. Mettre à jour le secret dans Vault/SSM.  
3. Déclencher le workflow `Security - Deploy Secrets` (GitHub Actions) qui :  
   - met à jour les environnements (Kubernetes `Secret`, Vercel env, etc.)  
   - purge les pods dépendants.  
4. Vérifier le bon fonctionnement (Smoke test).  
5. Révoquer l’ancienne clé.

## 2. Mots de passe techniques

- Gestion via `vault kv` + authentification SSO (forçage MFA).  
- Les scripts automation (backup, ZAP) consomment des tokens à durée limitée.  
- Les logs n'affichent jamais les secrets (winston redacting).

## 3. Audits

- Script `npm run security:all` à exécuter hebdomadairement (audit dépendances + scan OWASP).  
- Check-list hebdo (`docs/security/SECURITY_CHECKLIST.md`).  
- Journal rotation conservé dans `Notion/Security` + ticket JIRA pour traçabilité.

## 4. Roadmap

- Intégrer rotation automatique OpenAI/Stripe via API (hashicorp Vault secret engine).  
- Ajouter scan de secrets commités (`trufflehog`, GitGuardian).  
- Ajout d’un webhook Slack (#security) pour notifier chaque rotation.

