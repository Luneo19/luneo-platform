#!/bin/bash
echo "🔒 Configuration du firewall pour sécuriser le serveur Luneo..."

# 1. Installation et activation d'UFW
echo "📦 Installation d'UFW (Uncomplicated Firewall)..."
ssh root@116.203.31.129 "apt update && apt install -y ufw"

# 2. Configuration des règles de base
echo "🔧 Configuration des règles de firewall..."
ssh root@116.203.31.129 << 'FIREWALL_EOF'
# Reset des règles existantes
ufw --force reset

# Politique par défaut
ufw default deny incoming
ufw default allow outgoing

# Autoriser SSH (port 22)
ufw allow 22/tcp comment 'SSH'

# Autoriser HTTP et HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Autoriser le port backend en local seulement (optionnel)
ufw allow from 127.0.0.1 to any port 3000 comment 'Backend local'

# Limiter les tentatives de connexion SSH
ufw limit ssh

# Activer le firewall
ufw --force enable

# Afficher le statut
echo "📊 Statut du firewall:"
ufw status verbose
FIREWALL_EOF

# 3. Installation de Fail2ban pour la protection contre les attaques par force brute
echo "🛡️ Installation de Fail2ban..."
ssh root@116.203.31.129 "apt install -y fail2ban"

# 4. Configuration de Fail2ban
echo "⚙️ Configuration de Fail2ban..."
ssh root@116.203.31.129 "cd /etc/fail2ban && cat > jail.local << 'FAIL2BAN_EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
FAIL2BAN_EOF"

# 5. Redémarrage de Fail2ban
ssh root@116.203.31.129 "systemctl restart fail2ban && systemctl enable fail2ban"

# 6. Configuration des logs de sécurité
echo "📝 Configuration des logs de sécurité..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > security-monitor.sh << 'SECURITY_EOF'
#!/bin/bash
echo \"=== MONITORING SÉCURITÉ - $(date) ===\"

echo \"🔒 STATUT FIREWALL:\"
ufw status verbose
echo \"\"

echo \"🛡️ STATUT FAIL2BAN:\"
fail2ban-client status
echo \"\"

echo \"📊 CONNEXIONS ACTIVES:\"
netstat -tuln | grep -E ':(80|443|22|3000)'
echo \"\"

echo \"🚨 TENTATIVES DE CONNEXION RÉCENTES:\"
tail -20 /var/log/auth.log | grep -E '(Failed|Invalid|Disconnected)'
echo \"\"

echo \"📈 STATISTIQUES NGINX:\"
tail -10 /var/log/nginx/access.log | awk '{print \$1, \$7, \$9}' | sort | uniq -c | sort -nr
echo \"\"

echo \"=== FIN DU MONITORING SÉCURITÉ ===\"
SECURITY_EOF"

# 7. Rendre le script exécutable
ssh root@116.203.31.129 "cd /home/deploy/app && chmod +x security-monitor.sh"

# 8. Ajouter le monitoring de sécurité au cron
ssh root@116.203.31.129 "echo '*/10 * * * * cd /home/deploy/app && ./security-monitor.sh >> logs/security.log 2>&1' | crontab -"

echo "✅ Firewall et sécurité configurés avec succès !"
echo "📋 Commandes utiles :"
echo "  - Statut firewall : ssh root@116.203.31.129 'ufw status verbose'"
echo "  - Statut Fail2ban : ssh root@116.203.31.129 'fail2ban-client status'"
echo "  - Monitoring sécurité : ssh root@116.203.31.129 'cd /home/deploy/app && ./security-monitor.sh'"
echo "  - Logs de sécurité : ssh root@116.203.31.129 'tail -f /home/deploy/app/logs/security.log'"
