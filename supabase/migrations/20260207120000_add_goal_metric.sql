-- Add metric tracking to goals - DONE
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS metric_target integer,
ADD COLUMN IF NOT EXISTS metric_opt_out boolean DEFAULT false NOT NULL;
