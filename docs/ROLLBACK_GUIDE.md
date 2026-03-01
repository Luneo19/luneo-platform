# Guide de Rollback Production

Dernière mise à jour: 2026-03-01

## Déclencheurs rollback

Rollback immédiat si un des cas suivants:
- indisponibilité frontend ou backend
- régression auth/paiement critique
- taux 5xx anormal soutenu
- incident sécurité confirmé

## Ordre d’action recommandé

1. **Stabiliser le trafic**
   - geler tout nouveau déploiement
   - notifier équipe incident

2. **Rollback frontend (Vercel)**
   - promouvoir le dernier déploiement stable depuis Vercel
   - vérifier `https://luneo.app` (HTTP + login)

3. **Rollback backend (Railway)**
   - redéployer la révision stable précédente du service `backend`
   - vérifier `https://api.luneo.app/health`

4. **Base de données (si migration fautive)**
   - appliquer le runbook DBA validé
   - ne jamais improviser un rollback SQL sans validation

## Vérifications post-rollback

- [ ] frontend répond 200
- [ ] backend health `status: ok`
- [ ] smoke critique passe
- [ ] flux login + dashboard + endpoint API principal valides
- [ ] erreurs 5xx redescendent à un niveau normal

## Commandes utiles (CLI)

### Vercel
```bash
vercel ls
vercel inspect <deployment-url>
```

### Railway
```bash
railway status
railway logs --service backend --environment production
```

## Documentation incident obligatoire

Après rollback, créer un rapport court:
- SHA déployé fautif
- SHA/version rollback
- impact utilisateur
- timeline
- cause racine (si connue)
- actions préventives

## Exigence de clôture

Un rollback n’est clôturé que si:
- monitoring stable pendant 30 min minimum
- incident communiqué
- ticket(s) correctif(s) créés et priorisés













