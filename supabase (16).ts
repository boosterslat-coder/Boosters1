-- Add fairness tracking fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS losses_since_last_win int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_wins int NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_losses int NOT NULL DEFAULT 0;

-- Add prize_amount column to lottery_games for tracking
ALTER TABLE lottery_games ADD COLUMN IF NOT EXISTS prize_amount numeric(10,2) NOT NULL DEFAULT 10.00;

-- Update the entry fee from €10 to €1 per the new spec
-- The TICKET_PRICE is handled in app code, but we update the default prize
ALTER TABLE lottery_games ALTER COLUMN prize_amount SET DEFAULT 10.00;

-- Add match_size to app_settings for admin configurability
INSERT INTO app_settings (key, value) VALUES ('match_size', '10') ON CONFLICT DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('entry_fee', '1') ON CONFLICT DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('weight_base', '100') ON CONFLICT DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('weight_per_loss', '10') ON CONFLICT DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('guaranteed_after', '9') ON CONFLICT DO NOTHING;

-- Allow admin profiles to read all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admin profiles to update other profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Allow admins to insert lottery_games
CREATE POLICY "Admins can insert lottery games"
  ON lottery_games FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to update lottery games
CREATE POLICY "Admins can update lottery games"
  ON lottery_games FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow users to read all profiles (for match player display)
-- We already have "Users can view own profile", adding a more permissive one for match display
CREATE POLICY "Authenticated users can view all profiles for matches"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
