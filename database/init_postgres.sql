-- =============================================================================
-- Diet & Training Tracker - Cold DB (PostgreSQL) 初期化スクリプト
-- 用途: Proxmox 上の PostgreSQL に永続化用テーブルを作成する
-- =============================================================================

-- 1. ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 食事記録テーブル (PFC・カロリー)
CREATE TABLE IF NOT EXISTS diet_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    calories INT NOT NULL CHECK (calories >= 0),
    protein DECIMAL(5,2) NOT NULL CHECK (protein >= 0),
    fat DECIMAL(5,2) NOT NULL CHECK (fat >= 0),
    carbs DECIMAL(5,2) NOT NULL CHECK (carbs >= 0),
    dynamodb_sk VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. トレーニング記録テーブル (種目・重量・回数・セット数)
CREATE TABLE IF NOT EXISTS workout_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    workout_name VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0),
    reps INT NOT NULL CHECK (reps > 0),
    sets INT NOT NULL CHECK (sets > 0),
    dynamodb_sk VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. 体組成記録テーブル (体重・体脂肪率)
CREATE TABLE IF NOT EXISTS body_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    body_weight DECIMAL(5,2) NOT NULL CHECK (body_weight > 0),
    body_fat_percentage DECIMAL(4,1) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    dynamodb_sk VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- クエリ高速化のためのインデックス定義
CREATE INDEX IF NOT EXISTS idx_diet_records_user_recorded
    ON diet_records (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_records_user_recorded
    ON workout_records (user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_body_records_user_recorded
    ON body_records (user_id, recorded_at DESC);

