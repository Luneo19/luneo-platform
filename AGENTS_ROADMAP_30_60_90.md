# Roadmap Agents 30/60/90 jours

## Horizon 30 jours (MVP operationnel)

### Objectif
Rendre la plateforme stable et deployable pour des cas reels.

### Chantiers
- Stabilisation post-login (JS/runtime + endpoints + mode clair lisible).
- Wizard "create -> connect -> publish" simplifie.
- Packs verticaux initiaux: SaaS, E-commerce, Services.
- Connecteurs critiques fiabilises: Shopify, HubSpot/Salesforce, Calendar.
- Monitoring minimal des erreurs connecteurs (health + retries + logs).

### KPI
- Activation J+7.
- Temps moyen de mise en production d'un agent.
- Taux d'erreur post-login.

## Horizon 60 jours (fiabilisation scale)

### Objectif
Ameliorer robustesse runtime et credibilite business.

### Chantiers
- Unification des moteurs flow/workflow.
- Guardrails avances (confidence threshold, handoff humain, policy actions).
- Attribution ROI v1.5 (mesure + transparence des estimations).
- Tableaux de bord differenciant clairement mesure vs estime.

### KPI
- Taux de succes actions integrations.
- Latence p95 de reponse.
- Taux de resolution sans humain.

## Horizon 90 jours (acceleration commerciale)

### Objectif
Industrialiser l'offre et accelerer la croissance.

### Chantiers
- Marketplace playbooks/connecteurs.
- Automatisations multicanal (widget + email + messaging).
- Recommandations automatiques de tuning.
- SLO/SLA produit + alerting operationnel.

### KPI
- NRR / retention clients.
- Conversion lead -> opportunite attribuee aux agents.
- Revenu attribue aux agents par verticale.

## Dependances transverses

- Normalisation schemas API et contrats d'integration.
- Instrumentation events business et techniques.
- Gouvernance RBAC + audit trail sur actions sensibles.
