-- ============================================================
-- Trade Credits System
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add credits balance to users (everyone starts with 100 credits)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_balance INTEGER DEFAULT 100 NOT NULL;

-- ============================================================
-- Credit Transactions (ledger of all credit movements)
-- ============================================================

CREATE TYPE credit_tx_type AS ENUM (
  'signup_bonus',      -- initial credits
  'trade_payment',     -- paid for a service
  'trade_earning',     -- earned from providing a service
  'negotiation_adjustment', -- changed after negotiation
  'refund',            -- refund from cancelled trade
  'admin_grant'        -- admin-issued credits
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,              -- positive = earn, negative = spend
  balance_after INTEGER NOT NULL,       -- balance after this transaction
  type credit_tx_type NOT NULL,
  description TEXT,
  -- Link to the related match/project
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- the other party
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_user ON credit_transactions (user_id);
CREATE INDEX idx_credit_tx_type ON credit_transactions (type);
CREATE INDEX idx_credit_tx_created ON credit_transactions (created_at DESC);

-- ============================================================
-- Credit Offers (attached to matches for negotiation)
-- ============================================================

CREATE TYPE credit_offer_status AS ENUM ('proposed', 'countered', 'accepted', 'rejected', 'expired');

CREATE TABLE credit_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  -- Who proposed this offer
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Credit amount the proposer is willing to pay (or receive if negative)
  -- Positive = proposer pays receiver. Negative = receiver pays proposer.
  amount INTEGER NOT NULL CHECK (amount >= 0),
  -- Direction: who pays whom
  payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Negotiation
  status credit_offer_status DEFAULT 'proposed',
  note TEXT,                   -- "I think 50 credits is fair for 2 hours of editing"
  counter_amount INTEGER,      -- if countered, what the other party suggests
  counter_note TEXT,
  -- Timestamps
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_offers_match ON credit_offers (match_id);
CREATE INDEX idx_credit_offers_status ON credit_offers (status);

-- Trigger for auto-updating credit_offers.updated_at
CREATE TRIGGER trigger_credit_offers_updated
BEFORE UPDATE ON credit_offers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
