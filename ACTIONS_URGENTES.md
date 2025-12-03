# 🚨 ACTIONS URGENTES - Détruire les Ressources AWS

## ⚠️ SITUATION CRITIQUE
Les ressources AWS tournent encore et coûtent **~1200$/mois**. Il faut les détruire **MAINTENANT**.

---

## 🎯 Option 1: Via Terraform (Recommandé si Terraform est installé)

### Prérequis
- Terraform installé (`brew install terraform`)
- Credentials AWS configurés (`AWS_ACCESS_KEY_ID` et `AWS_SECRET_ACCESS_KEY`)

### Commandes

```bash
# 1. Aller dans le répertoire Terraform
cd infrastructure/terraform

# 2. Vérifier l'état actuel
terraform plan -destroy

# 3. Détruire toutes les ressources
terraform destroy

# 4. Confirmer avec "yes" quand demandé
```

**OU utiliser le script automatique:**
```bash
./scripts/destroy-aws-resources.sh
```

---

## 🎯 Option 2: Via AWS Console (Manuel)

Si Terraform n'est pas disponible, suivez le guide manuel:

**📖 Voir:** `scripts/destroy-aws-manual.md`

**Résumé rapide:**
1. [RDS](https://console.aws.amazon.com/rds/) → Supprimer l'instance PostgreSQL
2. [ElastiCache](https://console.aws.amazon.com/elasticache/) → Supprimer le cluster Redis
3. [ECS](https://console.aws.amazon.com/ecs/) → Arrêter les services et supprimer le cluster
4. [EC2 → Load Balancers](https://console.aws.amazon.com/ec2/v2/home#LoadBalancers:) → Supprimer l'ALB
5. [S3](https://console.aws.amazon.com/s3/) → Vider et supprimer les buckets
6. [CloudFront](https://console.aws.amazon.com/cloudfront/) → Désactiver et supprimer la distribution
7. [CloudWatch](https://console.aws.amazon.com/cloudwatch/) → Supprimer les log groups
8. [VPC](https://console.aws.amazon.com/vpc/) → Supprimer le VPC et les ressources associées

---

## ✅ Vérification Post-Destruction

### 1. Vérifier les Coûts
```bash
# Aller sur AWS Billing Dashboard
https://console.aws.amazon.com/billing/
```

### 2. Vérifier les Ressources Actives
```bash
# Aller sur AWS Cost Explorer
https://console.aws.amazon.com/cost-management/home#/cost-explorer
```

### 3. Configurer des Alertes de Budget
1. AWS Console → Billing → Budgets
2. Créer un budget avec alerte à $10/mois
3. Recevoir des emails si le budget est dépassé

---

## 📊 Économie Attendue

| Avant | Après |
|-------|-------|
| ~$1200/mois | ~$0/mois |
| Ressources actives | 0 ressource |

**ÉCONOMIE: 1200$/mois = 14,400$/an** 💰

---

## ⏰ Temps Estimé

- **Via Terraform:** 10-15 minutes
- **Via AWS Console:** 30-60 minutes

---

## 🆘 Besoin d'Aide?

1. Consulter `scripts/destroy-aws-manual.md` pour le guide détaillé
2. Vérifier `AWS_UTILISATION_ET_DESACTIVATION.md` pour plus d'informations
3. Contacter le support AWS si nécessaire

---

**⚠️ ACTION REQUISE IMMÉDIATEMENT** - Chaque jour qui passe coûte ~$40!

