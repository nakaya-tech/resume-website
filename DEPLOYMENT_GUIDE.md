# 部署安全指南

## 部署到云服务器的步骤

### 1. 准备环境
```bash
# 在云服务器上
cd /path/to/project
npm install
```

### 2. 配置环境变量
```bash
# 复制模板文件
cp .env.example .env

# 编辑 .env 文件，填入真实的 API 密钥
nano .env
```

### 3. 启动服务
```bash
npm start
# 或使用 PM2 等进程管理器
npm install -g pm2
pm2 start server.js --name resume-site
```

### 4. 配置防火墙
确保只开放必要的端口（如 80, 443, 3000）

## 安全建议

1. **永远不要将 .env 文件提交到 Git**
2. **使用强密码作为管理员密码**
3. **考虑使用 HTTPS**
4. **定期备份数据文件（moments.json, messages.json）**
5. **限制 API 访问频率**

## 生产环境建议

- 使用反向代理（Nginx）
- 配置 HTTPS（Let's Encrypt）
- 使用进程管理器（PM2）
- 设置日志轮转
