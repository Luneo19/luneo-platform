# Checklist de Déploiement Production (Railway + Vercel)

Dernière mise à jour: 2026-03-01

## 1) Pré-checks obligatoires

- [ ] Branche à déployer est à jour et poussée
- [ ] `pnpm run quality:release` vert
- [ ] Aucune erreur critique ouverte côté incidents
- [ ] Variables/secrets prod à jour (Railway + Vercel + smoke)

## 2) CI avant déploiement

- [ ] Workflow `CI` (`.github/workflows/ci.yml`) vert sur le SHA ciblé
- [ ] Artefact `quality-release-metadata` présent

## 3) Déploiement officiel

Le chemin standard est le workflow manuel:
- [ ] Lancer `Deploy Production` (`.github/workflows/deploy-production.yml`)
- [ ] Choisir `target` (`all`, `backend`, `frontend`)
- [ ] Vérifier que l’étape `verify-ci-status` passe

## 4) Vérifications post-deploy immédiates

- [ ] Frontend: `https://luneo.app` répond `HTTP 200`
- [ ] Backend: `https://api.luneo.app/health` retourne `status: ok`
- [ ] Smoke `critical` passe
- [ ] Smoke `post-login-tunnel` passe (ou skip explicitement documenté)

## 5) Sanity métier (10-15 min)

- [ ] Login utilisateur OK
- [ ] Dashboard accessible
- [ ] Route admin protégée correctement (redirection si non auth)
- [ ] Envoi/réception notifications de base OK
- [ ] Endpoints API publics critiques répondent

## 6) Monitoring (30-60 min)

- [ ] Erreurs 5xx stables
- [ ] Pas de pic anormal latence API
- [ ] Pas d’augmentation anormale des jobs failed/DLQ
- [ ] Pas d’alerte sécurité critique (auth/webhooks/rate-limit)

## 7) Critères Go/No-Go

**Go** si:
- CI verte
- smoke verts
- health frontend/backend verts
- aucun incident P0/P1 nouveau

**No-Go / rollback** si:
- indisponibilité API ou frontend
- régression auth/paiement
- erreurs 5xx massives
- incident sécurité

