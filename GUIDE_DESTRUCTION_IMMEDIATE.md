# 🚨 GUIDE DE DESTRUCTION IMMÉDIATE - Ressources AWS

## ⚠️ SITUATION
Les ressources AWS coûtent **1200$/mois**. Il faut les détruire **MAINTENANT**.

## 🔍 Étape 1: Identifier les Ressources Actives

### Via AWS Console

1. **Aller sur AWS Cost Explorer:**
   - https://console.aws.amazon.com/cost-management/home#/cost-explorer
   - Filtrer par service pour voir ce qui coûte

2. **Vérifier chaque service:**

#### a) RDS (Base de données)
- https://console.aws.amazon.com/rds/
- Chercher des instances PostgreSQL
- **Coût typique:** $50-100/mois

#### b) ElastiCache (Redis)
- https://console.aws.amazon.com/elasticache/
- Chercher des clusters Redis
- **Coût typique:** $15-30/mois

#### c) ECS (Conteneurs)
- https://console.aws.amazon.com/ecs/
- Chercher des clusters et services
- **Coût typique:** $30-100/mois

#### d) EC2 Load Balancer
- https://console.aws.amazon.com/ec2/v2/home#LoadBalancers:
- Chercher des Application Load Balancers
- **Coût typique:** $16-20/mois

#### e) S3 (Stockage)
- https://console.aws.amazon.com/s3/
- Chercher des buckets (sauf `luneo-terraform-state`)
- **Coût typique:** Variable

#### f) CloudFront (CDN)
- https://console.aws.amazon.com/cloudfront/
- Chercher des distributions
- **Coût typique:** Variable

#### g) CloudWatch (Logs)
- https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#logsV2:log-groups
- Chercher des log groups
- **Coût typique:** $0.50/GB

---

## 💥 Étape 2: Destruction des Ressources

### Méthode Rapide (Si vous avez accès AWS CLI)

```bash
# Installer AWS CLI si nécessaire
brew install awscli

# Configurer les credentials
aws configure

# Lister toutes les ressources
aws ec2 describe-instances
aws rds describe-db-instances
aws elasticache describe-cache-clusters
aws ecs list-clusters
aws elbv2 describe-load-balancers
aws s3 ls
aws cloudfront list-distributions
```

### Méthode Manuelle (Recommandée)

Suivez le guide détaillé: **`scripts/destroy-aws-manual.md`**

**Résumé rapide:**

1. **RDS:** Console → RDS → Sélectionner instance → Delete
2. **ElastiCache:** Console → ElastiCache → Sélectionner cluster → Delete
3. **ECS:** Console → ECS → Mettre desired count à 0 → Delete service → Delete cluster
4. **Load Balancer:** Console → EC2 → Load Balancers → Delete
5. **S3:** Console → S3 → Vider bucket → Delete bucket
6. **CloudFront:** Console → CloudFront → Disable → Delete
7. **CloudWatch:** Console → CloudWatch → Logs → Delete log groups
8. **VPC:** Console → VPC → Supprimer NAT Gateways → Internet Gateways → Subnets → VPC

---

## ✅ Étape 3: Vérification

### 1. Vérifier les Coûts
- https://console.aws.amazon.com/billing/
- Les coûts doivent diminuer dans les prochaines heures

### 2. Configurer des Alertes
- AWS Console → Billing → Budgets
- Créer un budget avec alerte à $10/mois
- Email: votre email

### 3. Vérifier qu'il ne reste rien
- AWS Cost Explorer → Filtrer par service
- Tous les services doivent être à $0 ou très faible

---

## 🎯 Ordre de Destruction Recommandé

1. **D'abord:** Arrêter les services actifs (ECS, Load Balancer)
2. **Ensuite:** Supprimer les bases de données (RDS, ElastiCache)
3. **Puis:** Supprimer le stockage (S3, CloudFront)
4. **Enfin:** Supprimer l'infrastructure (VPC, CloudWatch)

---

## ⏱️ Temps Estimé

- **Identification:** 10-15 minutes
- **Destruction:** 30-60 minutes
- **Vérification:** 10 minutes

**Total:** ~1-1.5 heures

---

## 🆘 Si Vous Ne Pouvez Pas Accéder à AWS Console

1. **Vérifier les credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Réinitialiser le mot de passe AWS** si nécessaire

3. **Contacter le support AWS** si le compte est verrouillé

---

## 📊 Résultat Attendu

Après destruction complète:
- ✅ **Coût AWS:** $0/mois (ou minimal)
- ✅ **Ressources actives:** 0
- ✅ **Économie:** ~$1200/mois

---

## ⚠️ ATTENTION

- **Exportez vos données** avant de supprimer RDS
- **Sauvegardez le Terraform state** si vous voulez restaurer plus tard
- **Vérifiez les dépendances** avant de supprimer (ex: VPC doit être vide)

---

**ACTION REQUISE IMMÉDIATEMENT** - Chaque jour = ~$40 de coût!

