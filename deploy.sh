#!/bin/bash
# 部署脚本 - 用于将网站部署到云服务器

SERVER_IP="116.62.48.72"
SERVER_USER="root"
SERVER_DIR="/root/resume"

echo "=========================================="
echo "开始部署简历网站到服务器..."
echo "服务器: $SERVER_IP"
echo "目录: $SERVER_DIR"
echo "=========================================="

# 1. 创建远程目录
echo "1. 创建远程目录..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_DIR"

# 2. 上传文件
echo "2. 上传文件到服务器..."
scp -r \
  index.html \
  space.html \
  main.js \
  styles.css \
  server.js \
  package.json \
  package-lock.json \
  .env.example \
  3D_MODEL.glb \
  images/ \
  lib/ \
  music/ \
  $SERVER_USER@$SERVER_IP:$SERVER_DIR/

# 3. 创建 .env 文件
echo "3. 创建环境配置文件..."
ssh $SERVER_USER@$SERVER_IP "cp $SERVER_DIR/.env.example $SERVER_DIR/.env"

# 4. 安装依赖
echo "4. 安装 Node.js 依赖..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && npm install --production"

# 5. 安装 PM2 进程管理器
echo "5. 安装 PM2 进程管理器..."
ssh $SERVER_USER@$SERVER_IP "npm install -g pm2"

# 6. 启动服务
echo "6. 启动服务..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_DIR && pm2 start server.js --name resume"

# 7. 设置开机自启
echo "7. 设置开机自启..."
ssh $SERVER_USER@$SERVER_IP "pm2 startup"
ssh $SERVER_USER@$SERVER_IP "pm2 save"

echo "=========================================="
echo "部署完成！"
echo "访问地址: http://$SERVER_IP:3000"
echo "PM2 管理命令:"
echo "  pm2 list          # 查看进程"
echo "  pm2 logs resume   # 查看日志"
echo "  pm2 restart resume # 重启服务"
echo "=========================================="
