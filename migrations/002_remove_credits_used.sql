-- Migration: Remove credits_used column from brand_analyses table
-- Description: Remove payment/credit tracking as we've eliminated the Autumn payment system

ALTER TABLE brand_analyses DROP COLUMN IF EXISTS credits_used;

