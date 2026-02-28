# Revenue Go/No-Go Checklist

## Billing lifecycle

- [ ] `invoice.payment_failed` place bien l'organisation en grace read-only (pas suspension immediate)
- [ ] Pendant grace: POST/PATCH/PUT/DELETE utilisateur bloque hors `/billing` et `/auth`
- [ ] A `T+3 jours`: organisation passe `SUSPENDED`
- [ ] `invoice.paid` reactive et nettoie `suspendedAt/suspendedReason`

## Quotas and overage

- [ ] FREE bloque strictement depassement `conversations` et `messages_ai`
- [ ] PRO/BUSINESS autorisent overage jusqu'au cap, puis bloquent
- [ ] Metering `UsageRecord` est cree pour chaque reponse agent

## Webhook security

- [ ] Stripe webhook reject si signature invalide
- [ ] SendGrid webhook reject si signature invalide (si cle configuree)
- [ ] Erreur idempotency infra Stripe webhook n'est pas silencieusement ignoree

## Anti-abuse

- [ ] Widget message/read/stream reject sans `conversationToken` valide
- [ ] Refund admin rejoue en double est bloque
- [ ] Rate limit coherent sans doublon de garde global
