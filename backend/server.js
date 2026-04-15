const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3006;
const JWT_SECRET = 'sugar-logos-secret-key-2024';

app.use(cors());
app.use(express.json());

// Database Initialization
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Step 1: Always ensure base tables exist first
    db.run(`CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        user_type TEXT DEFAULT 'foreigner',
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        student_id TEXT,
        created_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        student_id TEXT,
        score INTEGER,
        ramen_type TEXT,
        user_type TEXT,
        created_at TEXT
    )`);

    // Step 2: Migration to composite PK (username, user_type) if needed
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err || !columns) return syncAdmin();
        const hasUserType = columns.some(c => c.name === 'user_type');
        const pkCount = columns.filter(c => c.pk > 0).length;

        if (!hasUserType || pkCount < 2) {
            console.log("Migration: Upgrading users table to composite PK...");
            db.serialize(() => {
                db.run("BEGIN TRANSACTION");
                db.run(`CREATE TABLE IF NOT EXISTS users_new (
                    username TEXT,
                    user_type TEXT,
                    password TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    student_id TEXT,
                    created_at TEXT,
                    PRIMARY KEY (username, user_type)
                )`);
                db.run(`INSERT OR IGNORE INTO users_new (username, user_type, password, is_admin, student_id, created_at)
                        SELECT username,
                               CASE WHEN is_admin = 1 THEN 'admin' ELSE 'foreigner' END,
                               password, is_admin, student_id, created_at
                        FROM users`);
                db.run("DROP TABLE users");
                db.run("ALTER TABLE users_new RENAME TO users");
                db.run("COMMIT", (err) => {
                    if (err) console.error("Migration Failed:", err);
                    else console.log("Migration: users table upgraded.");
                    syncAdmin();
                });
            });
        } else {
            syncAdmin();
        }
    });

    function syncAdmin() {
        const adminUser = 'manager';
        const adminPass = '1234';
        db.run("INSERT OR REPLACE INTO users (username, user_type, password, is_admin) VALUES (?, ?, ?, ?)", [adminUser, 'admin', adminPass, 1]);
        console.log("Admin account synchronized: manager / 1234");
    }
});


// Middleware for JWT Verification
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    if (token === 'GUEST_TOKEN') {
        req.user = { username: 'GUEST', isAdmin: false };
        return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- API Endpoints ---

// Registration
app.post('/api/auth/signup', (req, res) => {
    const { username, password, user_type } = req.body;
    if (!username || !password || !user_type) return res.status(400).json({ error: '필수 정보를 모두 입력해주세요.' });

    db.run("INSERT INTO users (username, user_type, password, created_at) VALUES (?, ?, ?, DATETIME('now', 'localtime'))", [username, user_type, password], (err) => {
        if (err) return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
        res.json({ message: '회원가입 성공!' });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password, user_type } = req.body;
    // Search for EXACT match of username + user_type OR any Admin with that username
    db.get("SELECT * FROM users WHERE username = ? AND (user_type = ? OR is_admin = 1)", [username, user_type], (err, user) => {
        if (err || !user || user.password !== password) {
            return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
        }
        const token = jwt.sign({ username: user.username, user_type: user.user_type, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username, isAdmin: user.is_admin });
    });
});

// Save Record (Score & Ramen)
app.post('/api/records', authenticateToken, (req, res) => {
    const { score, ramen_type, student_id, user_type } = req.body;
    const username = req.user.username === 'GUEST' ? null : req.user.username;

    db.run("INSERT INTO records (username, student_id, score, ramen_type, user_type, created_at) VALUES (?, ?, ?, ?, ?, DATETIME('now', 'localtime'))", [username, student_id, score, ramen_type, user_type], (err) => {
        if (err) return res.status(500).json({ error: '기록 저장 실패' });
        res.json({ message: '기록이 저장되었습니다.' });
    });
});

// Admin: Get all records
app.get('/api/admin/records', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);

    const query = `
        SELECT r.*, u.is_admin 
        FROM records r 
        JOIN users u ON r.username = u.username 
        ORDER BY r.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: '기록 조회 실패' });
        res.json(rows);
    });
});

// Admin: Get user stats (Aggregate ramen counts)
app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);

    const query = `
        -- Registered Users (Koreans & Foreigners)
        SELECT 
            u.username, 
            u.password, 
            u.student_id, 
            u.user_type,
            COUNT(CASE WHEN r.ramen_type != 'NONE' AND r.ramen_type IS NOT NULL AND r.ramen_type != 'STAMP' THEN 1 END) as total_ramen,
            COUNT(CASE WHEN r.ramen_type = 'STAMP' THEN 1 END) as total_stamps,
            MAX(r.score) as high_score,
            COALESCE(MAX(r.created_at), u.created_at, '2000-01-01') as activity_date
        FROM users u
        LEFT JOIN records r ON u.username = r.username AND u.user_type = r.user_type
        WHERE u.is_admin = 0
        GROUP BY u.username, u.user_type

        UNION ALL

        -- Guests (Legacy records without user accounts)
        SELECT 
            r.student_id as username,
            '-' as password,
            r.student_id,
            r.user_type,
            COUNT(CASE WHEN r.ramen_type != 'NONE' AND r.ramen_type IS NOT NULL AND r.ramen_type != 'STAMP' THEN 1 END) as total_ramen,
            COUNT(CASE WHEN r.ramen_type = 'STAMP' THEN 1 END) as total_stamps,
            MAX(r.score) as high_score,
            COALESCE(MAX(r.created_at), '2000-01-01') as activity_date
        FROM records r
        WHERE (r.username IS NULL OR r.username = '') 
          AND NOT EXISTS (SELECT 1 FROM users WHERE username = r.student_id AND user_type = r.user_type)
        GROUP BY r.student_id, r.user_type
        
        ORDER BY activity_date DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: '회원 조회 실패' });
        res.json(rows);
    });
});

app.get('/api/records/my-summary', authenticateToken, (req, res) => {
    const { user_type } = req.query;
    const username = req.user.username === 'GUEST' ? null : req.user.username;

    let query = `
        SELECT DATE(created_at, 'localtime') as date, MAX(score) as high_score 
        FROM records 
        WHERE user_type = ? 
    `;
    let params = [user_type];

    if (username) {
        query += " AND username = ? ";
        params.push(username);
    } else {
        query += " AND (username IS NULL OR username = '') ";
    }

    query += " GROUP BY DATE(created_at, 'localtime') ORDER BY date DESC LIMIT 14";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: '기록 조회 실패' });
        res.json(rows);
    });
});

// Admin: Delete User and their records
app.delete('/api/admin/users/:username', authenticateToken, (req, res) => {
    if (!req.user.isAdmin) return res.sendStatus(403);
    const { username } = req.params;
    const { user_type } = req.query;

    if (!user_type) return res.status(400).json({ error: '사용자 유형 정보가 필요합니다.' });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run("DELETE FROM records WHERE student_id = ? AND user_type = ?", [username, user_type]);
        db.run("DELETE FROM users WHERE username = ? AND user_type = ? AND is_admin = 0", [username, user_type], function(err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: '삭제 실패' });
            }
            db.run("COMMIT");
            res.json({ message: '사용자 정보가 성공적으로 삭제되었습니다.' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Sugar Logos Backend running on http://localhost:${PORT}`);
});
