-- PostgreSQL Schema for Circuitly Application

-- Enable extension for UUID if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (with encryption for passwords)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Encrypted/Hashed password
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    class_group VARCHAR(50),
    xp INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    role VARCHAR(20) DEFAULT 'user',
    next_heart_restore_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topic Progress Table
CREATE TABLE IF NOT EXISTS topic_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    completion_count INTEGER DEFAULT 0,
    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, topic_id)
);

-- Questions Table (Static Question Bank)
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    type VARCHAR(20) DEFAULT 'mcq', -- 'mcq' or 'long'
    difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'very hard'
    prompt TEXT NOT NULL,
    option_a TEXT, -- Nullable for long questions
    option_b TEXT, -- Nullable for long questions
    option_c TEXT, -- Nullable for long questions
    option_d TEXT, -- Additional option for MCQs
    answer TEXT NOT NULL,
    image_url TEXT,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_user ON topic_progress(user_id);
