#!/bin/bash

echo "🔧 Setting up Nginx reverse proxy for willworkforlunch.com"

# Install Nginx
echo "Installing Nginx..."
apt update
apt install -y nginx

# Create SSL directories
echo "Creating SSL directories..."
mkdir -p /etc/ssl/certs
mkdir -p /etc/ssl/private

# Create Nginx configuration
echo "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/willworkforlunch.com << 'EOF'
server {
    listen 80;
    server_name willworkforlunch.com www.willworkforlunch.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name willworkforlunch.com www.willworkforlunch.com;

    # SSL Configuration (Cloudflare Origin Certificate)
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3006;
    }
}
EOF

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Enable new site
ln -s /etc/nginx/sites-available/willworkforlunch.com /etc/nginx/sites-enabled/

# Test configuration
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    
    # Start and enable Nginx
    systemctl enable nginx
    systemctl start nginx
    
    echo "📝 Next steps:"
    echo "1. Get Cloudflare Origin Certificate"
    echo "2. Save certificate to: /etc/ssl/certs/cloudflare-origin.pem"
    echo "3. Save private key to: /etc/ssl/private/cloudflare-origin.key"
    echo "4. Set permissions: chmod 644 /etc/ssl/certs/cloudflare-origin.pem"
    echo "5. Set permissions: chmod 600 /etc/ssl/private/cloudflare-origin.key"
    echo "6. Restart Nginx: systemctl restart nginx"
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

echo "🎉 Nginx setup completed!" 