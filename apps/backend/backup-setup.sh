#!/bin/bash
echo "💾 Configuration des sauvegardes automatiques pour Luneo..."

# 1. Création du répertoire de sauvegardes
echo "📁 Création du répertoire de sauvegardes..."
ssh root@116.203.31.129 "cd /home/deploy/app && mkdir -p backups"

# 2. Création du script de sauvegarde
echo "🔧 Création du script de sauvegarde..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > backup-database.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR=\"/home/deploy/app/backups\"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=\"luneo_production_\${DATE}.sql\"
BACKUP_PATH=\"\${BACKUP_DIR}/\${BACKUP_FILE}\"

echo \"[$(date)] Début de la sauvegarde de la base de données...\"

# Sauvegarde de la base de données
docker exec luneo_postgres_prod pg_dump -U luneo_user -d luneo_production > \"\${BACKUP_PATH}\"

if [ \$? -eq 0 ]; then
    echo \"[$(date)] ✅ Sauvegarde réussie: \${BACKUP_FILE}\"
    
    # Compression de la sauvegarde
    gzip \"\${BACKUP_PATH}\"
    echo \"[$(date)] ✅ Sauvegarde compressée: \${BACKUP_FILE}.gz\"
    
    # Suppression des sauvegardes anciennes (garder 7 jours)
    find \"\${BACKUP_DIR}\" -name \"luneo_production_*.sql.gz\" -mtime +7 -delete
    echo \"[$(date)] ✅ Nettoyage des anciennes sauvegardes terminé\"
    
    # Statistiques
    BACKUP_SIZE=\$(du -h \"\${BACKUP_PATH}.gz\" | cut -f1)
    echo \"[$(date)] 📊 Taille de la sauvegarde: \${BACKUP_SIZE}\"
    
else
    echo \"[$(date)] ❌ Erreur lors de la sauvegarde\"
    exit 1
fi

echo \"[$(date)] 🎉 Sauvegarde terminée avec succès\"
BACKUP_EOF"

# 3. Rendre le script exécutable
ssh root@116.203.31.129 "cd /home/deploy/app && chmod +x backup-database.sh"

# 4. Test de la sauvegarde
echo "🧪 Test de la sauvegarde..."
ssh root@116.203.31.129 "cd /home/deploy/app && ./backup-database.sh"

# 5. Configuration d'un cron job pour les sauvegardes automatiques (tous les jours à 2h du matin)
echo "⏰ Configuration des sauvegardes automatiques..."
ssh root@116.203.31.129 "echo '0 2 * * * cd /home/deploy/app && ./backup-database.sh >> logs/backup.log 2>&1' | crontab -"

# 6. Création d'un script de restauration
echo "🔄 Création du script de restauration..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > restore-database.sh << 'RESTORE_EOF'
#!/bin/bash
BACKUP_DIR=\"/home/deploy/app/backups\"

if [ \$# -eq 0 ]; then
    echo \"Usage: \$0 <backup_file>\"
    echo \"Sauvegardes disponibles:\"
    ls -la \"\${BACKUP_DIR}\"/luneo_production_*.sql.gz 2>/dev/null || echo \"Aucune sauvegarde trouvée\"
    exit 1
fi

BACKUP_FILE=\"\$1\"
BACKUP_PATH=\"\${BACKUP_DIR}/\${BACKUP_FILE}\"

if [ ! -f \"\${BACKUP_PATH}\" ]; then
    echo \"❌ Fichier de sauvegarde non trouvé: \${BACKUP_FILE}\"
    exit 1
fi

echo \"[$(date)] 🔄 Début de la restauration de la base de données...\"
echo \"[$(date)] 📁 Fichier: \${BACKUP_FILE}\"

# Décompression et restauration
gunzip -c \"\${BACKUP_PATH}\" | docker exec -i luneo_postgres_prod psql -U luneo_user -d luneo_production

if [ \$? -eq 0 ]; then
    echo \"[$(date)] ✅ Restauration réussie\"
else
    echo \"[$(date)] ❌ Erreur lors de la restauration\"
    exit 1
fi

echo \"[$(date)] 🎉 Restauration terminée avec succès\"
RESTORE_EOF"

# 7. Rendre le script de restauration exécutable
ssh root@116.203.31.129 "cd /home/deploy/app && chmod +x restore-database.sh"

echo "✅ Sauvegardes configurées avec succès !"
echo "📋 Commandes utiles :"
echo "  - Sauvegarde manuelle : ssh root@116.203.31.129 'cd /home/deploy/app && ./backup-database.sh'"
echo "  - Liste des sauvegardes : ssh root@116.203.31.129 'ls -la /home/deploy/app/backups/'"
echo "  - Restauration : ssh root@116.203.31.129 'cd /home/deploy/app && ./restore-database.sh <fichier_backup>'"
echo "  - Logs de sauvegarde : ssh root@116.203.31.129 'tail -f /home/deploy/app/logs/backup.log'"
