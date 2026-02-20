# Configuration Email Routing - luneo.app

## Adresses email referencees dans le code

| Adresse | Usage | Page |
|---------|-------|------|
| contact@luneo.app | Formulaire contact | /contact |
| press@luneo.app | Relations presse | /press |
| legal@luneo.app | Questions juridiques | /legal/* |
| privacy@luneo.app | Protection des donnees | /legal/privacy |
| dpo@luneo.app | Delegue protection donnees | /legal/gdpr, /legal/ndsg |
| careers@luneo.app | Candidatures spontanees | /careers |

## Option recommandee : Cloudflare Email Routing (gratuit)

1. Aller dans Cloudflare Dashboard > luneo.app > Email Routing
2. Activer Email Routing
3. Creer les regles de routage :
   - contact@luneo.app → votre-email-principal@gmail.com
   - press@luneo.app → votre-email-principal@gmail.com
   - legal@luneo.app → votre-email-principal@gmail.com
   - privacy@luneo.app → votre-email-principal@gmail.com
   - dpo@luneo.app → votre-email-principal@gmail.com
   - careers@luneo.app → votre-email-principal@gmail.com
4. Cloudflare ajoutera automatiquement les enregistrements MX et TXT

## Alternative : Catch-all

Au lieu de creer chaque adresse individuellement :
1. Activer "Catch-all" dans Email Routing
2. Rediriger *@luneo.app → votre-email-principal@gmail.com

## Envoi d'emails (SendGrid)

Les emails sortants (confirmations, notifications) utilisent SendGrid.
Variables d'environnement requises :
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL (ex: noreply@luneo.app)
- CONTACT_EMAIL (destinataire des formulaires contact)

Pour que SendGrid puisse envoyer depuis @luneo.app :
1. Verifier le domaine dans SendGrid > Settings > Sender Authentication
2. Ajouter les enregistrements CNAME fournis par SendGrid dans Cloudflare DNS
