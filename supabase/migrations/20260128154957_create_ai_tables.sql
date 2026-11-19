-- Create AI tracking tables and RPC functions
-- Migration: 20260128_create_ai_tables

-- ============================================
-- AIUsage Table - Log all AI requests
-- ============================================
CREATE TABLE IF NOT EXISTS "AIUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "resourceId" TEXT,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "estimatedCostBRL" NUMERIC NOT NULL DEFAULT 0,
  "cacheHit" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- UserAIQuota Table - Track user quotas
-- ============================================
CREATE TABLE IF NOT EXISTS "UserAIQuota" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL UNIQUE,
  "questionsLimit" INTEGER NOT NULL DEFAULT 0,
  "questionsUsed" INTEGER NOT NULL DEFAULT 0,
  "essaysLimit" INTEGER NOT NULL DEFAULT 0,
  "essaysUsed" INTEGER NOT NULL DEFAULT 0,
  "totalTokensUsed" BIGINT NOT NULL DEFAULT 0,
  "totalCostBRL" NUMERIC NOT NULL DEFAULT 0,
  "currentPeriodStart" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  "currentPeriodEnd" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- RPC Functions
-- ============================================

-- log_ai_usage: Log AI usage event
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_user_id TEXT,
  p_type TEXT,
  p_resource_id TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_total_tokens INTEGER,
  p_cost_brl NUMERIC,
  p_cache_hit BOOLEAN,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  INSERT INTO "AIUsage" (
    "userId",
    "type",
    "resourceId",
    "promptTokens",
    "completionTokens",
    "totalTokens",
    "estimatedCostBRL",
    "cacheHit",
    "status",
    "errorMessage"
  ) VALUES (
    p_user_id,
    p_type,
    p_resource_id,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_cost_brl,
    p_cache_hit,
    p_status,
    p_error_message
  )
  RETURNING "id" INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- increment_ai_usage: Increment user quota counters
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id TEXT,
  p_type TEXT,
  p_tokens BIGINT,
  p_cost_brl NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "UserAIQuota" SET
    "totalTokensUsed" = "totalTokensUsed" + p_tokens,
    "totalCostBRL" = "totalCostBRL" + p_cost_brl,
    "updatedAt" = NOW()
  WHERE "userId" = p_user_id;

  IF p_type = 'QUESTION_EXPLANATION' THEN
    UPDATE "UserAIQuota" SET
      "questionsUsed" = "questionsUsed" + 1
    WHERE "userId" = p_user_id;
  ELSIF p_type = 'ESSAY_CORRECTION' THEN
    UPDATE "UserAIQuota" SET
      "essaysUsed" = "essaysUsed" + 1
    WHERE "userId" = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_total_ai_costs: Get aggregate AI costs
CREATE OR REPLACE FUNCTION get_total_ai_costs()
RETURNS TABLE (
  "totalCostBRL" NUMERIC,
  "totalTokens" BIGINT,
  "totalRequests" BIGINT,
  "cacheHits" BIGINT,
  "cacheHitRate" NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM("AIUsage"."estimatedCostBRL"), 0)::NUMERIC as "totalCostBRL",
    COALESCE(SUM("AIUsage"."totalTokens"), 0)::BIGINT as "totalTokens",
    COUNT(*)::BIGINT as "totalRequests",
    SUM(CASE WHEN "AIUsage"."cacheHit" = TRUE THEN 1 ELSE 0 END)::BIGINT as "cacheHits",
    CASE
      WHEN COUNT(*) > 0 THEN
        ROUND((SUM(CASE WHEN "AIUsage"."cacheHit" = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as "cacheHitRate"
  FROM "AIUsage"
  WHERE "AIUsage"."status" = 'SUCCESS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_costs_by_user: Get costs grouped by user
CREATE OR REPLACE FUNCTION get_costs_by_user()
RETURNS TABLE (
  "userId" TEXT,
  "userEmail" TEXT,
  "userName" TEXT,
  "totalCostBRL" NUMERIC,
  "totalTokens" BIGINT,
  "totalRequests" BIGINT,
  "cacheHits" BIGINT,
  "lastUsed" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u."id" as "userId",
    u."email"::TEXT as "userEmail",
    COALESCE(u."name", 'Usuário') as "userName",
    COALESCE(SUM(ai."estimatedCostBRL"), 0)::NUMERIC as "totalCostBRL",
    COALESCE(SUM(ai."totalTokens"), 0)::BIGINT as "totalTokens",
    COUNT(ai.*)::BIGINT as "totalRequests",
    SUM(CASE WHEN ai."cacheHit" = TRUE THEN 1 ELSE 0 END)::BIGINT as "cacheHits",
    MAX(ai."createdAt") as "lastUsed"
  FROM "User" u
  LEFT JOIN "AIUsage" ai ON ai."userId" = u."id" AND ai."status" = 'SUCCESS'
  GROUP BY u."id", u."email", u."name"
  HAVING COUNT(ai.*) > 0
  ORDER BY COALESCE(SUM(ai."estimatedCostBRL"), 0) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- check_or_initialize_user_quota: Check or initialize user quota
CREATE OR REPLACE FUNCTION check_or_initialize_user_quota(
  p_user_id TEXT,
  p_user_plan TEXT
)
RETURNS TABLE (
  "current_period_end" TIMESTAMP WITH TIME ZONE,
  "questions_limit" INTEGER,
  "questions_used" INTEGER,
  "essays_limit" INTEGER,
  "essays_used" INTEGER
) AS $$
DECLARE
  v_quota RECORD;
  v_questions_limit INTEGER;
  v_essays_limit INTEGER;
BEGIN
  IF p_user_plan = 'RUMO_A_APROVACAO' THEN
    v_questions_limit := 900;
    v_essays_limit := 20;
  ELSE
    v_questions_limit := 0;
    v_essays_limit := 0;
  END IF;

  SELECT * INTO v_quota FROM "UserAIQuota" WHERE "userId" = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO "UserAIQuota" (
      "userId",
      "questionsLimit",
      "questionsUsed",
      "essaysLimit",
      "essaysUsed",
      "currentPeriodStart",
      "currentPeriodEnd"
    ) VALUES (
      p_user_id,
      v_questions_limit,
      0,
      v_essays_limit,
      0,
      DATE_TRUNC('month', NOW()),
      DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    );

    RETURN QUERY
    SELECT
      DATE_TRUNC('month', NOW()) + INTERVAL '1 month' as "current_period_end",
      v_questions_limit as "questions_limit",
      0 as "questions_used",
      v_essays_limit as "essays_limit",
      0 as "essays_used";
  ELSE
    IF NOW() > v_quota."currentPeriodEnd" THEN
      UPDATE "UserAIQuota" SET
        "questionsUsed" = 0,
        "essaysUsed" = 0,
        "totalTokensUsed" = 0,
        "totalCostBRL" = 0,
        "currentPeriodStart" = DATE_TRUNC('month', NOW()),
        "currentPeriodEnd" = DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
        "questionsLimit" = v_questions_limit,
        "essaysLimit" = v_essays_limit,
        "updatedAt" = NOW()
      WHERE "userId" = p_user_id;

      RETURN QUERY
      SELECT
        DATE_TRUNC('month', NOW()) + INTERVAL '1 month' as "current_period_end",
        v_questions_limit as "questions_limit",
        0 as "questions_used",
        v_essays_limit as "essays_limit",
        0 as "essays_used";
    ELSE
      RETURN QUERY
      SELECT
        v_quota."currentPeriodEnd" as "current_period_end",
        COALESCE(v_quota."questionsLimit", v_questions_limit) as "questions_limit",
        v_quota."questionsUsed" as "questions_used",
        COALESCE(v_quota."essaysLimit", v_essays_limit) as "essays_limit",
        v_quota."essaysUsed" as "essays_used";
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE "AIUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserAIQuota" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own AI usage" ON "AIUsage";
DROP POLICY IF EXISTS "Users can view their own quota" ON "UserAIQuota";
DROP POLICY IF EXISTS "Service role has full access to AIUsage" ON "AIUsage";
DROP POLICY IF EXISTS "Service role has full access to UserAIQuota" ON "UserAIQuota";

CREATE POLICY "Users can view their own AI usage"
  ON "AIUsage"
  FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Service role has full access to AIUsage"
  ON "AIUsage"
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own quota"
  ON "UserAIQuota"
  FOR SELECT
  USING (auth.uid()::TEXT = "userId");

CREATE POLICY "Service role has full access to UserAIQuota"
  ON "UserAIQuota"
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');;
