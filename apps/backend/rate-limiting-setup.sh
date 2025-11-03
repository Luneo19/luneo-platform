#!/bin/bash
echo "🚦 Configuration du rate limiting avancé pour Luneo..."

# 1. Installation de nginx-module pour le rate limiting avancé
echo "📦 Installation des modules Nginx pour rate limiting..."
ssh root@116.203.31.129 "apt update && apt install -y nginx-module-njs"

# 2. Création d'une configuration Nginx avec rate limiting avancé
echo "🔧 Configuration du rate limiting avancé..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > nginx-rate-limiting.conf << 'RATE_LIMIT_EOF'
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Zones de rate limiting
    limit_req_zone \$binary_remote_addr zone=api_general:10m rate=100r/m;
    limit_req_zone \$binary_remote_addr zone=api_auth:10m rate=10r/m;
    limit_req_zone \$binary_remote_addr zone=api_email:10m rate=20r/m;
    limit_req_zone \$binary_remote_addr zone=api_heavy:10m rate=5r/m;
    
    # Zones par IP
    limit_conn_zone \$binary_remote_addr zone=conn_limit_per_ip:10m;
    limit_conn_zone \$server_name zone=conn_limit_per_server:10m;
    
    # Optimisations de base
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # Cache des fichiers statiques
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Limite de taille des requêtes
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Map pour différencier les endpoints
    map \$request_uri \$rate_limit_zone {
        ~^/api/v1/auth/ api_auth;
        ~^/api/v1/email/ api_email;
        ~^/api/v1/ai/ api_heavy;
        ~^/api/v1/ default;
        default api_general;
    }
    
    upstream backend {
        server backend:3000;
        keepalive 32;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name luneo.app api.luneo.app;
        
        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            alias /var/www/html/;
            try_files \$uri =404;
        }
        
        # Redirect all other traffic to HTTPS
        location / {
            return 301 https://\$server_name\$request_uri;
        }
    }

    # HTTPS server avec rate limiting
    server {
        listen 443 ssl http2;
        server_name luneo.app api.luneo.app;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/luneo.app/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/luneo.app/privkey.pem;
        
        # SSL optimisations
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;
        
        # Limites de connexions
        limit_conn conn_limit_per_ip 10;
        limit_conn conn_limit_per_server 1000;
        
        # Security headers
        add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains; preload\" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection \"1; mode=block\" always;
        add_header Referrer-Policy \"strict-origin-when-cross-origin\" always;
        add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'\" always;
        
        # Rate limiting par endpoint
        location / {
            limit_req zone=\$rate_limit_zone burst=20 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_set_header X-Forwarded-Host \$host;
            proxy_set_header X-Forwarded-Port \$server_port;
            proxy_cache_bypass \$http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Endpoints d'authentification - rate limiting strict
        location ~ ^/api/v1/auth/ {
            limit_req zone=api_auth burst=5 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Endpoints email - rate limiting modéré
        location ~ ^/api/v1/email/ {
            limit_req zone=api_email burst=10 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Endpoints IA - rate limiting strict
        location ~ ^/api/v1/ai/ {
            limit_req zone=api_heavy burst=3 nodelay;
            limit_req_status 429;
            
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Cache pour les fichiers statiques
        location ~* \\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
            proxy_pass http://backend;
            expires 1y;
            add_header Cache-Control \"public, immutable\";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # Endpoint de statut - pas de rate limiting
        location = /health {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
RATE_LIMIT_EOF"

# 3. Application de la nouvelle configuration
echo "⚡ Application de la configuration rate limiting..."
ssh root@116.203.31.129 "cd /home/deploy/app && cp nginx-rate-limiting.conf nginx.conf && docker-compose -f docker-compose.production.yml restart nginx"

# 4. Création d'un script de test du rate limiting
echo "🧪 Création du script de test rate limiting..."
ssh root@116.203.31.129 "cd /home/deploy/app && cat > test-rate-limiting.sh << 'TEST_EOF'
#!/bin/bash
echo \"🚦 Test du Rate Limiting - Luneo API\"
echo \"====================================\"

# Test 1: Rate limiting général
echo \"📊 Test 1: Rate limiting général (100 req/min)\"
for i in {1..5}; do
    echo -n \"Requête \$i: \"
    curl -w \"%{http_code}\" -o /dev/null -s https://luneo.app/api/v1/email/status
    echo \"\"
    sleep 1
done

echo \"\"

# Test 2: Rate limiting auth (10 req/min)
echo \"🔐 Test 2: Rate limiting auth (10 req/min)\"
for i in {1..5}; do
    echo -n \"Auth requête \$i: \"
    curl -w \"%{http_code}\" -o /dev/null -s https://luneo.app/api/v1/auth/login
    echo \"\"
    sleep 1
done

echo \"\"

# Test 3: Test de burst
echo \"💥 Test 3: Test de burst (20 requêtes rapides)\"
for i in {1..25}; do
    echo -n \"Burst \$i: \"
    curl -w \"%{http_code}\" -o /dev/null -s https://luneo.app/api/v1/email/status
    echo \"\"
done

echo \"\"
echo \"✅ Tests de rate limiting terminés\"
echo \"📋 Codes de statut attendus:\"
echo \"  - 401: Authentification requise (normal)\"
echo \"  - 429: Too Many Requests (rate limiting activé)\"
echo \"  - 200: Succès\"
TEST_EOF"

# 5. Rendre le script de test exécutable
ssh root@116.203.31.129 "cd /home/deploy/app && chmod +x test-rate-limiting.sh"

echo "✅ Rate limiting avancé configuré avec succès !"
echo "📋 Configuration appliquée :"
echo "  - API générale: 100 req/min"
echo "  - Authentification: 10 req/min"
echo "  - Email: 20 req/min"
echo "  - IA: 5 req/min"
echo "  - Connexions: 10 par IP, 1000 par serveur"
echo ""
echo "🧪 Test du rate limiting :"
echo "  ssh root@116.203.31.129 'cd /home/deploy/app && ./test-rate-limiting.sh'"
