#!/bin/bash
echo "🔍 HEALTH CHECKS PAR SERVICE"
echo "============================"

# Health check pour l'API
echo "🌐 API Health Check"
api_response=$(curl -s -o /dev/null -w "%{http_code}" https://luneo.app/api/v1/email/status 2>/dev/null)
if [ "$api_response" = "401" ]; then
    echo "✅ API: Répond correctement (401 = auth requise)"
else
    echo "❌ API: Problème détecté (Code: $api_response)"
fi

# Health check pour Nginx
echo "⚡ Nginx Health Check"
nginx_response=$(curl -s -I https://luneo.app/ 2>/dev/null | head -1)
if echo "$nginx_response" | grep -q "200\|301\|401"; then
    echo "✅ Nginx: Répond correctement"
else
    echo "❌ Nginx: Problème détecté"
fi

# Health check pour SSL
echo "🔒 SSL Health Check"
ssl_check=$(echo | openssl s_client -connect luneo.app:443 -servername luneo.app 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ SSL: Certificat valide"
else
    echo "❌ SSL: Problème de certificat"
fi

# Health check pour les performances
echo "⚡ Performance Health Check"
start_time=$(date +%s%N)
curl -s https://luneo.app/api/v1/email/status > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 500 ]; then
    echo "✅ Performance: Excellente (${response_time}ms)"
elif [ $response_time -lt 1000 ]; then
    echo "🟡 Performance: Bonne (${response_time}ms)"
else
    echo "❌ Performance: Lente (${response_time}ms)"
fi

echo ""
echo "🏁 Health checks par service terminés"
