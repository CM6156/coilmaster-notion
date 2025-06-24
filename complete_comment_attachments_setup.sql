-- =============================================
-- 댓글 첨부파일 시스템 완전 설정 스크립트
-- =============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. 댓글 첨부파일 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS public.task_comment_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.task_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment_id ON public.task_comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_uploaded_by ON public.task_comment_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_created_at ON public.task_comment_attachments(created_at);

-- 업데이트 트리거 설정
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_comment_attachments_updated_at ON public.task_comment_attachments;
CREATE TRIGGER update_comment_attachments_updated_at 
    BEFORE UPDATE ON public.task_comment_attachments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 설정
ALTER TABLE public.task_comment_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.task_comment_attachments;
CREATE POLICY "Allow authenticated users full access" 
ON public.task_comment_attachments 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- =============================================
-- 2. task-files 스토리지 버킷 생성
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  true,  -- 공개 접근 허용
  52428800, -- 50MB
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed',
    'application/json',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================
-- 3. 스토리지 정책 설정
-- =============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "task_files_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "task_files_delete_policy" ON storage.objects;

-- 새 정책 생성
CREATE POLICY "task_files_select_policy" ON storage.objects
  FOR SELECT USING (bucket_id = 'task-files');

CREATE POLICY "task_files_insert_policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "task_files_update_policy" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "task_files_delete_policy" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-files' 
    AND auth.role() = 'authenticated'
  );

-- =============================================
-- 4. 설정 완료 확인
-- =============================================

-- 테이블 확인
SELECT 
  '✅ 테이블 설정 완료' as step,
  table_name,
  CASE 
    WHEN table_name = 'task_comments' THEN '💬 댓글 테이블'
    WHEN table_name = 'task_comment_attachments' THEN '📎 첨부파일 테이블'
  END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('task_comments', 'task_comment_attachments')
ORDER BY table_name;

-- 스토리지 버킷 확인
SELECT 
  '✅ 스토리지 버킷 설정 완료' as step,
  id as bucket_name,
  public as is_public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'task-files';

-- 스토리지 정책 확인
SELECT 
  '✅ 스토리지 정책 설정 완료' as step,
  COUNT(*) as policy_count,
  string_agg(cmd, ', ') as operations
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%task_files%';

-- 최종 완료 메시지
SELECT 
  '🎉 댓글 첨부파일 시스템 설정이 완전히 완료되었습니다!' as message,
  '이제 댓글에 파일을 첨부하고 표시할 수 있습니다.' as description,
  NOW() as completed_at; 