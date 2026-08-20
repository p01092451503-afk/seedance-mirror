CREATE TABLE public.characters (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.characters TO anon, authenticated;
GRANT ALL ON public.characters TO service_role;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters open access" ON public.characters FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.character_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.character_images TO anon, authenticated;
GRANT ALL ON public.character_images TO service_role;
ALTER TABLE public.character_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_images open access" ON public.character_images FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.styles (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.styles TO anon, authenticated;
GRANT ALL ON public.styles TO service_role;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "styles open access" ON public.styles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.style_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id text NOT NULL REFERENCES public.styles(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_images TO anon, authenticated;
GRANT ALL ON public.style_images TO service_role;
ALTER TABLE public.style_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "style_images open access" ON public.style_images FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id text NOT NULL,
  counter integer NOT NULL,
  batch_index integer NOT NULL DEFAULT 0,
  compiled_prompt text,
  final_prompt text,
  sent_prompt text,
  aspect_ratio text,
  api_size text,
  input_image_count integer NOT NULL DEFAULT 0,
  result_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  log_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO anon, authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generations open access" ON public.generations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.work_counters (
  work_id text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_counters TO anon, authenticated;
GRANT ALL ON public.work_counters TO service_role;
ALTER TABLE public.work_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "work_counters open access" ON public.work_counters FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.next_work_counter(_work_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
GRANT EXECUTE ON FUNCTION public.next_work_counter(text) TO anon, authenticated, service_role;

CREATE POLICY "reference files open read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id IN ('references', 'history'));
CREATE POLICY "reference files open insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id IN ('references', 'history'));
CREATE POLICY "reference files open update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id IN ('references', 'history'));
CREATE POLICY "reference files open delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id IN ('references', 'history'));