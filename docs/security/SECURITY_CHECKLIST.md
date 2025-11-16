# Security & Compliance Checklist (Weekly)

## 1. Application

- [ ] OWASP ZAP baseline (`npm run security:owasp`) report reviewed, alert backlog mis à jour.  
- [ ] Dependency audit (`npm run security:audit`) sans vulnérabilité `High`.  
- [ ] Headers de sécurité validés (`helmet`, CSP, HSTS) en prod.

## 2. Infrastructure

- [ ] Sauvegarde quotidienne OK (`s3://luneo-backups/<env>/<date>`).  
- [ ] Snapshots RDS + Redis conformes (rétention 30 jours / 12 mois).  
- [ ] Patching images Docker (base images < 30 jours).

## 3. Accès & IAM

- [ ] Rotation clés API (Supabase, Stripe, Cloudinary) < 90 jours.  
- [ ] Audit RBAC : comptes inactifs désactivés, MFA activé.  
- [ ] Vault : secrets GitHub Actions revus.

## 4. Conformité

- [ ] Registre traitements RGPD mis à jour.  
- [ ] Demandes DSR (Data Subject Request) traitées < 30 jours.  
- [ ] DPIA / AI Act : changements IA recensés.

## 5. Observabilité

- [ ] Sentry erreurs critiques triées (none unresolved > 7 jours).  
- [ ] Logs audit (connexion admin, modifications billing) archivés (CloudWatch/ELK).  
- [ ] Alertes Prometheus (queues BullMQ, latence API) OK.

Document à compléter lors du run hebdomadaire “Security Office Hours”.

