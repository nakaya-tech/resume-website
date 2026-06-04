#!/bin/bash
# HTTPS部署脚本 - 基于IP地址的HTTPS配置
# 使用自签名证书 + Nginx反向代理

SERVER_IP="116.62.48.72"
SERVER_USER="root"
SERVER_DIR="/root/resume"

echo "=========================================="
echo "开始配置HTTPS (IP地址模式)..."
echo "服务器: $SERVER_IP"
echo "=========================================="

echo "1. 更新系统并安装Nginx..."
ssh $SERVER_USER@$SERVER_IP "apt-get update && apt-get install -y nginx"

echo "2. 停止现有的PM2服务..."
ssh $SERVER_USER@$SERVER_IP "pm2 stop resume 2>/dev/null || true"

echo "3. 创建自签名SSL证书..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p /etc/nginx/ssl"
ssh $SERVER_USER@$SERVER_IP "openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj '/CN=$SERVER_IP' \
    -addext 'subjectAltName=IP:$SERVER_IP'"

echo "4. 备份当前Nginx配置..."
ssh $SERVER_USER@$SERVER_IP "cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup 2>/dev/null || true"

echo "5. 配置Nginx虚拟主机..."
ssh $SERVER_USER@$SERVER_IP "cat > /etc/nginx/sites-available/resume << 'EOF'
server {
    listen 80;
    server_name _;

    # 重定向HTTP到HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    # SSL配置
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 反向代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|mp3|glb)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF"

echo "6. 创建符号链接启用站点..."
ssh $SERVER_USER@$SERVER_IP "ln -sf /etc/nginx/sites-available/resume /etc/nginx/sites-enabled/resume"

echo "7. 删除默认配置..."
ssh $SERVER_USER@$SERVER_IP "rm -f /etc/nginx/sites-enabled/default"

echo "8. 测试Nginx配置..."
ssh $SERVER_USER@$SERVER_IP "nginx -t"

echo "9. 重启Nginx服务..."
ssh $SERVER_USER@$SERVER_IP "systemctl restart nginx"

echo "10. 启动PM2服务..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && pm2 start server.js --name resume"

echo "11. 配置防火墙..."
ssh $SERVER_USER@$SERVER_IP "ufw allow 'Nginx Full' && ufw reload"

echo "=========================================="
echo "HTTPS配置完成！"
echo "访问地址: https://$SERVER_IP"
echo "=========================================="
echo ""
echo "配置说明:"
echo "- HTTP端口80已重定向到HTTPS"
echo "- HTTPS端口443已启用"
echo "- 使用自签名证书（有效期10年）"
echo "- 静态文件已配置缓存"
echo "- WebSocket支持已启用"
echo ""
echo "注意: 由于使用自签名证书，浏览器会显示安全警告"
echo "可以在浏览器中添加信任或安装证书到系统"
