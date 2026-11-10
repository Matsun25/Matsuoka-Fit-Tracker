# Diet & Training Tracker 開発仕様書

## 1. プロジェクト概要とシステム構成
スマホから手軽に食事（PFC）とトレーニング内容を入力し、ダッシュボードでグラフ化する完全無料のSPA。
* **フロントエンド**: React (Vite) + Tailwind CSS + Recharts (ホスティング: Cloudflare Pages)
* **認証基盤**: AWS Cognito
* **バックエンド**: AWS API Gateway + AWS Lambda (Python / Boto3)
* **Hot DB**: AWS DynamoDB (最新データ・スマホからの即時読み書き用)
* **Cold DB**: PostgreSQL (Proxmoxローカル稼働 / 全データ永続保存用)
* **データ転送**: n8n (定期的にDynamoDBからPostgresへ転送)

## 2. API エンドポイント設計
* `GET /records` : 直近の食事・トレーニング・体重履歴を取得
* `POST /records/diet` : 食事記録（カロリー、PFC）の登録
* `POST /records/workout` : トレーニング（種目、重量、回数）の登録
* `POST /records/body` : 体組成（体重、体脂肪率）の登録

## 3. DynamoDB テーブル設計 (Hot DB)
* **Table Name**: `FitnessRecords`
* **Partition Key (PK)**: `userId` (String) - CognitoのユーザーID
* **Sort Key (SK)**: `recordType#timestamp` (String)
  * 例: `DIET#2026-11-10T12:00:00Z`, `WORKOUT#2026-11-10T14:30:00Z`
* **主な属性**: `calories`, `protein`, `fat`, `carbs`, `workoutName`, `weight`, `reps`, `sets`

## 4. PostgreSQL テーブル設計 (Cold DB)
```sql
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diet_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    recorded_at TIMESTAMP,
    menu_name VARCHAR(255),
    calories INT,
    protein DECIMAL(5,2),
    fat DECIMAL(5,2),
    carbs DECIMAL(5,2)
);

CREATE TABLE workout_records (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    recorded_at TIMESTAMP,
    workout_name VARCHAR(255),
    weight DECIMAL(5,2),
    reps INT,
    sets INT
);