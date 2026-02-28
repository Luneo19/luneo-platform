# Revenue Protection Policy

## Objectif

Garantir une logique metier coherent sur la monetisation et limiter toute fuite de revenus liee a:

- echec de paiement
- contournement de quotas
- endpoints publics abusables
- actions financieres admin rejouees

## Etats d'organisation

- `ACTIVE`: usage normal selon plan et quotas
- `GRACE_READ_ONLY` (etat derive): `status=ACTIVE` + `suspendedReason=GRACE_READ_ONLY_PAYMENT_FAILED`
- `SUSPENDED`: blocage strict hors parcours de regularisation billing/auth
- `CANCELED`: blocage strict hors parcours de regularisation billing/auth

## Regle paiement echoue

1. Webhook `invoice.payment_failed`:
   - passe l'organisation en mode grace read-only pendant 3 jours
   - envoie email d'echec paiement
2. Pendant la grace:
   - methodes non read-only bloquees pour utilisateurs non-admin
   - recuperation possible via routes billing
3. A expiration de 3 jours:
   - passage automatique en `SUSPENDED`
   - envoi email de suspension
4. Webhook `invoice.paid`:
   - retour `ACTIVE`
   - purge des marqueurs de grace/suspension

## Politique overage par plan

- `FREE`: blocage strict a la limite
- `PRO`: overage autorise avec cap
- `BUSINESS`: overage autorise avec cap
- `ENTERPRISE`: overage autorise avec cap de securite eleve

Caps par defaut (configurables env):

- `REVENUE_PRO_OVERAGE_CONVERSATIONS_CAP` (defaut: `1000`)
- `REVENUE_BUSINESS_OVERAGE_CONVERSATIONS_CAP` (defaut: `5000`)
- `REVENUE_ENTERPRISE_OVERAGE_CONVERSATIONS_CAP` (defaut: `20000`)
- `REVENUE_PRO_OVERAGE_MESSAGES_CAP` (defaut: `10000`)
- `REVENUE_BUSINESS_OVERAGE_MESSAGES_CAP` (defaut: `50000`)
- `REVENUE_ENTERPRISE_OVERAGE_MESSAGES_CAP` (defaut: `200000`)
