# Billing & Revenue Playbook

## 1. Taxes globales

- Service central : `BillingTaxService`.  
- Support TVA/TVH pour UE, USA (états majeurs), Canada, APAC.  
- API : `GET /billing/tax-rate?subtotalCents=12000&country=FR`.  
- À étendre : connexion aux bases officielles (VAT OSS, Avalara) + mise à jour dynamique.

## 2. Facturation & exports

- `BillingInvoiceService` génère un PDF (PDFKit) avec détail client, produit et TVA.  
- Endpoint : `GET /billing/orders/:orderId/invoice` (retour base64 + metadata).  
- TODO : stocker dans S3 (bucket `billing-invoices`) et envoyer via email au client.

## 3. Dashboard revenus

- `BillingReportingService` agrège les commandes payées + MRR.  
- Endpoint : `GET /billing/dashboard/revenue?startAt=2025-01-01&endAt=2025-01-31&currency=EUR`.  
- Résumé : MRR, top clients, breakdown produits, taxe vs net.
- TODO : exposer Prometheus metrics + synchroniser Looker Studio/Tableau.

## 4. Roadmap financière

| Priorité | Item | Détails |
|----------|------|---------|
| 🟢 | TVA & PDF ✅ | Implémenté backend. Ajouter UI preview + envoi email automatique. |
| 🟡 | Multi-devises | Ajouter FX rates (OpenExchangeRates) + conversions dashboard. |
| 🟡 | Compliance | Export SAF-T / FEC, archivage 10 ans (RGPD). |
| 🟠 | Recouvrement | Automatiser relances d’impayés (Stripe Billing retry rules + email). |
| 🟠 | Analytics | Converter `RevenueDashboard` → widgets (graphes) + alertes slack. |
| 🟠 | Marketplace fees | Gestion TVA sur frais (OSS). |

## 5. Tests

- `BillingTaxService` couvert par tests unitaires.  
- TODO : tests e2e invoice + webhooks (Stripe CLI).

## 6. Parité Stripe ↔ Catalogue

- Script `pnpm pricing:verify` :
  - charge `PLAN_DEFINITIONS` (`@luneo/billing-plans`)
  - récupère les prices Stripe (`STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE`)
  - compare montant, devise et intervalle (`month`)  
- CI doit rester **rouge** si : variable manquante, price introuvable ou montant différent de `basePriceCents`.
- Résultat console : tableau recap + détails / plan. Ajouter vos price IDs dans `.env` avant exécution.
Garder ce document synchronisé à chaque évolution (nouvelles zones fiscales, nouveaux KPIs).***

