## Description
<!-- Résume le pourquoi du changement et le risque principal -->

## Type de changement
- [ ] `fix`
- [ ] `feat`
- [ ] `refactor`
- [ ] `test`
- [ ] `docs`
- [ ] `chore`

## Portée
- [ ] Backend
- [ ] Frontend
- [ ] Infra/CI
- [ ] Sécurité
- [ ] Produit/KPI

## Release Gate (obligatoire)
- [ ] `pnpm run quality:release` passe localement
- [ ] Aucun secret exposé (logs, code, screenshots)
- [ ] Rollback défini (commande + condition de déclenchement)
- [ ] Observabilité vérifiée (logs/metrics/alertes impactées)

## Sécurité (si applicable)
- [ ] Auth/RBAC/CSRF revus
- [ ] Validation input + erreurs maîtrisées
- [ ] Rotation/usage secrets conforme

## Tests effectués
- [ ] Tests unitaires ciblés
- [ ] Smoke manuel parcours critique
- [ ] Non-régression des flows sensibles

## Plan de rollback
<!-- Ex: revert commit X, redeploy workflow Y, vérifier endpoint Z -->

## Impact produit / business
<!-- Effet attendu sur conversion, stabilité, coût, support -->

## Evidences
<!-- Logs, captures, liens dashboards, ID run CI -->



