#!/bin/bash

# Sugar App Deployment Script
# 이 스크립트는 sugar_app/ 폴더 안에서 실행하여 sugar.app.koreanok.com 으로 배포합니다.
# 실행: ./deploy.sh

set -e

# ----- Config -----
SSH_ALIAS="jamss"
REMOTE_PATH="/var/www/sugar-app"
NGINX_CONF="/etc/nginx/sites-available/sugar-app"
NGINX_LINK="/etc/nginx/sites-enabled/sugar-app"
DOMAIN="sugar.app.koreanok.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/sugar_react"
BACKEND_DIR="$SCRIPT_DIR/backend"
# ------------------

echo "========================================="
echo "Deploying Sugar App to $DOMAIN"
echo "Script location: $SCRIPT_DIR"
echo "========================================="

# 1. React 프론트엔드 빌드
echo "[1/5] Building React frontend..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd "$FRONTEND_DIR"
npm run build
cd "$SCRIPT_DIR"
echo "✅ Build complete."

# 2. 서버 디렉토리 생성 및 권한 설정
echo "[2/5] Preparing remote directory..."
ssh $SSH_ALIAS "sudo mkdir -p $REMOTE_PATH && sudo chown -R \$USER:\$USER $REMOTE_PATH"

# 3. 빌드된 파일 및 백엔드 업로드
echo "[3/5] Uploading frontend (dist/) and backend..."
rsync -avz --delete --progress --exclude 'backend' "$FRONTEND_DIR/dist/" $SSH_ALIAS:$REMOTE_PATH/
rsync -avz --delete --progress \
  --exclude 'node_modules' \
  --exclude '*.db' \
  --exclude '*.sqlite' \
  --exclude 'database.sqlite' \
  "$BACKEND_DIR/" $SSH_ALIAS:$REMOTE_PATH/backend/

# 3.1 백엔드 의존성 설치
echo "[3.1] Installing backend dependencies..."
ssh $SSH_ALIAS "cd $REMOTE_PATH/backend && npm install --production"

# 4. Nginx 설정
echo "[4/5] Configuring Nginx..."
NGINX_CONTENT=$(cat <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location = /index.html {
        root $REMOTE_PATH;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        add_header Pragma "no-cache";
        expires off;
    }

    location / {
        root $REMOTE_PATH;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
)

ssh $SSH_ALIAS "sudo tee $NGINX_CONF > /dev/null" <<EOF
$NGINX_CONTENT
EOF

ssh $SSH_ALIAS "sudo ln -sf $NGINX_CONF $NGINX_LINK
sudo nginx -t && sudo systemctl reload nginx"

# 4.1 PM2로 백엔드 재시작
echo "[4.1] Restarting backend with PM2..."
ssh $SSH_ALIAS "cd $REMOTE_PATH/backend && pm2 delete sugar-app-backend || true && pm2 start server.js --name sugar-app-backend"

# 5. SSL 설정 (Certbot)
echo "[5/5] Enabling HTTPS with Certbot..."
ssh $SSH_ALIAS << 'ENDSSH'
    if ! command -v certbot &> /dev/null; then
        echo "Certbot not found. Installing..."
        if command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y certbot python3-certbot-nginx
        fi
    fi
    sudo certbot --nginx -d sugar.app.koreanok.com --non-interactive --agree-tos -m admin@koreanok.com --redirect
ENDSSH

echo ""
echo "========================================="
echo "Deployment Successful!"
echo "URL: https://$DOMAIN"
echo "========================================="
