# Runbook DR Multi-Région – Plateforme Luneo

## 1. Portée et objectifs
Ce runbook décrit la procédure officielle pour gérer un incident majeur touchant la région AWS primaire (`eu-west-1`) et assurer la continuité du service via la région secondaire (`us-east-1`). Il couvre la détection, la bascule, la restauration des données et le retour en production. Il s'applique à l'API backend, au frontend Next.js, aux workers IA, aux services e-commerce, aux files BullMQ et au stockage S3 partagé.

## 2. Indicateurs contractuels
- RPO cible : 5 minutes maximum grâce à Aurora Global Database et à la réplication S3.
- RTO cible : 30 minutes pour rétablir la disponibilité client.
- SLO disponibilité API : 99.9 % mensuel.

## 3. Pré-requis organisationnels
- Accès PagerDuty niveau `Incident Commander` pour le responsable SRE.
- Accès AWS avec rôle `OrganizationAccountAccessRole`.
- Communication temps réel sur Slack `#incident-war-room`.
- Template de communication client prêt (voir `docs/security/INCIDENT_RESPONSE.md` annexe C).

## 4. Détection de l'incident
- Alarmes CloudWatch clés : `aurora-replication-lag`, `s3-replication-latency`, `alb-5xx`, `route53-healthcheck`.
- Vérifier Grafana dashboard `Multi-Region Overview` pour confirmer la panne régionale.
- Consigner l'heure exacte, l'impact métier et les systèmes touchés dans le ticket JIRA `OPS-DR-<date>`.

## 5. Évaluation initiale
- Déterminer si la panne impacte uniquement l'application ou des services AWS gérés (référence AWS status page).
- Si seul le workload est impacté, tenter un `kubectl rollout restart` sur les workloads critiques en primaire (API, workers).
- Si la région entière est dégradée (ALB injoignable, noeuds EKS en erreur), déclencher la procédure de bascule.

## 6. Checklist de bascule vers la région secondaire
1. **Base de données**  
   - Vérifier le lag `aws rds describe-global-clusters` (champ `SecondaryWriteForwardingStatus`).  
   - Si lag < 300 secondes, exécuter `aws rds promote-read-replica-db-cluster --db-cluster-identifier luneo-prod-aurora-secondary --region us-east-1`.  
   - Mettre à jour Secrets Manager `DATABASE_URL` pour pointer sur l'endpoint writer secondaire `aws_rds_cluster.secondary.endpoint`.  
   - Noter l'heure de promotion dans le ticket incident.
2. **Queues & cache**  
   - Monter l'instance ElastiCache secondaire (si Global Datastore inactif, activer mode `promotion`).  
   - Reconfigurer `REDIS_URL` dans Secrets Manager vers la région secondaire.  
   - Invalider les workers en région primaire (`kubectl scale deployment ai-worker --replicas=0` côté primaire).
3. **Ingress & DNS**  
   - Confirmer que l'ingress `kube-system/aws-load-balancer-controller` en secondaire expose un hostname valide.  
   - Lancer `terraform apply -target=aws_route53_record.api_failover_primary -target=aws_route53_record.api_failover_secondary` pour s'assurer du routage failover actif.  
   - Forcer le passage en mode secondaire via `aws route53 change-resource-record-sets` en inversant `Failover=SECONDARY` devenu `PRIMARY`.
4. **CI/CD**  
   - Suspendre les pipelines GitHub Actions deploy production (éviter des déploiements sur primaire).  
   - Lancer `argo rollout restart luneo-api` sur le cluster secondaire pour s'assurer charge fraîche.  
   - Déployer la configuration spécifique DR (feature flag `dr_mode=true`) via `kubectl apply -f deploy/dr-overrides/configmap.yaml`.
5. **Vérifications fonctionnelles**  
   - Effectuer un `curl https://api.luneo.app/health` et `curl https://api.luneo.app/version`.  
   - Lancer suite de tests smoke `pnpm --filter luneo-frontend run test:e2e --filter smoke` en pointant sur l'API secondaire (variable `API_BASE_URL`).  
   - Valider qu'une commande e-commerce peut être créée et qu'un rendu IA se déclenche (utiliser mode sandbox).

## 7. Communication externe
- Informer le support client via message formaté (status page + newsletter).  
- Mettre à jour `status.luneo.app` avec statut `Dégradation majeure` + horodatage.  
- Préparer FAQ de suivi (impact, données préservées, délai estimé de retour primaire).

## 8. Pendant l'incident
- Surveiller en continu le lag de réplication et la santé des pods sur le cluster secondaire.  
- Noter toute modification manuelle effectuée (kubeconfig, secrets, IAM).  
- Maintenir une timeline partagée (Google Doc incident) mise à jour toutes les 10 minutes.  
- Continuer à exécuter les jobs critiques (facturation, webhooks) en validant que les queues BullMQ sont bien drainées dans la région secondaire (`bull-board`).

## 9. Restauration de la région primaire
1. **Remise en service EKS primaire**  
   - Vérifier l'état du cluster (`aws eks describe-cluster`).  
   - Appliquer `kubectl get nodes` pour valider le retour des noeuds.  
   - Redéployer les workloads via Argo CD (`argocd app sync luneo-api --prune`).  
   - Réexécuter `helm upgrade` pour s'assurer état add-ons (ALB controller, metrics server).
2. **Reconstruction de la base de données**  
   - Si la région primaire est à jour, reconfigurer la réplication (promouvoir le secondaire en writer global, puis réintégrer l'ancien primaire en lecteur).  
   - Exécuter `aws rds switchover-global-cluster --global-cluster-identifier luneo-prod-aurora-global --target-db-cluster-identifier luneo-prod-aurora-secondary`.  
   - Une fois synchronisé, réintégrer la région primaire comme lecteur via `aws rds failover-global-cluster`.
3. **Redis & caches**  
   - Refaire un snapshot du cache secondaire et le restaurer dans la région primaire.  
   - Reconfigurer `REDIS_URL` des applications vers l'endpoint primaire.  
   - Purger les clés obsolètes si nécessaire (`redis-cli --scan` pour vérifier).
4. **S3**  
   - Confirmer que la réplication résiduelle est complète (`aws s3api list-object-versions`).  
   - Réactiver la règle de réplication si suspendue.
5. **DNS**  
   - Revenir au mode normal : `aws route53 change-resource-record-sets` avec `Failover=PRIMARY` pointant sur la région primaire restaurée.  
   - Baisser le TTL à 30s pendant la période de surveillance.

## 10. Validation post-restauration
- Lancer la suite de tests de non-régression backend (`pnpm --filter luneo-backend run test:e2e`).  
- Valider les webhooks e-commerce (Shopify, WooCommerce) via environnements sandbox.  
- Vérifier les pipelines IA (génération d'image, upscale) sur cluster primaire.  
- Contrôler les dashboards financiers (Stripe, usage billing) pour détecter un éventuel retard.  
- S'assurer que les alertes CloudWatch reviennent à l'état `OK`.

## 11. Clôture de l'incident
- Rédiger le post-mortem sous 48 h (format template `docs/security/INCIDENT_RESPONSE.md`).  
- Ajouter les logs Terraform / kubectl exécutés dans le dossier `logs/incidents/<date>`.  
- Mettre à jour ce runbook si de nouvelles actions ont été nécessaires.  
- Planifier un exercice DR dans les 30 jours pour valider les corrections.

## 12. Annexes techniques
- Commandes utiles :
  - `aws rds describe-global-clusters --global-cluster-identifier luneo-prod-aurora-global`
  - `aws route53 list-resource-record-sets --hosted-zone-id <ZONE>`
  - `kubectl get pods -n luneo-platform --context arn:aws:eks:us-east-1:<account>:cluster/luneo-prod-eks-secondary`
  - `aws s3api list-object-versions --bucket luneo-prod-artifacts-eu-west-1 --output table`
  - `pnpm --filter luneo-backend run prisma:migrate:status`
  - `aws cloudwatch describe-alarms --alarm-names luneo-prod-aurora-replication-lag`
- Contacts :
  - SRE primaire : Antoine Dupuis `antoine@sre.luneo.app`
  - SRE secondaire : Mia Lemaire `mia@sre.luneo.app`
  - Responsable produit : Clara Nguyen `clara@luneo.app`
- Documentation associée :
  - `infrastructure/terraform/aws-multi-region/README.md`
  - `docs/dr/DR_TEST_EXERCISES.md`
  - `docs/security/SECRET_ROTATION.md`

## 13. Exercices trimestriels (résumé)
- **T0 + 0 min** : déclencher alerte factice sur Aurora.  
- **T0 + 5 min** : exécuter la promotion secondaire.  
- **T0 + 15 min** : basculer DNS vers secondaire.  
- **T0 + 25 min** : faire tourner les tests smoke.  
- **T0 + 30 min** : déclarer incident clos et passer en mode observation.  
- **T0 + 45 min** : revenir en mode normal avec switchover planifié de nuit.

## 14. Historique des révisions
- 2025-11-13 : création du runbook multi-région, alignement avec Terraform `aws-multi-region`.

