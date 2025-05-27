-- 프로젝트 이미지 및 파일 저장 테이블 생성

-- 파일 저장소 테이블 (공통)
CREATE TABLE public.files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 프로젝트 이미지 테이블
CREATE TABLE public.project_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  is_main_image BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 프로젝트 첨부파일 테이블
CREATE TABLE public.project_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX idx_files_created_at ON public.files(created_at);
CREATE INDEX idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX idx_project_images_is_main ON public.project_images(is_main_image);
CREATE INDEX idx_project_attachments_project_id ON public.project_attachments(project_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON public.files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_images_updated_at 
    BEFORE UPDATE ON public.project_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_attachments_updated_at 
    BEFORE UPDATE ON public.project_attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

-- 파일 정책
CREATE POLICY "Users can read files" ON public.files
  FOR SELECT USING (true);

CREATE POLICY "Users can upload files" ON public.files
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own files" ON public.files
  FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage all files" ON public.files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 프로젝트 이미지 정책
CREATE POLICY "Users can read project images" ON public.project_images
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage project images" ON public.project_images
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 프로젝트 첨부파일 정책
CREATE POLICY "Users can read project attachments" ON public.project_attachments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage project attachments" ON public.project_attachments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 테이블 코멘트
COMMENT ON TABLE public.files IS '파일 저장소 (공통)';
COMMENT ON TABLE public.project_images IS '프로젝트 이미지';
COMMENT ON TABLE public.project_attachments IS '프로젝트 첨부파일';

-- 프로젝트 테이블에 메인 이미지 URL 컬럼 추가 (기존 호환성 유지)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS main_image_url TEXT;

-- 프로젝트 테이블 코멘트 업데이트
COMMENT ON COLUMN public.projects.main_image_url IS '메인 이미지 URL (임시, 나중에 project_images 테이블로 이관)'; 