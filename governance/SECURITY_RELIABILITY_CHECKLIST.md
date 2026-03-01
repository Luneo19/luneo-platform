# Security & Reliability Checklist

## Pré-release (obligatoire)

- [ ] `pnpm run quality:release` vert.
- [ ] `pnpm run smoke:critical` vert sur l'environnement cible.
- [ ] Aucun secret exposé dans logs, code ou artefacts.
- [ ] Rollback documenté et testé.

## Sécurité applicative

- [ ] RBAC validé sur routes admin sensibles.
- [ ] CSRF validé sur toutes routes mutatives proxifiées.
- [ ] Cookies/tokens conformes (httpOnly, secure, sameSite).
- [ ] OAuth `state/pkce` explicitement configuré.
- [ ] Rotation des secrets planifiée et datée.

## Fiabilité opérationnelle

- [ ] Health endpoints backend/frontend vérifiés.
- [ ] Monitoring/alerting P1/P2 opérationnel.
- [ ] Webhooks critiques (Stripe/email) testés.
- [ ] Dashboard incidents et latence consultable.

## Post-release (hypercare)

- [ ] Contrôles 15 min pendant 2h, puis hourly 24h.
- [ ] Aucun incident P1/P2 non résolu.
- [ ] Rapport de clôture mis à jour.
