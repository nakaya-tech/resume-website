const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const path = require('path');
const fs = require('fs');

const { initDatabase, getMoments, addMoment, toggleMomentLike, deleteMoment, getMessages, addMessage, toggleMessageLike, deleteMessage } = require('./database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://localhost:3443'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/moments', (req, res) => {
    const moments = getMoments();
    res.json(moments);
});

app.post('/api/moments', (req, res) => {
    const { content, image } = req.body;
    if (!content) {
        return res.status(400).json({ success: false, message: '内容不能为空' });
    }
    const newMoment = addMoment(content, image);
    res.json({ success: true, moment: newMoment });
});

app.put('/api/moments/:id/like', (req, res) => {
    const id = parseInt(req.params.id);
    const moment = toggleMomentLike(id);
    if (moment) {
        res.json({ success: true, moment });
    } else {
        res.status(404).json({ success: false, message: '瞬间不存在' });
    }
});

app.delete('/api/moments/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (deleteMoment(id)) {
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: '瞬间不存在' });
    }
});

app.post('/api/doubao', async (req, res) => {
    try {
        const { messages, temperature = 0.7 } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: '参数错误', message: 'messages必须是数组' });
        }
        
        const postData = JSON.stringify({
            model: process.env.ENDPOINT_ID,
            messages: messages,
            temperature: temperature
        });
        
        const options = {
            hostname: 'ark.cn-beijing.volces.com',
            path: '/api/v3/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const request = https.request(options, (apiRes) => {
            let data = '';
            
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            
            apiRes.on('end', () => {
                try {
                    if (apiRes.statusCode !== 200) {
                        res.status(apiRes.statusCode).json({ error: 'API请求失败' });
                        return;
                    }
                    const response = JSON.parse(data);
                    res.json(response);
                } catch (error) {
                    console.error('解析响应失败:', error);
                    res.status(500).json({ error: '解析响应失败' });
                }
            });
        });
        
        request.on('error', (error) => {
            console.error('请求豆包API失败:', error.message);
            res.status(500).json({ error: '请求豆包API失败', details: error.message });
        });
        
        request.write(postData);
        request.end();
        
    } catch (error) {
        console.error('服务器错误:', error.message);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

app.get('/api/messages', (req, res) => {
    const messages = getMessages();
    res.json(messages);
});

app.post('/api/messages', (req, res) => {
    const { name, content, email } = req.body;
    
    if (!name || !content) {
        return res.status(400).json({ success: false, message: '姓名和留言内容不能为空' });
    }
    
    if (name.length > 50) {
        return res.status(400).json({ success: false, message: '姓名长度不能超过50个字符' });
    }
    
    if (content.length > 500) {
        return res.status(400).json({ success: false, message: '留言内容不能超过500个字符' });
    }
    
    if (email && email.length > 100) {
        return res.status(400).json({ success: false, message: '邮箱长度不能超过100个字符' });
    }
    
    const newMessage = addMessage(name.trim(), content.trim(), email ? email.trim() : null);
    res.json({ success: true, message: newMessage });
});

app.put('/api/messages/:id/like', (req, res) => {
    const id = parseInt(req.params.id);
    const message = toggleMessageLike(id);
    if (message) {
        res.json({ success: true, message });
    } else {
        res.status(404).json({ success: false, message: '留言不存在' });
    }
});

app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'default_admin_password_change_this';
    if (password === adminPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: '密码错误' });
    }
});

app.delete('/api/messages/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (deleteMessage(id)) {
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: '留言不存在' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '服务器运行正常' });
});

app.use(express.static(path.join(__dirname, '.'), {
    dotfiles: 'deny',
    index: ['index.html', 'space.html']
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const httpsOptions = {
    key: fs.existsSync(path.join(__dirname, 'server.key')) ? fs.readFileSync(path.join(__dirname, 'server.key')) : null,
    cert: fs.existsSync(path.join(__dirname, 'server.crt')) ? fs.readFileSync(path.join(__dirname, 'server.crt')) : null
};

const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

async function startServer() {
    await initDatabase();
    console.log('数据库初始化完成');
    
    if (httpsOptions.key && httpsOptions.cert) {
        https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
            console.log(`HTTPS服务器运行在 https://localhost:${HTTPS_PORT}`);
            console.log(`健康检查: https://localhost:${HTTPS_PORT}/health`);
            console.log(`API端点: https://localhost:${HTTPS_PORT}/api/doubao`);
        });
    }
    
    app.listen(PORT, () => {
        console.log(`HTTP服务器运行在 http://localhost:${PORT}`);
        console.log(`健康检查: http://localhost:${PORT}/health`);
        console.log(`API端点: http://localhost:${PORT}/api/doubao`);
    });
}

startServer();