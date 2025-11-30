-- Add quality assessment fields to existing datasets table
ALTER TABLE public.datasets 
ADD COLUMN IF NOT EXISTS quality_score numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quality_label text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suggested_price numeric DEFAULT NULL;

-- Create indexes on quality_score for marketplace filtering/sorting
CREATE INDEX IF NOT EXISTS idx_datasets_quality_score ON public.datasets(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_datasets_quality_label ON public.datasets(quality_label);
CREATE INDEX IF NOT EXISTS idx_datasets_uploader ON public.datasets(uploader_address);
CREATE INDEX IF NOT EXISTS idx_purchases_dataset ON public.purchases(dataset_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON public.purchases(buyer_address);

-- Add comments to explain purpose
COMMENT ON COLUMN public.datasets.quality_score IS 'AI-predicted data quality score (0-100) from QualityAnalyzer';
COMMENT ON COLUMN public.datasets.quality_label IS 'Human-readable quality label (Excellent, Good, Fair, Poor, Critical)';
COMMENT ON COLUMN public.datasets.suggested_price IS 'Analyzer-suggested price based on dataset quality and size';
