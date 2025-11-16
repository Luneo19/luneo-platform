# Guide étape par étape : Correction des permissions IAM

## 📋 Résumé des erreurs

Votre utilisateur IAM `191197Em.` manque les permissions suivantes :
1. `ec2:DescribeAvailabilityZones` - Pour lister les zones de disponibilité
2. `route53:ListHostedZones` - Pour lire les zones Route53

## 🔧 Étape 1 : Accéder à la console IAM

1. Connectez-vous à la console AWS : https://console.aws.amazon.com/
2. Assurez-vous d'être dans la région **Global** (pas une région spécifique)
3. Dans la barre de recherche en haut, tapez **"IAM"** et cliquez sur **"IAM"**
4. Dans le menu de gauche, cliquez sur **"Politiques"** (Policies)

## 🔧 Étape 2 : Modifier la politique `saas.luneo`

Cette politique contient probablement un bloc `Deny` qui bloque les permissions nécessaires.

### 2.1 Ouvrir la politique

1. Dans la liste des politiques, recherchez **`saas.luneo`**
2. Cliquez sur le nom de la politique pour l'ouvrir
3. Cliquez sur l'onglet **"JSON"** en haut

### 2.2 Examiner le JSON

Recherchez dans le JSON un bloc qui ressemble à ceci :

```json
{
  "Effect": "Deny",
  "Action": [
    "ec2:*",
    "route53:*"
  ],
  "Resource": "*"
}
```

OU un bloc qui bloque spécifiquement :
- `ec2:DescribeAvailabilityZones`
- `route53:ListHostedZones`

### 2.3 Modifier la politique

**Option A : Si le Deny bloque tout EC2/Route53**

Modifiez le bloc `Deny` pour exclure les actions nécessaires :

```json
{
  "Effect": "Deny",
  "Action": [
    "ec2:*"
  ],
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "ec2:Action": [
        "ec2:DescribeAvailabilityZones"
      ]
    }
  }
}
```

**Option B : Si vous pouvez simplement ajouter des Allow (RECOMMANDÉ)**

Ajoutez un nouveau bloc `Statement` avec `Effect: "Allow"` :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    // ... vos statements existants ...
    {
      "Sid": "AllowEC2AndRoute53ReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2.4 Enregistrer les modifications

1. Cliquez sur **"Vérifier la politique"** (Review policy) en bas
2. Si aucune erreur n'apparaît, cliquez sur **"Enregistrer les modifications"** (Save changes)

## 🔧 Étape 3 : Vérifier que la politique est attachée à votre utilisateur

1. Dans le menu de gauche IAM, cliquez sur **"Personnes"** (Users)
2. Recherchez et cliquez sur **`191197Em.`**
3. Dans l'onglet **"Autorisations"** (Permissions), vérifiez que la politique **`saas.luneo`** est bien listée
4. Si elle n'est pas attachée :
   - Cliquez sur **"Ajouter des autorisations"** (Add permissions)
   - Sélectionnez **"Attacher directement des politiques"** (Attach policies directly)
   - Cochez **`saas.luneo`**
   - Cliquez sur **"Suivant"** puis **"Ajouter des autorisations"**

## 🔧 Étape 4 : Vérifier les permissions

Après avoir modifié la politique, attendez **1-2 minutes** pour que les changements se propagent, puis testez :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

# Test EC2
aws ec2 describe-availability-zones --region eu-west-1

# Test Route53
aws route53 list-hosted-zones
```

Si ces commandes fonctionnent, vous pouvez relancer :

```bash
terraform plan -out tfplan
```

## 🔧 Étape 5 : Alternative - Créer une politique dédiée

Si vous ne pouvez pas modifier `saas.luneo`, créez une nouvelle politique :

### 5.1 Créer la politique

1. IAM → **"Politiques"** → **"Créer une politique"** (Create policy)
2. Cliquez sur l'onglet **"JSON"**
3. Collez ce contenu :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformInfrastructureReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    }
  ]
}
```

4. Cliquez sur **"Suivant"** (Next)
5. Nommez la politique : **`terraform-infrastructure-readonly`**
6. Description : **"Permissions en lecture seule pour Terraform (EC2, Route53)"**
7. Cliquez sur **"Créer une politique"** (Create policy)

### 5.2 Attacher la politique à votre utilisateur

1. IAM → **"Personnes"** → **`191197Em.`**
2. **"Ajouter des autorisations"** → **"Attacher directement des politiques"**
3. Recherchez et cochez **`terraform-infrastructure-readonly`**
4. **"Suivant"** → **"Ajouter des autorisations"**

## ⚠️ Notes importantes

1. **Ordre des politiques** : Les politiques `Deny` ont toujours priorité sur les `Allow`. Si `saas.luneo` contient un `Deny` global, vous devez soit :
   - Le modifier pour exclure les actions nécessaires
   - Le supprimer si possible
   - Demander à un administrateur de le faire

2. **Propagation** : Les changements de politiques IAM peuvent prendre jusqu'à 5 minutes pour se propager.

3. **Sécurité** : Les permissions ajoutées sont en **lecture seule** et ne permettent pas de modifier des ressources, seulement de les lire.

## ✅ Vérification finale

Une fois les permissions corrigées, vous devriez pouvoir exécuter :

```bash
terraform plan -out tfplan
```

Sans erreurs de permissions. Le plan devrait afficher :
```
Plan: 96 to add, 0 to change, 0 to destroy.
```

