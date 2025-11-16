## Plan d'exercices DR Multi-Région

### 1. Cadre général
Objectif : vérifier trimestriellement la capacité de la plateforme Luneo à basculer entre `eu-west-1` et `us-east-1` sans perte de données perceptible. Chaque exercice est orchestré sur un environnement de staging miroir puis transposé en production sous contrôle SRE.

### 2. Rythme
- Trimestriel : exercice complet de bascule.
- Mensuel : test ciblé (RDS, S3 ou DNS).
- Ad-hoc : suite à modification majeure infrastructurelle.

### 3. Participants
- Incident Commander (SRE).
- Observateur Produit.
- Représentant Support.
- Observateur FinOps.

### 4. Préparation J-7
- Vérifier que toutes les alertes CloudWatch fonctionnent.
- Confirmer que les secrets sont synchronisés (Vault → AWS Secrets Manager).
- Mettre à jour les endpoints dans `terraform.tfvars` si l'ingress a changé.
- Geler les déploiements non critiques pendant l'exercice.

### 5. Scénarios

1. **Perte ALB primaire**  
   - Simuler un arrêt ALB (`aws elbv2 modify-load-balancer-attributes` avec `routing.http.desync_mitigation_mode=defensive`).  
   - Vérifier le passage automatique Route53 vers secondaire.  
   - Mesurer temps de bascule.

2. **Lag Aurora critique**  
   - Injecter latence artificielle (`aws rds modify-db-cluster` rollback).  
   - Observer alarme `AuroraGlobalDBReplicationLag`.  
   - Promouvoir le secondaire et re-synchroniser.

3. **Corruption Redis**  
   - Dumper un dataset erroné sur le cache primaire.  
   - Basculer vers la réplique secondaire.  
   - Valider rehydratation via jobs backfill.

4. **S3 indisponible**  
   - Bloquer les PUT sur bucket primaire (policy).  
   - Vérifier que l'application bascule sur bucket secondaire.  
   - Valider reprise et alignement versions.

5. **Cluster EKS surchargé**  
   - Saturer CPU via `stress-ng` sur nodes primaires.  
   - Vérifier autoscaling et redirection vers cluster secondaire.

### 6. Checklist exécution (format 60 minutes)
- Minute 0 : lancement incident factice, assignation rôles.
- Minute 5 : collecte métriques initiales.
- Minute 10 : lancement du scénario choisi.
- Minute 20 : décision bascule (selon indicateurs).
- Minute 30 : tests fonctionnels.
- Minute 45 : retour au mode normal.
- Minute 55 : mini post-mortem à chaud.

### 7. Mesures de succès
- Temps de détection < 5 minutes.
- RPO constaté < 2 minutes (compare `pg_current_wal_lsn` entre régions).
- RTO constaté < 20 minutes (API à nouveau 200 OK).
- Zéro ticket support critique dans la fenêtre de test.

### 8. Reporting
- Documenter chaque exercice dans `Confluence > DR > Journal`.  
- Ajouter le log Terraform / kubectl associé.  
- Lister actions correctives et owners avec échéance.

### 9. Automatisation future
- Scripts SSM Automation pour promotion Aurora.  
- GitHub Action déclenchant un exercise plan Terraform.  
- Slack bot `@dr-buddy` pour rappeler la checklist.

### 10. Références
- `docs/runbooks/DR_RUNBOOK.md`
- `infrastructure/terraform/aws-multi-region/README.md`
- `docs/security/INCIDENT_RESPONSE.md`

