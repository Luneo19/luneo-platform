# Billing State Machine Hardening

## Objectif

Fermer les incoherences critiques sur les transitions d'abonnement et la fiabilite invoices/webhooks.

## Hardening implemente

- Persistance facture Stripe en base `Invoice` sur webhooks:
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.payment_action_required`
  - Fichier: `apps/backend/src/modules/billing/stripe.service.ts`

- Mapping explicite des statuts Stripe -> `InvoiceStatus` Prisma:
  - `draft -> DRAFT`
  - `open -> OPEN`
  - `paid -> PAID`
  - `void -> VOID`
  - `uncollectible -> UNCOLLECTIBLE`

- Coherence de transition abonnement en `customer.subscription.updated`:
  - si actif: purge `suspendedAt/suspendedReason`
  - si suspendu/past_due: renseigne `suspendedAt` + raison technique si absente

- Mode grace de paiement conserve:
  - `invoice.payment_failed` garde `status=ACTIVE` + `suspendedReason=GRACE_READ_ONLY_PAYMENT_FAILED`
  - expiration de grace deja geree par cron `enforceGraceExpiry` -> `status=SUSPENDED`

## Points valides apres hardening

- Reconciliation factures admin possible depuis DB locale (`invoices`), meme si Stripe est indisponible ponctuellement.
- Historique invoices coherent avec paiements/retries.
- Transitions d'etat plus lisibles pour support et ops.

## Etapes suivantes (non bloquantes pour ce lot)

- Ajouter un test d'integration webhook couvrant `invoice.paid` + `invoice.payment_failed`.
- Ajouter une API admin de reconciliation `stripe invoice vs db invoice` (gap report).
