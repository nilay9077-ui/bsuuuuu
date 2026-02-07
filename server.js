const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const { pool, initDatabase } = require('./database');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bsu_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Verification questions and answers
const VERIFICATION_QUESTIONS = [
  { question: "Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?", answer: "3", options: ["1", "2", "3", "əsas"] },
  { question: "Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?", answer: "3", options: ["1", "2", "3", "əsas"] },
  { question: "Fizika fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Kimya fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Biologiya fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Coğrafiya fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Geologiya fakültəsi hansı korpusda yerləşir?", answer: "əsas", options: ["1", "2", "3", "əsas"] },
  { question: "Filologiya fakültəsi hansı korpusda yerləşir?", answer: "1", options: ["1", "2", "3", "əsas"] },
  { question: "Tarix fakültəsi hansı korpusda yerləşir?", answer: "3", options: ["1", "2", "3", "əsas"] },
  { question: "Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?", answer: "1", options: ["1", "2", "3", "əsas"] },
  { question: "Hüquq fakültəsi hansı korpusda yerləşir?", answer: "1", options: ["1", "2", "3", "əsas"] },
  { question: "Jurnalistika fakültəsi hansı korpusda yerləşir?", answer: "2", options: ["1", "2", "3", "əsas"] },
  { question: "İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?", answer: "2", options: ["1", "2", "3", "əsas"] },
  { question: "Şərqşünaslıq fakültəsi hansı korpusda yerləşir?", answer: "2", options: ["1", "2", "3", "əsas"] },
  { question: "Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?", answer: "2", options: ["1", "2", "3", "əsas"] }
];

const FACULTIES = [
  "Mexanika-riyaziyyat",
  "Tətbiqi riyaziyyat və kibernetika",
  "Fizika",
  "Kimya",
  "Biologiya",
  "Ekologiya və torpaqşünaslıq",
  "Coğrafiya",
  "Geologiya",
  "Filologiya",
  "Tarix",
  "Beynəlxalq münasibətlər və iqtisadiyyat",
  "Hüquq",
  "Jurnalistika",
  "İnformasiya və sənəd menecmenti",
  "Şərqşünaslıq",
  "Sosial elmlər və psixologiya"
];

// Routes
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.get('/admin', (req, res) => {
  if (req.session.adminId) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
  }
});

// Get verification questions (random 3)
app.get('/api/verification-questions', (req, res) => {
  const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  res.json(selected);
});

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, phone, password, fullName, faculty, degree, course, avatar, verificationAnswers } = req.body;

    // Validate email domain
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    // Validate phone format
    if (!phone.startsWith('+994') || phone.length !== 13) {
      return res.status(400).json({ error: 'Telefon nömrəsi +994 ilə başlamalı və 9 rəqəm olmalıdır' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Bu email və ya telefon artıq istifadə olunur' });
    }

    // Check if user is blocked
    const blockedUser = await pool.query(
      'SELECT id FROM users WHERE (email = $1 OR phone = $2) AND is_active = false',
      [email, phone]
    );

    if (blockedUser.rows.length > 0) {
      return res.status(403).json({ error: 'Bu hesab deaktiv edilib' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, phone, password, full_name, faculty, degree, course, avatar) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [email, phone, hashedPassword, fullName, faculty, degree, course, avatar]
    );

    req.session.userId = result.rows[0].id;
    res.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    req.session.userId = user.id;
    res.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    req.session.adminId = admin.id;
    req.session.isSuper = admin.is_super;
    res.json({ success: true, isSuper: admin.is_super });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Get current user
app.get('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, phone, full_name, faculty, degree, course, avatar FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'İstifadəçi tapılmadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Update user profile
app.put('/api/user', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }

  try {
    const { fullName, faculty, degree, course, avatar } = req.body;

    await pool.query(
      `UPDATE users SET full_name = $1, faculty = $2, degree = $3, course = $4, avatar = $5 
       WHERE id = $6`,
      [fullName, faculty, degree, course, avatar, req.session.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Yeniləmə zamanı xəta baş verdi' });
  }
});

// Get admin settings
app.get('/api/admin/settings', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur' });
  }

  try {
    const result = await pool.query('SELECT * FROM admin_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Update admin settings
app.put('/api/admin/settings', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur' });
  }

  try {
    const { key, value } = req.body;

    await pool.query(
      `INSERT INTO admin_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, value]
    );

    // Broadcast settings update to all clients
    io.emit('settings_updated', { key, value });

    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Yeniləmə zamanı xəta baş verdi' });
  }
});

// Get all users (admin)
app.get('/api/admin/users', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, phone, full_name, faculty, degree, course, avatar, is_active, created_at 
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Toggle user status (admin)
app.put('/api/admin/users/:id/toggle', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur' });
  }

  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1',
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Get reported users (admin)
app.get('/api/admin/reported-users', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Admin girişi tələb olunur' });
  }

  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.phone, u.full_name, u.faculty, u.degree, u.course, u.avatar, u.is_active,
             COUNT(r.id) as report_count
      FROM users u
      LEFT JOIN reports r ON u.id = r.reported_id
      GROUP BY u.id
      HAVING COUNT(r.id) >= 8
      ORDER BY report_count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reported users error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Get sub-admins (super admin only)
app.get('/api/admin/sub-admins', async (req, res) => {
  if (!req.session.adminId || !req.session.isSuper) {
    return res.status(403).json({ error: 'Super admin girişi tələb olunur' });
  }

  try {
    const result = await pool.query(
      'SELECT id, username, created_at FROM admins WHERE is_super = false ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get sub-admins error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Create sub-admin (super admin only)
app.post('/api/admin/sub-admins', async (req, res) => {
  if (!req.session.adminId || !req.session.isSuper) {
    return res.status(403).json({ error: 'Super admin girişi tələb olunur' });
  }

  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO admins (username, password, is_super) VALUES ($1, $2, false)',
      [username, hashedPassword]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Create sub-admin error:', error);
    if (error.constraint === 'admins_username_key') {
      res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
    } else {
      res.status(500).json({ error: 'Xəta baş verdi' });
    }
  }
});

// Delete sub-admin (super admin only)
app.delete('/api/admin/sub-admins/:id', async (req, res) => {
  if (!req.session.adminId || !req.session.isSuper) {
    return res.status(403).json({ error: 'Super admin girişi tələb olunur' });
  }

  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM admins WHERE id = $1 AND is_super = false', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete sub-admin error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Block user
app.post('/api/block/:userId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }

  try {
    const { userId } = req.params;

    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.session.userId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Report user
app.post('/api/report/:userId', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }

  try {
    const { userId } = req.params;

    await pool.query(
      'INSERT INTO reports (reporter_id, reported_id) VALUES ($1, $2)',
      [req.session.userId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Get public settings (no auth required)
app.get('/api/settings/public', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT key, value FROM admin_settings WHERE key IN ('topic_of_day', 'about_text', 'rules_text', 'filter_words')"
    );
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ error: 'Xəta baş verdi' });
  }
});

// Socket.IO connection handling
const connectedUsers = new Map(); // userId -> socket.id

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user_connected', async (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;

    // Get user's faculty
    const result = await pool.query('SELECT faculty FROM users WHERE id = $1', [userId]);
    if (result.rows.length > 0) {
      socket.faculty = result.rows[0].faculty;
      socket.join(socket.faculty); // Join faculty room
    }
  });

  socket.on('join_faculty', (faculty) => {
    socket.join(faculty);
    console.log(`User ${socket.userId} joined faculty: ${faculty}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { receiverId, message, faculty, isPrivate } = data;
      
      // Get filter words
      const settingsResult = await pool.query(
        "SELECT value FROM admin_settings WHERE key = 'filter_words'"
      );
      
      let filteredMessage = message;
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
        const filterWords = settingsResult.rows[0].value.split(',').map(w => w.trim()).filter(w => w);
        filterWords.forEach(word => {
          const regex = new RegExp(word, 'gi');
          filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
        });
      }

      // Save message to database
      const result = await pool.query(
        `INSERT INTO messages (sender_id, receiver_id, faculty, message, is_private) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
        [socket.userId, receiverId || null, faculty || null, filteredMessage, isPrivate || false]
      );

      // Get sender info
      const senderResult = await pool.query(
        'SELECT id, full_name, faculty, degree, course, avatar FROM users WHERE id = $1',
        [socket.userId]
      );

      const messageData = {
        id: result.rows[0].id,
        sender: senderResult.rows[0],
        message: filteredMessage,
        createdAt: result.rows[0].created_at,
        isPrivate
      };

      if (isPrivate) {
        // Send to specific user
        const receiverSocketId = connectedUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', messageData);
        }
        // Send back to sender
        socket.emit('new_message', messageData);
      } else {
        // Broadcast to faculty room
        io.to(faculty).emit('new_message', messageData);
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Mesaj göndərilə bilmədi' });
    }
  });

  socket.on('get_messages', async (data) => {
    try {
      const { faculty, receiverId, isPrivate } = data;
      
      let query, params;
      
      if (isPrivate) {
        // Get private messages
        query = `
          SELECT m.id, m.message, m.created_at, m.is_private,
                 u.id as sender_id, u.full_name, u.faculty, u.degree, u.course, u.avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.is_private = true 
            AND ((m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1))
            AND NOT EXISTS (
              SELECT 1 FROM blocks WHERE 
                (blocker_id = $1 AND blocked_id = m.sender_id) OR 
                (blocker_id = m.sender_id AND blocked_id = $1)
            )
          ORDER BY m.created_at ASC
        `;
        params = [socket.userId, receiverId];
      } else {
        // Get faculty messages
        query = `
          SELECT m.id, m.message, m.created_at, m.is_private,
                 u.id as sender_id, u.full_name, u.faculty, u.degree, u.course, u.avatar
          FROM messages m
          JOIN users u ON m.sender_id = u.id
          WHERE m.faculty = $1 AND m.is_private = false
            AND NOT EXISTS (
              SELECT 1 FROM blocks WHERE blocker_id = $2 AND blocked_id = m.sender_id
            )
          ORDER BY m.created_at ASC
        `;
        params = [faculty, socket.userId];
      }

      const result = await pool.query(query, params);
      
      const messages = result.rows.map(row => ({
        id: row.id,
        sender: {
          id: row.sender_id,
          full_name: row.full_name,
          faculty: row.faculty,
          degree: row.degree,
          course: row.course,
          avatar: row.avatar
        },
        message: row.message,
        createdAt: row.created_at,
        isPrivate: row.is_private
      }));

      socket.emit('messages_loaded', messages);
    } catch (error) {
      console.error('Get messages error:', error);
      socket.emit('error', { message: 'Mesajlar yüklənə bilmədi' });
    }
  });

  socket.on('get_faculty_users', async (faculty) => {
    try {
      const result = await pool.query(
        `SELECT id, full_name, faculty, degree, course, avatar 
         FROM users 
         WHERE faculty = $1 AND is_active = true AND id != $2
         ORDER BY full_name ASC`,
        [faculty, socket.userId]
      );

      socket.emit('faculty_users_loaded', result.rows);
    } catch (error) {
      console.error('Get faculty users error:', error);
      socket.emit('error', { message: 'İstifadəçilər yüklənə bilmədi' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Auto-delete old messages
async function autoDeleteMessages() {
  try {
    const settings = await pool.query(`
      SELECT key, value FROM admin_settings 
      WHERE key IN ('group_message_lifetime_value', 'group_message_lifetime_unit', 
                    'private_message_lifetime_value', 'private_message_lifetime_unit')
    `);

    const config = {};
    settings.rows.forEach(row => {
      config[row.key] = row.value;
    });

    // Delete group messages
    const groupValue = parseInt(config.group_message_lifetime_value) || 60;
    const groupUnit = config.group_message_lifetime_unit || 'minutes';
    const groupInterval = groupUnit === 'hours' ? `${groupValue} hours` : `${groupValue} minutes`;

    await pool.query(`
      DELETE FROM messages 
      WHERE is_private = false 
        AND created_at < NOW() - INTERVAL '${groupInterval}'
    `);

    // Delete private messages
    const privateValue = parseInt(config.private_message_lifetime_value) || 30;
    const privateUnit = config.private_message_lifetime_unit || 'minutes';
    const privateInterval = privateUnit === 'hours' ? `${privateValue} hours` : `${privateValue} minutes`;

    await pool.query(`
      DELETE FROM messages 
      WHERE is_private = true 
        AND created_at < NOW() - INTERVAL '${privateInterval}'
    `);

    console.log('Old messages deleted successfully');
  } catch (error) {
    console.error('Auto-delete messages error:', error);
  }
}

// Run auto-delete every minute
setInterval(autoDeleteMessages, 60 * 1000);

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`BSU Chat server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});
