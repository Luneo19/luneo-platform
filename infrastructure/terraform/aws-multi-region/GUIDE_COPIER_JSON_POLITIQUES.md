# Guide : Copier le bon JSON pour créer les politiques

## ⚠️ Important

**NE PAS** copier le contenu de `policies-creation-data.json` dans l'éditeur de politique AWS.

Ce fichier est un fichier de **métadonnées** pour générer des commandes, pas une politique IAM.

## ✅ Ce qu'il faut copier

Pour chaque politique, vous devez copier le contenu du fichier JSON correspondant dans le dossier `iam-policies/`.

## 📋 Liste des politiques et leurs fichiers JSON

### 1. terraform-state-backend

**Fichier à ouvrir** : `iam-policies/01-terraform-state-backend.json`

**Contenu à copier** : Tout le contenu de ce fichier (commence par `{"Version": "2012-10-17", ...}`)

---

### 2. terraform-infrastructure-readonly

**Fichier à ouvrir** : `iam-policies/02-terraform-infrastructure-readonly.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 3. terraform-vpc-networking

**Fichier à ouvrir** : `iam-policies/03-terraform-vpc-networking.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 4. terraform-eks-management

**Fichier à ouvrir** : `iam-policies/04-terraform-eks-management.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 5. terraform-rds-aurora

**Fichier à ouvrir** : `iam-policies/05-terraform-rds-aurora.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 6. terraform-s3-artifacts

**Fichier à ouvrir** : `iam-policies/06-terraform-s3-artifacts.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 7. terraform-route53-dns

**Fichier à ouvrir** : `iam-policies/07-terraform-route53-dns.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 8. terraform-cloudwatch-monitoring

**Fichier à ouvrir** : `iam-policies/08-terraform-cloudwatch-monitoring.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 9. terraform-backup-management

**Fichier à ouvrir** : `iam-policies/09-terraform-backup-management.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

### 10. terraform-iam-management

**Fichier à ouvrir** : `iam-policies/10-terraform-iam-management.json`

**Contenu à copier** : Tout le contenu de ce fichier

---

## 📝 Étapes pour créer une politique

1. **AWS Console** → **IAM** → **Politiques** → **Créer une politique**
2. Cliquez sur l'onglet **"JSON"**
3. **Supprimez tout le contenu** existant dans l'éditeur
4. **Ouvrez le fichier JSON correspondant** depuis `iam-policies/` (ex: `01-terraform-state-backend.json`)
5. **Copiez TOUT le contenu** du fichier (doit commencer par `{"Version": "2012-10-17", ...}`)
6. **Collez** dans l'éditeur JSON de la console AWS
7. Cliquez sur **"Suivant"**
8. **Nommez la politique** (ex: `terraform-state-backend`)
9. **Ajoutez une description** (ex: "Permissions pour le backend Terraform (S3 + DynamoDB)")
10. Cliquez sur **"Créer une politique"**

## 🔍 Comment reconnaître le bon format

Le JSON d'une politique IAM valide doit :
- Commencer par `{"Version": "2012-10-17",`
- Contenir un tableau `"Statement": [...]`
- Chaque statement doit avoir `"Effect"` et `"Action"`

**Exemple de format correct** :
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3StateBackend",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        ...
      ],
      "Resource": [...]
    }
  ]
}
```

## ❌ Format incorrect (ne pas utiliser)

Le fichier `policies-creation-data.json` contient :
```json
{
  "account_id": "115849270532",
  "user_name": "191197Em.",
  "policies": [...]
}
```

**Ce n'est PAS une politique IAM**, c'est un fichier de métadonnées.

## 💡 Astuce rapide

Pour ouvrir rapidement un fichier JSON dans votre éditeur :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
# Exemple pour la première politique
cat iam-policies/01-terraform-state-backend.json
```

Ou utilisez votre éditeur pour ouvrir directement le fichier.

