-- Create work_examples table for portfolio cases
CREATE TABLE public.work_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  before_image_url TEXT NOT NULL,
  after_image_url TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  city TEXT,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.work_examples ENABLE ROW LEVEL SECURITY;

-- Public can view published examples
CREATE POLICY "Anyone can view published work examples"
ON public.work_examples
FOR SELECT
USING (is_published = true);

-- Admins can manage all examples
CREATE POLICY "Admins can manage work examples"
ON public.work_examples
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_work_examples_updated_at
BEFORE UPDATE ON public.work_examples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for work examples images
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-examples', 'work-examples', true);

-- Storage policies for work examples bucket
CREATE POLICY "Anyone can view work examples images"
ON storage.objects FOR SELECT
USING (bucket_id = 'work-examples');

CREATE POLICY "Admins can upload work examples images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'work-examples' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update work examples images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'work-examples' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete work examples images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'work-examples' 
  AND public.has_role(auth.uid(), 'admin')
);