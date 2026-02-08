# AGENT-21: Documentation Operationnelle

**Objectif**: Creer la documentation operationnelle complete : runbooks, onboarding dev, DR plan, Swagger

**Priorité**: P2  
**Complexité**: 2/5  
**Estimation**: 5-8 jours  
**Dépendances**: AGENT-18 (Infra Hardening)

---

## 📋 SCOPE

### Documents a Creer

1. **Runbooks incidents** : procedures pour les pannes courantes
2. **Guide onboarding developpeur** : setup local en 15 minutes
3. **Plan de reprise d'activite (DR)** : comment restaurer apres un incident majeur
4. **Documentation API Swagger** : completer les endpoints manquants

### Fichiers Existants a Ameliorer

- `docs/DEPLOYMENT_GUIDE.md` - A mettre a jour
- `docs/DEVELOPMENT_GUIDE.md` - A completer
- `docs/TROUBLESHOOTING.md` - A enrichir
- `docs/API_DOCUMENTATION.md` - A completer avec Swagger

---

## ✅ TÂCHES

### Phase 1: Runbooks Incidents (2-3 jours)

- [ ] Ecrire runbook : "Base de donnees inaccessible"
  - Diagnostic, escalade, restauration backup, verification
- [ ] Ecrire runbook : "Redis down / Cache indisponible"
  - Impact, mode degrade, restart, verification
- [ ] Ecrire runbook : "Stripe API indisponible"
  - Impact sur checkout, queue retry, notification clients
- [ ] Ecrire runbook : "Deploiement echoue / Rollback"
  - Identifier la cause, rollback, hotfix, re-deploiement
- [ ] Ecrire runbook : "Pic de trafic / Rate limiting active"
  - Scaling horizontal, cache warmup, optimisation queries
- [ ] Ecrire runbook : "Fuite de secrets / Compromission"
  - Rotation immediate, audit acces, notification utilisateurs

### Phase 2: Guide Onboarding Developpeur (1-2 jours)

- [ ] Ecrire guide step-by-step : clone -> install -> run en 15 min
- [ ] Documenter les prerequisites (Node, pnpm, PostgreSQL, Redis)
- [ ] Documenter la configuration des env vars
- [ ] Documenter les commandes utiles (dev, build, test, lint, migrate)
- [ ] Ajouter un script `scripts/setup-dev.sh` qui automatise le setup
- [ ] Documenter l'architecture du monorepo (apps/, packages/, etc.)

### Phase 3: Plan de Reprise d'Activite (1-2 jours)

- [ ] Documenter RPO (Recovery Point Objective) : perte max 1h de donnees
- [ ] Documenter RTO (Recovery Time Objective) : retour en ligne max 30 min
- [ ] Procedure restauration DB depuis backup
- [ ] Procedure re-deploiement depuis une version stable
- [ ] Procedure communication clients pendant incident
- [ ] Test trimestriel du plan DR

### Phase 4: Documentation API Swagger (1-2 jours)

- [ ] Verifier que tous les endpoints backend ont des decorateurs Swagger (@ApiOperation, @ApiResponse)
- [ ] Ajouter les DTOs manquants avec @ApiProperty
- [ ] Verifier que Swagger UI est desactive en production
- [ ] Exporter la spec OpenAPI en JSON pour documentation externe
- [ ] Ajouter des exemples de requetes/reponses

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Structure Documentation

```
docs/
├── README.md                    # Index documentation
├── DEVELOPMENT_GUIDE.md         # Setup + conventions
├── DEPLOYMENT_GUIDE.md          # Deploiement + CI/CD
├── API_DOCUMENTATION.md         # Liens Swagger + exemples
├── ARCHITECTURE.md              # Architecture technique
├── TROUBLESHOOTING.md           # Problemes courants
├── runbooks/
│   ├── database-down.md
│   ├── redis-down.md
│   ├── stripe-down.md
│   ├── deploy-failed.md
│   ├── traffic-spike.md
│   └── security-breach.md
├── DISASTER_RECOVERY.md         # Plan DR
└── ONBOARDING.md                # Guide nouvel arrivant
```

### Template Runbook

```markdown
# Runbook: [Nom de l'incident]

## Severite: [P1/P2/P3]
## Impact: [Description de l'impact]

## Detection
- Comment detecter le probleme
- Alertes concernees

## Diagnostic
1. Etape 1 de diagnostic
2. Etape 2 de diagnostic

## Resolution
1. Action immediate
2. Action corrective
3. Verification

## Prevention
- Mesures pour eviter la recurrence

## Escalade
- Si non resolu en 15 min : contacter [personne]
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **6 runbooks** ecrits et revus
- [ ] **Guide onboarding** teste par un nouveau developpeur (setup < 15 min)
- [ ] **Plan DR** documente avec RPO/RTO definis
- [ ] **100% des endpoints** documentes dans Swagger
- [ ] Documentation accessible depuis le README principal

---

## 🔗 RESSOURCES

- Documentation existante : `docs/`
- Swagger : `apps/backend/src/main.ts` (setup SwaggerModule)
- Health checks : `apps/backend/src/modules/health/`

---

## 📝 NOTES

- Les runbooks doivent etre actionables par un developpeur junior
- Le guide onboarding doit etre teste par quelqu'un qui ne connait pas le projet
- Le plan DR doit etre teste au moins une fois avant le lancement
- La doc Swagger ne doit pas etre accessible en production (risque securite)
