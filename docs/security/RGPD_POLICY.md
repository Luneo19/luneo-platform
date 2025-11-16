# Politique RGPD / CCPA – Luneo Platform

## 1. Principes
- **Minimisation** : seules les données nécessaires au service sont collectées (email, prénom, historique design).
- **Finalité** : chaque traitement possède une finalité documentée (cf. Registre des traitements).
- **Consentement** : collecte explicite pour marketing / prompts IA. Opt-out possible à tout moment.

## 2. Droits des utilisateurs
- **Accès / Portabilité** : endpoint `/gdpr/export` fournit archive JSON/CSV des données.
- **Rectification** : via profil utilisateur ou support.
- **Suppression** : `/gdpr/delete-account` déclenche workflow (purge DB + cache + objets Cloud).
- **Opposition** : préférences newsletter/notifications stockées dans `user_preferences`.

## 3. Conservation
- Comptes inactifs : purge 24 mois après dernière activité.
- Logs applicatifs : 90 jours (pseudonymisés).
- Données analytiques : agrégées et anonymisées (aucun PII).

## 4. Sécurité
- Données en transit via HTTPS/TLS1.3.
- Données sensibles (tokens, refresh) hashées ou chiffrées AES-256.
- Backups chiffrés, stockés dans S3 avec rotation clés KMS.

## 5. Sous-traitants
- Stripe (paiement), Cloudinary (média), Upstash (Redis), OpenAI/Replicate (IA). DPA signés, localisation UE/US.
- Mise à jour annuelle du registre sous-traitants.

## 6. IA & prompts
- Prompts IA nettoyés de PII avant envoi à provider.
- Temps de rétention prompts brut : 30 jours max, puis anonymisation.
- Exposition API publique : tokens signés, quotas, audit logs.

## 7. Gouvernance
- Data Protection Officer (DPO) : `dpo@luneo.app`
- Revues trimestrielles de conformité, audit externe annuel.
- Procédure notification CNIL/autorités <72h en cas de fuite.

---

Ce document est la baseline ; toute nouvelle fonctionnalité doit suivre un DPIA (Data Protection Impact Assessment) avant mise en production.***

