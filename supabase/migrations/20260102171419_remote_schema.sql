
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."ai_message_role" AS ENUM (
    'user',
    'assistant',
    'system'
);


ALTER TYPE "public"."ai_message_role" OWNER TO "postgres";


CREATE TYPE "public"."goal_status" AS ENUM (
    'active',
    'completed',
    'archived'
);


ALTER TYPE "public"."goal_status" OWNER TO "postgres";


CREATE TYPE "public"."habit_cadence_type" AS ENUM (
    'daily',
    'weekly',
    'custom'
);


ALTER TYPE "public"."habit_cadence_type" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."reflection_type" AS ENUM (
    'onboarding',
    'daily',
    'weekly',
    'monthly',
    'crisis'
);


ALTER TYPE "public"."reflection_type" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'todo',
    'in_progress',
    'done',
    'cancelled'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_is_owner"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select coalesce(user_id = auth.uid(), false)
$$;


ALTER FUNCTION "public"."_is_owner"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_feedback_user_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_feedback_user_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "role" "public"."ai_message_role" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "topic" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_focus" (
    "user_id" "uuid" NOT NULL,
    "focus_date" "date" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_focus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "feature_key" "text" NOT NULL,
    "feature_label" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."feature_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid"
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_assets_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."financial_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_expenses_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."financial_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_incomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_incomes_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."financial_incomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_liabilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(16,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_liabilities_amount_check" CHECK (("amount" >= (0)::numeric))
);


ALTER TABLE "public"."financial_liabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_monthly_statements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "statement_month" "date" NOT NULL,
    "actual_income" numeric(14,2) DEFAULT 0 NOT NULL,
    "actual_expenses" numeric(14,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "income_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "expense_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."financial_monthly_statements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_net_worth_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "total_assets" numeric(16,2) NOT NULL,
    "total_liabilities" numeric(16,2) NOT NULL,
    "net_worth" numeric(16,2) NOT NULL,
    "net_cash_flow" numeric(14,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_net_worth_snapshots_total_assets_check" CHECK (("total_assets" >= (0)::numeric)),
    CONSTRAINT "financial_net_worth_snapshots_total_liabilities_check" CHECK (("total_liabilities" >= (0)::numeric))
);


ALTER TABLE "public"."financial_net_worth_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_settings" (
    "user_id" "uuid" NOT NULL,
    "annual_return_rate" numeric(5,2) DEFAULT 5 NOT NULL,
    "inflation_rate" numeric(5,2) DEFAULT 2 NOT NULL,
    "projection_years" integer DEFAULT 5 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "financial_settings_projection_years_check" CHECK ((("projection_years" >= 1) AND ("projection_years" <= 50)))
);


ALTER TABLE "public"."financial_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goal_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "goal_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false NOT NULL,
    "due_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."goal_milestones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "life_area_id" integer,
    "status" "public"."goal_status" DEFAULT 'active'::"public"."goal_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level" NOT NULL,
    "target_date" "date",
    "is_starred" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "color_hex" "text" DEFAULT '#E3F2FD'::"text" NOT NULL
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "habit_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "log_date" "date" NOT NULL,
    "completed" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "life_area_id" integer,
    "goal_id" "uuid",
    "cadence" "public"."habit_cadence_type" DEFAULT 'daily'::"public"."habit_cadence_type" NOT NULL,
    "frequency_per_period" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."life_areas" (
    "id" integer NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."life_areas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."life_areas_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."life_areas_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."life_areas_id_seq" OWNED BY "public"."life_areas"."id";



CREATE TABLE IF NOT EXISTS "public"."next_step_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."next_step_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "username" "text",
    "timezone" "text" DEFAULT 'America/Bogota'::"text",
    "onboarding_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company" "text",
    "project_type" "text" NOT NULL,
    "budget_range" "text",
    "timeline" "text",
    "details" "text" NOT NULL,
    "how_heard" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    CONSTRAINT "project_inquiries_budget_range_check" CHECK ((("budget_range" = ANY (ARRAY['<1000'::"text", '1000-5000'::"text", '5000-1000'::"text", '>10000'::"text"])) OR ("budget_range" IS NULL))),
    CONSTRAINT "project_inquiries_email_check" CHECK ((POSITION(('@'::"text") IN ("email")) > 1)),
    CONSTRAINT "project_inquiries_project_type_check" CHECK (("project_type" = ANY (ARRAY['custom-gpt'::"text", 'internal-tool'::"text", 'website'::"text", 'advisory'::"text", 'other'::"text"]))),
    CONSTRAINT "project_inquiries_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'replied'::"text", 'qualified'::"text", 'closed'::"text"]))),
    CONSTRAINT "project_inquiries_timeline_check" CHECK ((("timeline" = ANY (ARRAY['asap'::"text", '1-3'::"text", '3-6'::"text", 'flexible'::"text"])) OR ("timeline" IS NULL)))
);


ALTER TABLE "public"."project_inquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reflections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."reflection_type" DEFAULT 'weekly'::"public"."reflection_type" NOT NULL,
    "content" "jsonb" NOT NULL,
    "mood_score" integer,
    "energy_score" integer,
    "primary_life_area_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reflections_energy_score_check" CHECK ((("energy_score" >= 1) AND ("energy_score" <= 10))),
    CONSTRAINT "reflections_mood_score_check" CHECK ((("mood_score" >= 1) AND ("mood_score" <= 10)))
);


ALTER TABLE "public"."reflections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "status" "text",
    "price_id" "text",
    "current_period_end" timestamp with time zone
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'todo'::"public"."task_status" NOT NULL,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level" NOT NULL,
    "life_area_id" integer,
    "goal_id" "uuid",
    "habit_id" "uuid",
    "due_date" "date",
    "scheduled_for" "date",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_life_area_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "life_area_id" integer NOT NULL,
    "score" integer NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_life_area_scores_score_check" CHECK ((("score" >= 1) AND ("score" <= 10)))
);


ALTER TABLE "public"."user_life_area_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "default_home_view" "text" DEFAULT 'today'::"text",
    "week_start_day" integer DEFAULT 1 NOT NULL,
    "show_life_area_summary" boolean DEFAULT true NOT NULL,
    "auto_generate_tasks_from_ai" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_settings_week_start_day_check" CHECK ((("week_start_day" >= 0) AND ("week_start_day" <= 6)))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."life_areas" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."life_areas_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_pkey" PRIMARY KEY ("user_id", "focus_date");



ALTER TABLE ONLY "public"."feature_votes"
    ADD CONSTRAINT "feature_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_assets"
    ADD CONSTRAINT "financial_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_assets"
    ADD CONSTRAINT "financial_assets_user_description_key" UNIQUE ("user_id", "description");



ALTER TABLE ONLY "public"."financial_expenses"
    ADD CONSTRAINT "financial_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_expenses"
    ADD CONSTRAINT "financial_expenses_user_description_key" UNIQUE ("user_id", "description");



ALTER TABLE ONLY "public"."financial_incomes"
    ADD CONSTRAINT "financial_incomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_incomes"
    ADD CONSTRAINT "financial_incomes_user_description_key" UNIQUE ("user_id", "description");



ALTER TABLE ONLY "public"."financial_liabilities"
    ADD CONSTRAINT "financial_liabilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_liabilities"
    ADD CONSTRAINT "financial_liabilities_user_description_key" UNIQUE ("user_id", "description");



ALTER TABLE ONLY "public"."financial_monthly_statements"
    ADD CONSTRAINT "financial_monthly_statements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_monthly_statements"
    ADD CONSTRAINT "financial_monthly_statements_user_month_key" UNIQUE ("user_id", "statement_month");



ALTER TABLE ONLY "public"."financial_net_worth_snapshots"
    ADD CONSTRAINT "financial_net_worth_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_net_worth_snapshots"
    ADD CONSTRAINT "financial_net_worth_snapshots_user_date_key" UNIQUE ("user_id", "snapshot_date");



ALTER TABLE ONLY "public"."financial_settings"
    ADD CONSTRAINT "financial_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."goal_milestones"
    ADD CONSTRAINT "goal_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."life_areas"
    ADD CONSTRAINT "life_areas_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."life_areas"
    ADD CONSTRAINT "life_areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."next_step_entries"
    ADD CONSTRAINT "next_step_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_inquiries"
    ADD CONSTRAINT "project_inquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reflections"
    ADD CONSTRAINT "reflections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_life_area_scores"
    ADD CONSTRAINT "user_life_area_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "feature_votes_feature_key_idx" ON "public"."feature_votes" USING "btree" ("feature_key");



CREATE UNIQUE INDEX "feature_votes_user_id_idx" ON "public"."feature_votes" USING "btree" ("user_id");



CREATE INDEX "idx_activity_events_created" ON "public"."activity_events" USING "btree" ("created_at");



CREATE INDEX "idx_activity_events_type" ON "public"."activity_events" USING "btree" ("event_type");



CREATE INDEX "idx_activity_events_user" ON "public"."activity_events" USING "btree" ("user_id");



CREATE INDEX "idx_ai_messages_created" ON "public"."ai_messages" USING "btree" ("created_at");



CREATE INDEX "idx_ai_messages_role" ON "public"."ai_messages" USING "btree" ("role");



CREATE INDEX "idx_ai_messages_session" ON "public"."ai_messages" USING "btree" ("session_id");



CREATE INDEX "idx_ai_sessions_created" ON "public"."ai_sessions" USING "btree" ("created_at");



CREATE INDEX "idx_ai_sessions_user" ON "public"."ai_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_goal_milestones_goal" ON "public"."goal_milestones" USING "btree" ("goal_id");



CREATE INDEX "idx_goals_life_area" ON "public"."goals" USING "btree" ("life_area_id");



CREATE INDEX "idx_goals_status" ON "public"."goals" USING "btree" ("status");



CREATE INDEX "idx_goals_user" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_habit_logs_date" ON "public"."habit_logs" USING "btree" ("log_date");



CREATE INDEX "idx_habit_logs_habit" ON "public"."habit_logs" USING "btree" ("habit_id");



CREATE INDEX "idx_habit_logs_user" ON "public"."habit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_habits_goal" ON "public"."habits" USING "btree" ("goal_id");



CREATE INDEX "idx_habits_life_area" ON "public"."habits" USING "btree" ("life_area_id");



CREATE INDEX "idx_habits_user" ON "public"."habits" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_reflections_created" ON "public"."reflections" USING "btree" ("created_at");



CREATE INDEX "idx_reflections_type" ON "public"."reflections" USING "btree" ("type");



CREATE INDEX "idx_reflections_user" ON "public"."reflections" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_goal" ON "public"."tasks" USING "btree" ("goal_id");



CREATE INDEX "idx_tasks_life_area" ON "public"."tasks" USING "btree" ("life_area_id");



CREATE INDEX "idx_tasks_scheduled_for" ON "public"."tasks" USING "btree" ("scheduled_for");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tasks_user" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "idx_user_life_area_scores_area" ON "public"."user_life_area_scores" USING "btree" ("life_area_id");



CREATE INDEX "idx_user_life_area_scores_created_at" ON "public"."user_life_area_scores" USING "btree" ("created_at");



CREATE INDEX "idx_user_life_area_scores_user" ON "public"."user_life_area_scores" USING "btree" ("user_id");



CREATE INDEX "idx_user_settings_user" ON "public"."user_settings" USING "btree" ("user_id");



CREATE INDEX "next_step_entries_user_created_idx" ON "public"."next_step_entries" USING "btree" ("user_id", "created_at" DESC);



CREATE UNIQUE INDEX "uniq_habit_logs_per_day" ON "public"."habit_logs" USING "btree" ("user_id", "habit_id", "log_date");



CREATE OR REPLACE TRIGGER "trg_feedback_set_user" BEFORE INSERT ON "public"."feedback" FOR EACH ROW EXECUTE FUNCTION "public"."set_feedback_user_id"();



ALTER TABLE ONLY "public"."activity_events"
    ADD CONSTRAINT "activity_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."ai_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_sessions"
    ADD CONSTRAINT "ai_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_focus"
    ADD CONSTRAINT "daily_focus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."feature_votes"
    ADD CONSTRAINT "feature_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."financial_assets"
    ADD CONSTRAINT "financial_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_expenses"
    ADD CONSTRAINT "financial_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_incomes"
    ADD CONSTRAINT "financial_incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_liabilities"
    ADD CONSTRAINT "financial_liabilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_monthly_statements"
    ADD CONSTRAINT "financial_monthly_statements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_net_worth_snapshots"
    ADD CONSTRAINT "financial_net_worth_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_settings"
    ADD CONSTRAINT "financial_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goal_milestones"
    ADD CONSTRAINT "goal_milestones_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_life_area_id_fkey" FOREIGN KEY ("life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_life_area_id_fkey" FOREIGN KEY ("life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."next_step_entries"
    ADD CONSTRAINT "next_step_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reflections"
    ADD CONSTRAINT "reflections_primary_life_area_id_fkey" FOREIGN KEY ("primary_life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reflections"
    ADD CONSTRAINT "reflections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_life_area_id_fkey" FOREIGN KEY ("life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_life_area_scores"
    ADD CONSTRAINT "user_life_area_scores_life_area_id_fkey" FOREIGN KEY ("life_area_id") REFERENCES "public"."life_areas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_life_area_scores"
    ADD CONSTRAINT "user_life_area_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow inserts from anon" ON "public"."project_inquiries" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow read for service_role" ON "public"."project_inquiries" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Anyone can submit feedback" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert one feature vote" ON "public"."feature_votes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own feature vote" ON "public"."feature_votes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activity_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_events modify own" ON "public"."activity_events" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "activity_events select own" ON "public"."activity_events" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages modify own" ON "public"."ai_messages" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "ai_messages select own" ON "public"."ai_messages" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."ai_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_sessions modify own" ON "public"."ai_sessions" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "ai_sessions select own" ON "public"."ai_sessions" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."daily_focus" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_focus modify own" ON "public"."daily_focus" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "daily_focus select own" ON "public"."daily_focus" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



CREATE POLICY "daily_focus upsert own" ON "public"."daily_focus" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."feature_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feedback insert own" ON "public"."feedback" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "feedback modify own" ON "public"."feedback" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "feedback select own" ON "public"."feedback" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_assets modify own" ON "public"."financial_assets" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_assets select own" ON "public"."financial_assets" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_expenses modify own" ON "public"."financial_expenses" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_expenses select own" ON "public"."financial_expenses" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_incomes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_incomes modify own" ON "public"."financial_incomes" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_incomes select own" ON "public"."financial_incomes" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_liabilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_liabilities modify own" ON "public"."financial_liabilities" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_liabilities select own" ON "public"."financial_liabilities" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_monthly_statements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_monthly_statements modify own" ON "public"."financial_monthly_statements" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_monthly_statements select own" ON "public"."financial_monthly_statements" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_net_worth_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_net_worth_snapshots modify own" ON "public"."financial_net_worth_snapshots" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_net_worth_snapshots select own" ON "public"."financial_net_worth_snapshots" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."financial_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_settings modify own" ON "public"."financial_settings" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "financial_settings select own" ON "public"."financial_settings" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."goal_milestones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "goal_milestones modify via goal owner" ON "public"."goal_milestones" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."goals" "g"
  WHERE (("g"."id" = "goal_milestones"."goal_id") AND ("g"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."goals" "g"
  WHERE (("g"."id" = "goal_milestones"."goal_id") AND ("g"."user_id" = "auth"."uid"())))));



CREATE POLICY "goal_milestones select via goal owner" ON "public"."goal_milestones" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."goals" "g"
  WHERE (("g"."id" = "goal_milestones"."goal_id") AND ("g"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "goals modify own" ON "public"."goals" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "goals select own" ON "public"."goals" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "habit_logs modify own" ON "public"."habit_logs" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "habit_logs select own" ON "public"."habit_logs" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "habits modify own" ON "public"."habits" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "habits select own" ON "public"."habits" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."life_areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "life_areas public read" ON "public"."life_areas" FOR SELECT USING (true);



ALTER TABLE "public"."next_step_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "next_step_entries modify own" ON "public"."next_step_entries" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "next_step_entries select own" ON "public"."next_step_entries" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles modify own" ON "public"."profiles" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "profiles select own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."project_inquiries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reflections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reflections modify own" ON "public"."reflections" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "reflections select own" ON "public"."reflections" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subscriptions modify own" ON "public"."subscriptions" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "subscriptions select own" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks modify own" ON "public"."tasks" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "tasks select own" ON "public"."tasks" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."user_life_area_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_life_area_scores modify own" ON "public"."user_life_area_scores" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "user_life_area_scores select own" ON "public"."user_life_area_scores" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));



ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings modify own" ON "public"."user_settings" TO "authenticated" USING ("public"."_is_owner"("user_id")) WITH CHECK ("public"."_is_owner"("user_id"));



CREATE POLICY "user_settings select own" ON "public"."user_settings" FOR SELECT TO "authenticated" USING ("public"."_is_owner"("user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_is_owner"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."_is_owner"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_is_owner"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_feedback_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_feedback_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_feedback_user_id"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_events" TO "anon";
GRANT ALL ON TABLE "public"."activity_events" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_events" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ai_sessions" TO "anon";
GRANT ALL ON TABLE "public"."ai_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_focus" TO "anon";
GRANT ALL ON TABLE "public"."daily_focus" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_focus" TO "service_role";



GRANT ALL ON TABLE "public"."feature_votes" TO "anon";
GRANT ALL ON TABLE "public"."feature_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_votes" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."financial_assets" TO "anon";
GRANT ALL ON TABLE "public"."financial_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_assets" TO "service_role";



GRANT ALL ON TABLE "public"."financial_expenses" TO "anon";
GRANT ALL ON TABLE "public"."financial_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."financial_incomes" TO "anon";
GRANT ALL ON TABLE "public"."financial_incomes" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_incomes" TO "service_role";



GRANT ALL ON TABLE "public"."financial_liabilities" TO "anon";
GRANT ALL ON TABLE "public"."financial_liabilities" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_liabilities" TO "service_role";



GRANT ALL ON TABLE "public"."financial_monthly_statements" TO "anon";
GRANT ALL ON TABLE "public"."financial_monthly_statements" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_monthly_statements" TO "service_role";



GRANT ALL ON TABLE "public"."financial_net_worth_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."financial_net_worth_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_net_worth_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."financial_settings" TO "anon";
GRANT ALL ON TABLE "public"."financial_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_settings" TO "service_role";



GRANT ALL ON TABLE "public"."goal_milestones" TO "anon";
GRANT ALL ON TABLE "public"."goal_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."goal_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."life_areas" TO "anon";
GRANT ALL ON TABLE "public"."life_areas" TO "authenticated";
GRANT ALL ON TABLE "public"."life_areas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."life_areas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."life_areas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."life_areas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."next_step_entries" TO "anon";
GRANT ALL ON TABLE "public"."next_step_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."next_step_entries" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_inquiries" TO "anon";
GRANT ALL ON TABLE "public"."project_inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."project_inquiries" TO "service_role";



GRANT ALL ON TABLE "public"."reflections" TO "anon";
GRANT ALL ON TABLE "public"."reflections" TO "authenticated";
GRANT ALL ON TABLE "public"."reflections" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."user_life_area_scores" TO "anon";
GRANT ALL ON TABLE "public"."user_life_area_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."user_life_area_scores" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";









RESET ALL;
