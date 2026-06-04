const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 安全的 CORS 配置
app.use(cors({
    origin: true, // 允许任何来源，但仅在开发环境使用
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const MOMENTS_FILE = path.join(__dirname, 'moments.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

function loadMoments() {
    try {
        if (fs.existsSync(MOMENTS_FILE)) {
            const data = fs.readFileSync(MOMENTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('加载瞬间数据失败:', error);
    }
    return [];
}

function saveMoments(moments) {
    try {
        fs.writeFileSync(MOMENTS_FILE, JSON.stringify(moments, null, 2));
        return true;
    } catch (error) {
        console.error('保存瞬间数据失败:', error);
        return false;
    }
}

function loadMessages() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('加载留言数据失败:', error);
    }
    return [];
}

function saveMessages(messages) {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
        return true;
    } catch (error) {
        console.error('保存留言数据失败:', error);
        return false;
    }
}

app.get('/api/moments', (req, res) => {
    const moments = loadMoments();
    res.json(moments);
});

app.post('/api/moments', (req, res) => {
    const moments = loadMoments();
    const newMoment = {
        id: Date.now(),
        ...req.body,
        time: new Date().toLocaleString('zh-CN'),
        likes: 0,
        liked: false
    };
    moments.unshift(newMoment);
    if (saveMoments(moments)) {
        res.json({ success: true, moment: newMoment });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

app.put('/api/moments/:id/like', (req, res) => {
    const moments = loadMoments();
    const moment = moments.find(m => m.id === parseInt(req.params.id));
    if (moment) {
        moment.liked = !moment.liked;
        moment.likes += moment.liked ? 1 : -1;
        if (saveMoments(moments)) {
            res.json({ success: true, moment });
        } else {
            res.status(500).json({ success: false, message: '保存失败' });
        }
    } else {
        res.status(404).json({ success: false, message: '瞬间不存在' });
    }
});

app.delete('/api/moments/:id', (req, res) => {
    let moments = loadMoments();
    const initialLength = moments.length;
    moments = moments.filter(m => m.id !== parseInt(req.params.id));
    if (moments.length < initialLength) {
        if (saveMoments(moments)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: '删除失败' });
        }
    } else {
        res.status(404).json({ success: false, message: '瞬间不存在' });
    }
});

app.post('/api/doubao', async (req, res) => {
    console.log('收到请求:', req.body);
    try {
        const { messages, temperature = 0.7 } = req.body;
        
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
        
        console.log('请求豆包API:', {
            hostname: options.hostname,
            path: options.path,
            model: process.env.ENDPOINT_ID
        });
        
        const request = https.request(options, (apiRes) => {
            let data = '';
            
            console.log('豆包API响应状态码:', apiRes.statusCode);
            
            apiRes.on('data', (chunk) => {
                data += chunk;
            });
            
            apiRes.on('end', () => {
                console.log('豆包API完整响应:', data);
                try {
                    if (apiRes.statusCode !== 200) {
                        res.status(apiRes.statusCode).json({ error: 'API请求失败', details: data });
                        return;
                    }
                    const response = JSON.parse(data);
                    res.json(response);
                } catch (error) {
                    console.error('解析响应失败:', error);
                    res.status(500).json({ error: '解析响应失败', details: data });
                }
            });
        });
        
        request.on('error', (error) => {
            console.error('请求豆包API失败:', error);
            res.status(500).json({ error: '请求豆包API失败', details: error.message });
        });
        
        request.write(postData);
        request.end();
        
    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({ error: '服务器内部错误', details: error.message });
    }
});

app.get('/api/messages', (req, res) => {
    const messages = loadMessages();
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
    
    const messages = loadMessages();
    const newMessage = {
        id: Date.now(),
        name: name.trim(),
        email: email ? email.trim() : null,
        content: content.trim(),
        time: new Date().toLocaleString('zh-CN'),
        likes: 0,
        liked: false
    };
    
    messages.unshift(newMessage);
    
    if (saveMessages(messages)) {
        res.json({ success: true, message: newMessage });
    } else {
        res.status(500).json({ success: false, message: '保存失败' });
    }
});

app.put('/api/messages/:id/like', (req, res) => {
    const messages = loadMessages();
    const message = messages.find(m => m.id === parseInt(req.params.id));
    
    if (message) {
        message.liked = !message.liked;
        message.likes += message.liked ? 1 : -1;
        
        if (saveMessages(messages)) {
            res.json({ success: true, message });
        } else {
            res.status(500).json({ success: false, message: '保存失败' });
        }
    } else {
        res.status(404).json({ success: false, message: '留言不存在' });
    }
});

app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    if (password === 'admin123') {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.delete('/api/messages/:id', (req, res) => {
    let messages = loadMessages();
    const initialLength = messages.length;
    messages = messages.filter(m => m.id !== parseInt(req.params.id));
    
    if (messages.length < initialLength) {
        if (saveMessages(messages)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ success: false, message: '删除失败' });
        }
    } else {
        res.status(404).json({ success: false, message: '留言不存在' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '服务器运行正常' });
});

// 只提供公开的静态文件，避免暴露敏感文件
app.use(express.static(path.join(__dirname, '.'), {
    dotfiles: 'deny', // 拒绝访问以点开头的文件
    index: ['index.html', 'space.html'] // 默认文件
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`API端点: http://localhost:${PORT}/api/doubao`);
});