# Politique d'autorisation pour créer les autres politiques

## 🎯 Objectif

Créer **UNE** politique IAM qui vous donnera les permissions nécessaires pour créer toutes les autres politiques via AWS CLI.

## 📋 Étape 1 : Créer la politique d'autorisation

### Via la console AWS :

1. **AWS Console** → **IAM** → **Politiques** → **Créer une politique**
2. Cliquez sur l'onglet **"JSON"**
3. **Supprimez tout le contenu** existant
4. **Ouvrez le fichier** : `iam-policies/00-terraform-iam-policy-management.json`
5. **Copiez TOUT le contenu** du fichier
6. **Collez** dans l'éditeur JSON de la console AWS
7. Cliquez sur **"Suivant"**
8. **Nommez la politique** : `terraform-iam-policy-management`
9. **Description** : "Permissions pour créer et gérer les politiques IAM Terraform"
10. Cliquez sur **"Créer une politique"**

### Via AWS CLI (si vous avez déjà les permissions) :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region

aws iam create-policy \
  --policy-name terraform-iam-policy-management \
  --policy-document file://iam-policies/00-terraform-iam-policy-management.json \
  --description "Permissions pour créer et gérer les politiques IAM Terraform"
```

## 📋 Étape 2 : Attacher la politique à votre utilisateur

### Via la console AWS :

1. **IAM** → **Personnes** → **`191197Em.`**
2. Onglet **"Autorisations"** → **"Ajouter des autorisations"**
3. **"Attacher directement des politiques"**
4. Recherchez et cochez **`terraform-iam-policy-management`**
5. Cliquez sur **"Suivant"** puis **"Ajouter des autorisations"**

### Via AWS CLI (si vous avez les permissions) :

```bash
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-iam-policy-management
```

## 📋 Étape 3 : Créer toutes les autres politiques via CLI

Une fois la politique attachée, attendez **1-2 minutes** puis exécutez :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
./create-all-policies-admin.sh
```

Ou utilisez les commandes individuelles depuis `COMMANDES_ADMIN.md`.

## ✅ Vérification

Vérifiez que vous avez maintenant les permissions :

```bash
# Tester la création d'une politique
aws iam create-policy \
  --policy-name test-policy \
  --policy-document '{"Version":"2012-10-17","Statement":[]}' \
  --description "Test" 2>&1

# Si ça fonctionne, supprimez la politique de test
aws iam delete-policy --policy-arn arn:aws:iam::115849270532:policy/test-policy
```

## 📝 Résumé

1. ✅ Créer la politique `terraform-iam-policy-management` (fichier `00-terraform-iam-policy-management.json`)
2. ✅ L'attacher à votre utilisateur `191197Em.`
3. ✅ Attendre 1-2 minutes pour la propagation
4. ✅ Exécuter `./create-all-policies-admin.sh` pour créer les 10 autres politiques

