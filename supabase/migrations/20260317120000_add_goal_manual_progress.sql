-- Add manual progress tracking for goals DONE
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS metric_manual_tracking boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS metric_manual_progress numeric;
