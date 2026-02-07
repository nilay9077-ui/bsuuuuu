const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        faculty VARCHAR(100) NOT NULL,
        degree VARCHAR(50) NOT NULL,
        course INTEGER NOT NULL,
        avatar INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER,
        faculty VARCHAR(100),
        message TEXT NOT NULL,
        is_private BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Blocks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        blocker_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        blocked_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(blocker_id, blocked_id)
      )
    `);

    // Reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reported_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_faculty ON messages(faculty);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_faculty ON users(faculty);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
      CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
    `);

    // Admin settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_super BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings
    await client.query(`
      INSERT INTO admin_settings (key, value) VALUES
        ('filter_words', ''),
        ('topic_of_day', 'Xoş gəlmisiniz!'),
        ('about_text', 'BSU Chat - Bakı Dövlət Universiteti tələbələri üçün söhbət platforması'),
        ('rules_text', '1. Hörmət və nəzakət göstərin\n2. Spam göndərməyin\n3. Şəxsi məlumatları paylaşmayın'),
        ('group_message_lifetime_value', '60'),
        ('group_message_lifetime_unit', 'minutes'),
        ('private_message_lifetime_value', '30'),
        ('private_message_lifetime_unit', 'minutes')
      ON CONFLICT (key) DO NOTHING
    `);

    // Insert super admin
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('majorursa618', 10);
    await client.query(`
      INSERT INTO admins (username, password, is_super) VALUES
        ('618ursamajor618', $1, true)
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDatabase };
