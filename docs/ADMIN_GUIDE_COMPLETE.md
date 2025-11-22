# 👨‍💼 GUIDE ADMINISTRATEUR - LUNEO PLATFORM

**Date:** 20 Novembre 2025  
**Version:** 1.0.0  
**Public:** Administrateurs de la plateforme

---

## 🎯 VUE D'ENSEMBLE

Ce guide est destiné aux administrateurs de la plateforme Luneo pour la gestion complète du système, des utilisateurs, et de la configuration.

---

## 🔐 ACCÈS ADMINISTRATEUR

### Rôles Disponibles

- **PLATFORM_ADMIN** : Accès complet à toute la plateforme
- **BRAND_ADMIN** : Administration d'une marque spécifique
- **BRAND_USER** : Utilisateur d'une marque
- **CONSUMER** : Utilisateur final

### Connexion Admin

1. Connectez-vous avec un compte **PLATFORM_ADMIN**
2. Accédez au **Admin Dashboard**
3. Vérifiez vos permissions

---

## 👥 GESTION DES UTILISATEURS

### Lister les Utilisateurs

1. Allez dans **Admin** > **Users**
2. Consultez la liste complète
3. Filtrez par:
   - **Rôle** : Admin, User, etc.
   - **Statut** : Actif, Suspendu
   - **Date d'inscription**
   - **Recherche** : Nom, email

### Créer un Utilisateur

1. Cliquez sur **"Nouvel utilisateur"**
2. Remplissez:
   - **Email** : Adresse email
   - **Nom** : Prénom et nom
   - **Rôle** : Sélectionnez le rôle
   - **Marque** : Assignez à une marque (optionnel)
3. Cliquez sur **"Créer"**
4. Un email d'invitation est envoyé

### Modifier un Utilisateur

1. Sélectionnez un utilisateur
2. Cliquez sur **"Modifier"**
3. Modifiez:
   - **Rôle** : Changer le rôle
   - **Statut** : Activer/Désactiver
   - **Permissions** : Gérer les permissions
4. Cliquez sur **"Enregistrer"**

### Suspendre un Utilisateur

1. Sélectionnez un utilisateur
2. Cliquez sur **"Suspendre"**
3. Confirmez l'action
4. L'utilisateur ne pourra plus se connecter

### Supprimer un Utilisateur

1. Sélectionnez un utilisateur
2. Cliquez sur **"Supprimer"**
3. Confirmez l'action
4. ⚠️ **Attention** : Action irréversible

---

## 🏢 GESTION DES MARQUES

### Créer une Marque

1. Allez dans **Admin** > **Brands**
2. Cliquez sur **"Nouvelle marque"**
3. Remplissez:
   - **Nom** : Nom de la marque
   - **Description** : Description
   - **Logo** : Logo de la marque
   - **Statut** : Active, Suspendue, En attente
4. Cliquez sur **"Créer"**

### Gérer les Membres

1. Ouvrez une marque
2. Allez dans **"Membres"**
3. **Ajouter un membre** :
   - Cliquez sur **"Ajouter"**
   - Sélectionnez un utilisateur
   - Assignez un rôle (Admin, User)
4. **Retirer un membre** :
   - Cliquez sur **"Retirer"**
   - Confirmez l'action

---

## 📊 STATISTIQUES PLATEFORME

### Métriques Globales

1. Allez dans **Admin** > **Analytics**
2. Consultez:
   - **Utilisateurs totaux** : Nombre d'utilisateurs
   - **Marques actives** : Nombre de marques
   - **Designs créés** : Total de designs
   - **Commandes** : Nombre de commandes
   - **Revenus** : Revenus totaux

### Graphiques

- **Évolution utilisateurs** : Courbe d'inscription
- **Utilisation par marque** : Répartition
- **Designs par catégorie** : Graphique en secteurs
- **Revenus** : Évolution temporelle

---

## ⚙️ CONFIGURATION PLATEFORME

### Paramètres Généraux

1. Allez dans **Admin** > **Settings**
2. Configurez:
   - **Nom de la plateforme** : Luneo
   - **URL** : URL principale
   - **Email support** : Email de support
   - **Limites** : Quotas par défaut

### Intégrations

1. Allez dans **Admin** > **Integrations**
2. Configurez:
   - **Stripe** : Clés API Stripe
   - **SendGrid** : Clés API SendGrid
   - **Cloudinary** : Credentials Cloudinary
   - **OpenAI** : Clé API OpenAI
   - **Supabase** : Configuration Supabase

### Email Templates

1. Allez dans **Admin** > **Email Templates**
2. Configurez les templates:
   - **Welcome** : Email de bienvenue
   - **Order Confirmation** : Confirmation de commande
   - **Production Ready** : Design prêt
3. Utilisez les variables disponibles:
   - `{{user.name}}` : Nom de l'utilisateur
   - `{{order.number}}` : Numéro de commande
   - `{{design.name}}` : Nom du design

---

## 🔒 SÉCURITÉ

### Audit Logs

1. Allez dans **Admin** > **Security** > **Audit Logs**
2. Consultez:
   - **Connexions** : Historique des connexions
   - **Actions** : Actions des utilisateurs
   - **Erreurs** : Erreurs système
   - **Tentatives** : Tentatives d'accès

### Permissions

1. Allez dans **Admin** > **Security** > **Permissions**
2. Gérer les rôles:
   - **Créer un rôle** : Nouveau rôle personnalisé
   - **Permissions** : Assigner permissions
   - **Utilisateurs** : Assigner aux utilisateurs

### Rate Limiting

1. Allez dans **Admin** > **Security** > **Rate Limiting**
2. Configurez:
   - **Limite globale** : Requêtes par minute
   - **Par utilisateur** : Limite par utilisateur
   - **Par IP** : Limite par adresse IP
   - **Exceptions** : IPs whitelistées

---

## 💰 GESTION FINANCIÈRE

### Plans et Tarification

1. Allez dans **Admin** > **Billing** > **Plans**
2. Gérer les plans:
   - **Créer un plan** : Nouveau plan
   - **Modifier** : Modifier un plan existant
   - **Activer/Désactiver** : Statut du plan
   - **Prix** : Prix mensuel/annuel

### Factures

1. Allez dans **Admin** > **Billing** > **Invoices**
2. Consultez:
   - **Toutes les factures** : Liste complète
   - **Par utilisateur** : Factures d'un utilisateur
   - **Par période** : Filtre par date
   - **Exporter** : Export CSV/Excel

### Remboursements

1. Allez dans **Admin** > **Billing** > **Refunds**
2. Traiter les remboursements:
   - **Créer un remboursement** : Nouveau remboursement
   - **Statut** : En attente, Traité, Refusé
   - **Historique** : Tous les remboursements

---

## 📦 PRODUITS ET TEMPLATES

### Gérer les Templates

1. Allez dans **Admin** > **Templates**
2. Actions disponibles:
   - **Créer** : Nouveau template
   - **Modifier** : Modifier un template
   - **Supprimer** : Supprimer un template
   - **Approuver** : Approuver pour publication

### Catégories

1. Allez dans **Admin** > **Categories**
2. Gérer les catégories:
   - **Créer** : Nouvelle catégorie
   - **Modifier** : Modifier une catégorie
   - **Organiser** : Ordre d'affichage

---

## 🔄 MAINTENANCE

### Sauvegardes

1. Allez dans **Admin** > **Maintenance** > **Backups**
2. Actions:
   - **Créer une sauvegarde** : Sauvegarde manuelle
   - **Planifier** : Sauvegardes automatiques
   - **Restaurer** : Restaurer depuis une sauvegarde

### Logs Système

1. Allez dans **Admin** > **Maintenance** > **Logs**
2. Consultez:
   - **Application** : Logs de l'application
   - **Base de données** : Logs DB
   - **API** : Logs des API
   - **Erreurs** : Logs d'erreurs

### Health Check

1. Allez dans **Admin** > **Maintenance** > **Health**
2. Vérifiez:
   - **Database** : Statut de la base
   - **Redis** : Statut du cache
   - **Services externes** : Stripe, SendGrid, etc.
   - **Performance** : Latence, uptime

---

## 🚨 GESTION DES INCIDENTS

### Créer un Incident

1. Allez dans **Admin** > **Incidents**
2. Cliquez sur **"Nouvel incident"**
3. Remplissez:
   - **Titre** : Description courte
   - **Description** : Détails
   - **Sévérité** : Critique, Important, Mineur
   - **Statut** : En cours, Résolu
4. Cliquez sur **"Créer"**

### Résoudre un Incident

1. Ouvrez un incident
2. Ajoutez des notes de résolution
3. Changez le statut à **"Résolu"**
4. Enregistrez

---

## 📈 RAPPORTS

### Rapports Utilisateurs

1. Allez dans **Admin** > **Reports** > **Users**
2. Générer:
   - **Nouveaux utilisateurs** : Par période
   - **Activité** : Utilisateurs actifs
   - **Rétention** : Taux de rétention

### Rapports Financiers

1. Allez dans **Admin** > **Reports** > **Financial**
2. Générer:
   - **Revenus** : Revenus par période
   - **Abonnements** : Nouveaux abonnements
   - **Churn** : Taux d'attrition

### Rapports Techniques

1. Allez dans **Admin** > **Reports** > **Technical**
2. Générer:
   - **Performance** : Métriques de performance
   - **Erreurs** : Erreurs système
   - **Usage** : Utilisation des ressources

---

## 🔧 OUTILS ADMIN

### Console SQL

1. Allez dans **Admin** > **Tools** > **SQL Console**
2. ⚠️ **Attention** : Accès direct à la base de données
3. Exécutez des requêtes SQL
4. Consultez les résultats

### API Testing

1. Allez dans **Admin** > **Tools** > **API Tester**
2. Testez les endpoints:
   - **Sélectionnez un endpoint**
   - **Entrez les paramètres**
   - **Exécutez la requête**
   - **Consultez la réponse**

### Cache Management

1. Allez dans **Admin** > **Tools** > **Cache**
2. Actions:
   - **Vider le cache** : Purger tout le cache
   - **Par clé** : Purger une clé spécifique
   - **Statistiques** : Consulter les stats

---

## 📝 CHECKLIST ADMINISTRATEUR

### Quotidien
- [ ] Vérifier les logs d'erreurs
- [ ] Consulter les nouveaux utilisateurs
- [ ] Vérifier le statut des services
- [ ] Répondre aux tickets support

### Hebdomadaire
- [ ] Analyser les statistiques
- [ ] Vérifier les sauvegardes
- [ ] Réviser les permissions
- [ ] Mettre à jour la documentation

### Mensuel
- [ ] Rapport financier complet
- [ ] Audit de sécurité
- [ ] Optimisation performance
- [ ] Planification des mises à jour

---

## 🆘 SUPPORT TECHNIQUE

### Escalade

Si un problème nécessite une escalade:
1. Documentez le problème
2. Collectez les logs
3. Contactez l'équipe technique
4. Suivez le ticket

### Documentation Technique

- **API Documentation** : [https://api.luneo.app/docs](https://api.luneo.app/docs)
- **Architecture** : Voir docs/ARCHITECTURE.md
- **Deployment** : Voir docs/DEPLOYMENT_CHECKLIST.md

---

*Guide créé le 20 Novembre 2025 - Qualité Expert Mondial SaaS*

