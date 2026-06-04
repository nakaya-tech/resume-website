const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;

async function initDatabase() {
    if (db) return db;
    
    const SQL = await initSqlJs({
        locateFile: file => `node_modules/sql.js/dist/${file}`
    });
    
    const dbPath = path.join(__dirname, 'data.db');
    
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath);
        db = new SQL.Database(data);
    } else {
        db = new SQL.Database();
        initTables();
        saveDatabase();
    }
    
    return db;
}

function initTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS moments (
            id INTEGER PRIMARY KEY,
            content TEXT NOT NULL,
            image TEXT,
            time TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            liked INTEGER DEFAULT 0
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            content TEXT NOT NULL,
            time TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            liked INTEGER DEFAULT 0
        )
    `);
}

function saveDatabase() {
    try {
        const data = db.export();
        const dbPath = path.join(__dirname, 'data.db');
        fs.writeFileSync(dbPath, Buffer.from(data));
    } catch (error) {
        console.error('保存数据库失败:', error);
    }
}

// Moments CRUD
function getMoments() {
    const result = db.exec('SELECT * FROM moments ORDER BY id DESC');
    return result[0] ? result[0].values.map(row => ({
        id: row[0],
        content: row[1],
        image: row[2],
        time: row[3],
        likes: row[4],
        liked: row[5] === 1
    })) : [];
}

function addMoment(content, image) {
    const id = Date.now();
    const time = new Date().toLocaleString('zh-CN');
    db.run(
        'INSERT INTO moments (id, content, image, time, likes, liked) VALUES (?, ?, ?, ?, ?, ?)',
        [id, content, image || null, time, 0, 0]
    );
    saveDatabase();
    return { id, content, image, time, likes: 0, liked: false };
}

function toggleMomentLike(id) {
    const result = db.exec('SELECT liked FROM moments WHERE id = ?', [id]);
    if (!result[0] || !result[0].values.length) return null;
    
    const currentLiked = result[0].values[0][0];
    const newLiked = currentLiked === 1 ? 0 : 1;
    const newLikes = currentLiked === 1 ? -1 : 1;
    
    db.run(
        'UPDATE moments SET liked = ?, likes = likes + ? WHERE id = ?',
        [newLiked, newLikes, id]
    );
    saveDatabase();
    
    const updated = db.exec('SELECT * FROM moments WHERE id = ?', [id]);
    if (updated[0] && updated[0].values.length) {
        const row = updated[0].values[0];
        return {
            id: row[0],
            content: row[1],
            image: row[2],
            time: row[3],
            likes: row[4],
            liked: row[5] === 1
        };
    }
    return null;
}

function deleteMoment(id) {
    const result = db.exec('SELECT * FROM moments WHERE id = ?', [id]);
    if (!result[0] || !result[0].values.length) return false;
    
    db.run('DELETE FROM moments WHERE id = ?', [id]);
    saveDatabase();
    return true;
}

// Messages CRUD
function getMessages() {
    const result = db.exec('SELECT * FROM messages ORDER BY id DESC');
    return result[0] ? result[0].values.map(row => ({
        id: row[0],
        name: row[1],
        email: row[2],
        content: row[3],
        time: row[4],
        likes: row[5],
        liked: row[6] === 1
    })) : [];
}

function addMessage(name, content, email) {
    const id = Date.now();
    const time = new Date().toLocaleString('zh-CN');
    db.run(
        'INSERT INTO messages (id, name, email, content, time, likes, liked) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, email || null, content, time, 0, 0]
    );
    saveDatabase();
    return { id, name, email, content, time, likes: 0, liked: false };
}

function toggleMessageLike(id) {
    const result = db.exec('SELECT liked FROM messages WHERE id = ?', [id]);
    if (!result[0] || !result[0].values.length) return null;
    
    const currentLiked = result[0].values[0][0];
    const newLiked = currentLiked === 1 ? 0 : 1;
    const newLikes = currentLiked === 1 ? -1 : 1;
    
    db.run(
        'UPDATE messages SET liked = ?, likes = likes + ? WHERE id = ?',
        [newLiked, newLikes, id]
    );
    saveDatabase();
    
    const updated = db.exec('SELECT * FROM messages WHERE id = ?', [id]);
    if (updated[0] && updated[0].values.length) {
        const row = updated[0].values[0];
        return {
            id: row[0],
            name: row[1],
            email: row[2],
            content: row[3],
            time: row[4],
            likes: row[5],
            liked: row[6] === 1
        };
    }
    return null;
}

function deleteMessage(id) {
    const result = db.exec('SELECT * FROM messages WHERE id = ?', [id]);
    if (!result[0] || !result[0].values.length) return false;
    
    db.run('DELETE FROM messages WHERE id = ?', [id]);
    saveDatabase();
    return true;
}

module.exports = {
    initDatabase,
    getMoments,
    addMoment,
    toggleMomentLike,
    deleteMoment,
    getMessages,
    addMessage,
    toggleMessageLike,
    deleteMessage
};