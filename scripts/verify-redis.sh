#!/bin/bash

# Script pour vérifier la connexion Redis pour BullMQ
# Usage: ./scripts/verify-redis.sh [REDIS_URL]

set -e

REDIS_URL=${1:-"redis://localhost:6379"}

echo "🔍 Vérification Redis pour BullMQ"
echo "=================================="
echo ""
echo "Redis URL: $REDIS_URL"
echo ""

# Vérifier si redis-cli est disponible
if command -v redis-cli &> /dev/null; then
    echo "✅ redis-cli disponible"
    echo ""
    
    # Extraire host et port de l'URL
    if [[ "$REDIS_URL" == redis://* ]] || [[ "$REDIS_URL" == rediss://* ]]; then
        # Format: redis://user:pass@host:port
        HOST_PORT=$(echo "$REDIS_URL" | sed 's|redis://||' | sed 's|rediss://||' | sed 's|.*@||' | cut -d'/' -f1)
        HOST=$(echo "$HOST_PORT" | cut -d':' -f1)
        PORT=$(echo "$HOST_PORT" | cut -d':' -f2)
        
        # Extraire password si présent
        if [[ "$REDIS_URL" == *"@"* ]]; then
            PASSWORD=$(echo "$REDIS_URL" | sed 's|redis://||' | sed 's|rediss://||' | sed 's|@.*||' | cut -d':' -f2)
        fi
    else
        HOST=$(echo "$REDIS_URL" | cut -d':' -f1)
        PORT=$(echo "$REDIS_URL" | cut -d':' -f2)
    fi
    
    HOST=${HOST:-localhost}
    PORT=${PORT:-6379}
    
    echo "📡 Connexion à Redis ($HOST:$PORT)..."
    
    # Tester la connexion
    if [ -n "$PASSWORD" ]; then
        REDIS_CMD="redis-cli -h $HOST -p $PORT -a $PASSWORD"
    else
        REDIS_CMD="redis-cli -h $HOST -p $PORT"
    fi
    
    if $REDIS_CMD ping 2>&1 | grep -q "PONG"; then
        echo "✅ Connexion Redis réussie"
        echo ""
        
        # Vérifier les informations
        echo "📊 Informations Redis:"
        $REDIS_CMD info server 2>&1 | grep -E "(redis_version|os|uptime_in_seconds)" | head -5
        echo ""
        
        # Vérifier les queues BullMQ
        echo "📋 Queues BullMQ:"
        QUEUES=$($REDIS_CMD keys "bull:*" 2>&1 | head -10)
        if [ -n "$QUEUES" ]; then
            echo "$QUEUES"
        else
            echo "   Aucune queue trouvée (normal si pas encore utilisé)"
        fi
        echo ""
        
        # Test de performance
        echo "⚡ Test de performance:"
        START=$(date +%s%N)
        $REDIS_CMD ping > /dev/null 2>&1
        END=$(date +%s%N)
        DURATION=$((($END - $START) / 1000000))
        echo "   Latence: ${DURATION}ms"
        echo ""
        
        echo "✅ Redis est opérationnel pour BullMQ"
    else
        echo "❌ Impossible de se connecter à Redis"
        echo "   Vérifiez:"
        echo "   - Redis est démarré"
        echo "   - Host et port corrects"
        echo "   - Firewall/security groups"
        exit 1
    fi
else
    echo "⚠️  redis-cli non disponible"
    echo "   Test de connexion avec Node.js..."
    
    # Test avec Node.js
    node << EOF
const redis = require('ioredis');
const url = process.argv[2] || '$REDIS_URL';

const client = new redis(url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

client.connect()
  .then(() => {
    console.log('✅ Connexion Redis réussie');
    return client.ping();
  })
  .then((result) => {
    console.log('✅ Ping:', result);
    return client.info('server');
  })
  .then((info) => {
    const version = info.match(/redis_version:(.+)/)?.[1];
    console.log('📊 Redis version:', version || 'unknown');
    return client.quit();
  })
  .then(() => {
    console.log('✅ Redis est opérationnel pour BullMQ');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur Redis:', error.message);
    process.exit(1);
  });
EOF
fi

echo ""
echo "✅ Vérification Redis terminée"

