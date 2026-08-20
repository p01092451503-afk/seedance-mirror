CREATE OR REPLACE FUNCTION public.next_work_counter(_work_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  next_val integer;
BEGIN
  INSERT INTO public.work_counters (work_id, value)
  VALUES (_work_id, 1)
  ON CONFLICT (work_id) DO UPDATE SET value = public.work_counters.value + 1
  RETURNING value INTO next_val;
  RETURN next_val;
END;
$$;