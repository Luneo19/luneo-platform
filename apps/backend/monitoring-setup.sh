#!/bin/bash
echo "🔍 Configuration du monitoring avancé pour Luneo..."

# 1. Installation de htop et iotop pour le monitoring système
echo "📦 Installation des outils de monitoring..."
ssh root@116.203.31.129 "apt update && apt install -y htop iotop nethogs"

# 2. Configuration des logs Docker
echo "📝 Configuration des logs Docker..."
ssh root@116.203.31.129 "cd /home/deploy/app && mkdir -p logs"

# 3. Création d'un script de monitoring des services
echo "🔧 Création du script de monitoring..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > monitor-services.sh << 'MONITOR_EOF'
#!/bin/bash
echo \"=== MONITORING LUNEO SERVICES - \$(date) ===\"
echo \"\"

echo \"📊 STATUT DES CONTENEURS:\"
docker-compose -f docker-compose.production.yml ps
echo \"\"

echo \"💾 UTILISATION DISQUE:\"
df -h
echo \"\"

echo \"🧠 UTILISATION MÉMOIRE:\"
free -h
echo \"\"

echo \"⚡ CHARGE SYSTÈME:\"
uptime
echo \"\"

echo \"🌐 CONNECTIONS RÉSEAU:\"
netstat -tlnp | grep -E ':(80|443|3000|5432|6379)'
echo \"\"

echo \"📈 PERFORMANCE API:\"
curl -w \"Time: %{time_total}s | Status: %{http_code}\" -o /dev/null -s https://luneo.app/api/v1/email/status
echo \"\"

echo \"🗄️ STATUT BASE DE DONNÉES:\"
docker exec luneo_postgres_prod psql -U luneo_user -d luneo_production -c \"SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';\"
echo \"\"

echo \"🔴 STATUT REDIS:\"
docker exec luneo_redis_prod redis-cli ping
echo \"\"

echo \"=== FIN DU MONITORING ===\"
MONITOR_EOF"

# 4. Rendre le script exécutable
ssh root@116.203.31.129 "cd /home/deploy/app && chmod +x monitor-services.sh"

# 5. Configuration d'un cron job pour le monitoring automatique
echo "⏰ Configuration du monitoring automatique..."
ssh root@116.203.31.129 "echo '*/5 * * * * cd /home/deploy/app && ./monitor-services.sh >> logs/monitoring.log 2>&1' | crontab -"

echo "✅ Monitoring configuré avec succès !"
echo "📋 Commandes utiles :"
echo "  - Monitoring manuel : ssh root@116.203.31.129 'cd /home/deploy/app && ./monitor-services.sh'"
echo "  - Logs de monitoring : ssh root@116.203.31.129 'tail -f /home/deploy/app/logs/monitoring.log'"
echo "  - Monitoring système : ssh root@116.203.31.129 'htop'"
