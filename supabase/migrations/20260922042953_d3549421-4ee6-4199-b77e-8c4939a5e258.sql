ALTER TABLE public.safety_analyses
  ADD COLUMN IF NOT EXISTS unsafe_act_condition text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS why_flagged text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS suggested_action text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_priority text NOT NULL DEFAULT 'Medium';

UPDATE public.safety_analyses SET why_flagged = explanation WHERE why_flagged = '';
UPDATE public.safety_analyses SET suggested_action = recommended_focus WHERE suggested_action = '';
UPDATE public.safety_analyses SET review_priority = CASE WHEN sif_potential AND sif_level = 'High' THEN 'High' WHEN sif_potential THEN 'Medium' ELSE 'Low' END;

ALTER TABLE public.safety_reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'HSE Validated',
  ADD COLUMN IF NOT EXISTS corrected_rule text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS assigned_action text NOT NULL DEFAULT '';

ALTER TABLE public.safety_reviews DROP CONSTRAINT IF EXISTS safety_reviews_status_check;
ALTER TABLE public.safety_reviews ADD CONSTRAINT safety_reviews_status_check
  CHECK (status IN ('Pending HSE Review','HSE Validated','Needs Correction','Action Assigned','Closed'));