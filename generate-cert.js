const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

async function generateCertificate() {
    const pems = await selfsigned.generate([], {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256',
        name: 'localhost'
    });

    fs.writeFileSync(path.join(__dirname, 'server.key'), pems.private);
    fs.writeFileSync(path.join(__dirname, 'server.crt'), pems.cert);

    console.log('SSL证书生成成功！');
    console.log(' - server.key 已创建');
    console.log(' - server.crt 已创建');
    console.log('证书有效期：365天');
    console.log('证书域名：localhost');
}

generateCertificate().catch(err => {
    console.error('证书生成失败:', err);
    process.exit(1);
});
