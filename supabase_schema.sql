-- 1. Table for Speed Run completion times
CREATE TABLE IF NOT EXISTS game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_role TEXT NOT NULL CHECK (player_role IN ('isaac', 'ella')),
  round_index INTEGER NOT NULL,
  completion_time FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Ella's private text answers about Isaac
CREATE TABLE IF NOT EXISTS ella_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id INTEGER NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table for Secure PIN tracking
CREATE TABLE IF NOT EXISTS player_identities (
  role TEXT PRIMARY KEY CHECK (role IN ('isaac', 'ella')),
  pin_hash TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table for Real-time Location Tracking
CREATE TABLE IF NOT EXISTS player_locations (
  player_role TEXT PRIMARY KEY CHECK (player_role IN ('isaac', 'ella')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In the Supabase SQL Editor, make sure to enable Realtime for these tables 
-- by clicking 'Realtime' in the Table Editor settings for each table.
-- ALSO: Enable Realtime specifically for 'player_locations' so Isaac can see her move.
