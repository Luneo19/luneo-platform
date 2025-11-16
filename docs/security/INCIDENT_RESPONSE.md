# Incident Response – Guide Opérationnel

## 1. Détection
- Alertes Sentry (error, queue degraded), Prometheus (latence > SLO, jobs en échec), logs WAF/CDN.
- Reporter l’incident dans le canal `#sec-incident`.

## 2. Triage (≤ 15 min)
1. **Prioriser** : déterminer l’impact (données, disponibilité, finance).
2. **Assigner** : Incident Commander (IC), Communications Lead (CL), Ops Lead (OL).
3. **Créer** un ticket Incident (Jira) et démarrer timeline partagée.

## 3. Containment
- Désactiver les accès compromis (API keys, tokens).
- Mettre en place règles firewall/CDN pour bloquer l’attaque.
- Basculer sur configuration safe (feature flag, rollback release).

## 4. Eradication
- Appliquer patch, re-déployer services, purger job malveillant.
- Re-générer secrets si fuite potentielle.
- Vérifier logs pour détection de persistance.

## 5. Restauration
- Remettre en service (blue/green) avec surveillance renforcée.
- Confirmer absence d’indicateurs de compromission résiduels.
- Informer clients/parties prenantes (selon SLA/obligations légales).

## 6. Post-mortem (≤ 5 jours ouvrés)
- Rédiger rapport : cause racine, impact, temps MTTR.
- Plan d’actions correctives (technique & process).
- Mettre à jour runbooks, tests automatisés, formation.

## 7. Contacts & Outils
- **Security Champion** : `security@luneo.app`
- **Incident Commander rotation** : voir page on-call.
- **Outils** : Sentry, Grafana, PagerDuty, Statuspage, Jira, Confluence.

> Ce guide doit être relu après chaque incident majeur et au minimum une fois par trimestre.***

