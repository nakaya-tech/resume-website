const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());

// 豆包API代理路由
app.post('/api/doubao', async (req, res) => {
    console.log('收到请求:', req.body);
    try {
        const { messages, temperature = 0.7 } = req.body;
        
        // 构建豆包API请求
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
        
        // 发送请求到豆包API
        const request = https.request(options, (apiRes) => {
            let data = '';
            
            console.log('豆包API响应状态码:', apiRes.statusCode);
            console.log('豆包API响应头:', apiRes.headers);
            
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

// 健康检查接口
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '豆包代理服务器运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`豆包代理服务器运行在 http://localhost:${PORT}`);
    console.log(`健康检查: http://localhost:${PORT}/health`);
    console.log(`API端点: http://localhost:${PORT}/api/doubao`);
});
